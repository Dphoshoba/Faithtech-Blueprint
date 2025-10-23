const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const AssessmentResponse = require('../models/AssessmentResponse');
const auth = require('../middleware/auth');
const { calculateAssessmentScore, generateFeedback } = require('../services/scoringService');

// Get all published assessments (paginated)
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      difficulty,
      tier,
      status = 'published',
      search
    } = req.query;

    const query = { status };

    // Apply filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (tier) query.tier = tier;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .select('-questions') // Don't return full questions in list view
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Assessment.countDocuments(query)
    ]);

    res.json({
      data: assessments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// Get single assessment by ID
router.get('/:id', async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

// Create new assessment (protected route)
router.post('/', auth, async (req, res, next) => {
  try {
    const assessmentData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'draft'
    };

    const assessment = await Assessment.create(assessmentData);

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

// Update assessment (protected route)
router.put('/:id', auth, async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check ownership or admin
    if (assessment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assessment'
      });
    }

    Object.assign(assessment, req.body);
    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

// Publish assessment (protected route)
router.post('/:id/publish', auth, async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check ownership or admin
    if (assessment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this assessment'
      });
    }

    await assessment.publish();

    res.json({
      success: true,
      message: 'Assessment published successfully',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
});

// Start assessment (protected route)
router.post('/:id/start', auth, async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Assessment is not published'
      });
    }

    // Create a new response
    const response = await AssessmentResponse.create({
      assessment: assessment._id,
      user: req.user._id,
      assessmentVersion: assessment.version,
      maxScore: assessment.scoring.maxScore,
      expiresAt: assessment.timeLimit ? new Date(Date.now() + assessment.timeLimit * 60 * 1000) : null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Assessment started',
      data: {
        responseId: response._id,
        assessment: {
          id: assessment._id,
          title: assessment.title,
          timeLimit: assessment.timeLimit,
          totalQuestions: assessment.totalQuestions,
          questions: assessment.questions
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit answer to question (protected route)
router.post('/:id/responses/:responseId/answer', auth, async (req, res, next) => {
  try {
    const { questionId, answer, timeSpent } = req.body;

    const response = await AssessmentResponse.findOne({
      _id: req.params.responseId,
      user: req.user._id,
      status: 'in_progress'
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Assessment response not found or already completed'
      });
    }

    // TODO: Calculate score based on assessment scoring rules
    const score = 0; // Placeholder

    await response.addResponse(questionId, answer, score, timeSpent || 0);

    res.json({
      success: true,
      message: 'Answer saved',
      data: {
        questionId,
        saved: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// Complete assessment (protected route)
router.post('/:id/responses/:responseId/complete', auth, async (req, res, next) => {
  try {
    const response = await AssessmentResponse.findOne({
      _id: req.params.responseId,
      user: req.user._id,
      status: 'in_progress'
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Assessment response not found or already completed'
      });
    }

    // Get the assessment to calculate scores
    const assessment = await Assessment.findById(response.assessment);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Calculate scores using the scoring service
    const scoringResult = calculateAssessmentScore(assessment, response.responses);
    const feedback = generateFeedback(scoringResult, assessment);

    // Update response with calculated scores
    response.totalScore = scoringResult.totalScore;
    response.maxScore = scoringResult.maxScore;
    response.percentage = scoringResult.percentage;
    response.passed = scoringResult.percentage >= assessment.scoring?.passingScore || 70;
    response.results = {
      summary: feedback.overallFeedback,
      strengths: feedback.strengths,
      areasForImprovement: feedback.areasForImprovement,
      recommendations: feedback.recommendations,
      detailedFeedback: feedback.detailedFeedback
    };

    // Complete the assessment
    await response.complete();

    res.json({
      success: true,
      message: 'Assessment completed',
      data: {
        responseId: response._id,
        totalScore: response.totalScore,
        maxScore: response.maxScore,
        percentage: response.percentage,
        passed: response.passed,
        results: response.results,
        scoringBreakdown: scoringResult.questionScores,
        categoryScores: scoringResult.categoryScores,
        summary: scoringResult.summary
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's assessment history (protected route)
router.get('/my/history', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const responses = await AssessmentResponse.getUserHistory(req.user._id, {
      status,
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    });

    const total = await AssessmentResponse.countDocuments({
      user: req.user._id,
      ...(status && { status })
    });

    res.json({
      success: true,
      data: responses,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// Get assessment statistics (admin only)
router.get('/:id/stats', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const stats = await AssessmentResponse.getAssessmentStats(req.params.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Delete assessment (admin or owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check ownership or admin
    if (assessment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assessment'
      });
    }

    // Archive instead of delete
    await assessment.archive();

    res.json({
      success: true,
      message: 'Assessment archived successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
