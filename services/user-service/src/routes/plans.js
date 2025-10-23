const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');
const auth = require('../middleware/auth');

// Get all public plans
router.get('/', async (req, res, next) => {
  try {
    const { featured } = req.query;

    let plans;
    if (featured === 'true') {
      plans = await SubscriptionPlan.getFeaturedPlans();
    } else {
      plans = await SubscriptionPlan.getPublicPlans();
    }

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
});

// Get specific plan by ID or planId
router.get('/:id', async (req, res, next) => {
  try {
    let plan;

    // Try to find by MongoDB _id first
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await SubscriptionPlan.findById(req.params.id);
    }

    // If not found, try by planId (e.g., 'free', 'basic')
    if (!plan) {
      plan = await SubscriptionPlan.findOne({ planId: req.params.id, active: true });
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// Create a new plan (admin only)
router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const plan = await SubscriptionPlan.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// Update a plan (admin only)
router.put('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate a plan (admin only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan deactivated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// Compare plans
router.post('/compare', async (req, res, next) => {
  try {
    const { planIds } = req.body;

    if (!planIds || !Array.isArray(planIds) || planIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 plan IDs to compare'
      });
    }

    const plans = await SubscriptionPlan.find({
      planId: { $in: planIds },
      active: true
    }).sort({ 'price.monthly': 1 });

    if (plans.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'Not enough valid plans found for comparison'
      });
    }

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
