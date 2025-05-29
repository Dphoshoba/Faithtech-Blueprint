const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');

// Get all assessments for a church
router.get('/', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({ churchId: req.user._id });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new assessment
router.post('/', [
  auth,
  body('digitalPresence').optional(),
  body('administrativeSystems').optional(),
  body('ministryImpact').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assessment = new Assessment({
      churchId: req.user._id,
      ...req.body
    });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific assessment
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      churchId: req.user._id
    });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update assessment
router.put('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, churchId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assessment
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndDelete({
      _id: req.params.id,
      churchId: req.user._id
    });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate recommendations
router.post('/:id/recommendations', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      churchId: req.user._id
    });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Generate recommendations based on assessment data
    const recommendations = generateRecommendations(assessment);
    assessment.recommendations = recommendations;
    await assessment.save();

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate recommendations
function generateRecommendations(assessment) {
  const recommendations = [];

  // Digital Presence recommendations
  if (!assessment.digitalPresence.website.exists) {
    recommendations.push({
      category: 'Digital Presence',
      priority: 1,
      description: 'Implement a church website',
      resources: ['WordPress', 'Squarespace', 'Wix'],
      timeline: '1-2 months'
    });
  }

  // Administrative Systems recommendations
  if (!assessment.administrativeSystems.churchManagement.system) {
    recommendations.push({
      category: 'Administrative Systems',
      priority: 2,
      description: 'Implement a church management system',
      resources: ['Planning Center', 'Church Community Builder', 'Fellowship One'],
      timeline: '2-3 months'
    });
  }

  // Ministry Impact recommendations
  if (!assessment.ministryImpact.discipleship.onlineResources) {
    recommendations.push({
      category: 'Ministry Impact',
      priority: 3,
      description: 'Develop online discipleship resources',
      resources: ['RightNow Media', 'Bible Project', 'YouVersion'],
      timeline: '3-4 months'
    });
  }

  return recommendations;
}

module.exports = router; 