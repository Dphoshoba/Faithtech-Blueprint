const Assessment = require('../models/Assessment');
const AssessmentResponse = require('../models/AssessmentResponse');
const { AppError } = require('../utils/errors');
const { generateRecommendations } = require('../utils/recommendations');

// Create new assessment
exports.createAssessment = async (req, res) => {
  try {
    const assessment = new Assessment({
      ...req.body,
      createdBy: req.user._id,
      organization: req.user.organization
    });

    await assessment.save();
    res.status(201).json({
      status: 'success',
      data: assessment
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all assessments for an organization
exports.getAssessments = async (req, res) => {
  try {
    const filters = {
      organization: req.user.organization
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.type) {
      filters.type = req.query.type;
    }

    const assessments = await Assessment.find(filters)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');

    res.json({
      status: 'success',
      results: assessments.length,
      data: assessments
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single assessment
exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      organization: req.user.organization
    }).populate('createdBy', 'firstName lastName email');

    if (!assessment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found'
      });
    }

    res.json({
      status: 'success',
      data: assessment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update assessment
exports.updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!assessment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found'
      });
    }

    // Prevent updating if assessment is published
    if (assessment.status === 'published' && req.body.status !== 'archived') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify a published assessment'
      });
    }

    // If updating questions, increment version
    if (req.body.questions) {
      assessment.version += 1;
    }

    Object.assign(assessment, req.body);
    await assessment.save();

    res.json({
      status: 'success',
      data: assessment
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete assessment
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!assessment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found'
      });
    }

    // Check if there are any responses
    const responseCount = await AssessmentResponse.countDocuments({
      assessment: assessment._id
    });

    if (responseCount > 0) {
      // If responses exist, archive instead of delete
      assessment.status = 'archived';
      await assessment.save();

      return res.json({
        status: 'success',
        message: 'Assessment archived due to existing responses'
      });
    }

    await assessment.deleteOne();
    res.json({
      status: 'success',
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Submit assessment response
exports.submitResponse = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found'
      });
    }

    // Create response
    const response = new AssessmentResponse({
      assessment: assessment._id,
      respondent: req.user._id,
      organization: req.user.organization,
      answers: req.body.answers
    });

    // Calculate scores
    await response.calculateScores();

    // Generate recommendations
    const recommendations = await generateRecommendations(response);
    response.categoryScores.forEach((category, index) => {
      category.recommendations = recommendations[category.name] || [];
    });

    if (response.overallScore.percentage >= 0) {
      response.status = 'completed';
      response.completedAt = new Date();
    }

    await response.save();

    res.status(201).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}; 