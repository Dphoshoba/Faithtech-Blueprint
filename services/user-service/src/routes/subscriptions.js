const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserSubscription = require('../models/UserSubscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');

// Get current user's subscription
router.get('/current', auth, async (req, res, next) => {
  try {
    let subscription = await UserSubscription.getActiveSubscription(req.user._id);

    // If no subscription exists, create a free plan subscription
    if (!subscription) {
      const freePlan = await SubscriptionPlan.findOne({ planId: 'free', active: true });

      if (!freePlan) {
        return res.status(500).json({
          success: false,
          message: 'Free plan not found. Please contact support.'
        });
      }

      // Create free subscription
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 100); // Free plan never expires

      subscription = await UserSubscription.create({
        user: req.user._id,
        plan: freePlan._id,
        planId: freePlan.planId,
        status: 'active',
        currentPeriodEnd: periodEnd,
        amount: 0,
        billingCycle: 'lifetime',
        autoRenew: false
      });

      await subscription.populate('plan');
    }

    // Return subscription with plan details
    res.json({
      success: true,
      data: {
        id: subscription._id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isTrialing: subscription.isTrialing,
        trialEnd: subscription.trialEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        usage: subscription.usage,
        limits: subscription.plan.limits,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
        nextBillingDate: subscription.nextBillingDate,
        plan: {
          name: subscription.plan.name,
          tier: subscription.plan.tier,
          features: subscription.plan.features
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all available plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.getPublicPlans();

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
});

// Get specific plan details
router.get('/plans/:planId', async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findOne({
      planId: req.params.planId,
      active: true
    });

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

// Subscribe to a plan
router.post('/subscribe', auth, async (req, res, next) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Find the plan
    const plan = await SubscriptionPlan.findOne({ planId, active: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user already has an active subscription
    let existingSubscription = await UserSubscription.getActiveSubscription(req.user._id);

    if (existingSubscription && existingSubscription.planId === planId) {
      return res.status(400).json({
        success: false,
        message: 'You are already subscribed to this plan'
      });
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else if (billingCycle === 'lifetime') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 100);
    }

    // Check if plan has a trial
    const trialEnd = plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null;

    // Cancel existing subscription if any
    if (existingSubscription) {
      await existingSubscription.cancel(true, 'Upgraded/downgraded to another plan');
    }

    // Create new subscription
    const newSubscription = await UserSubscription.create({
      user: req.user._id,
      plan: plan._id,
      planId: plan.planId,
      status: trialEnd ? 'trialing' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialStart: trialEnd ? now : undefined,
      trialEnd: trialEnd,
      isTrialing: !!trialEnd,
      amount: plan.price[billingCycle] || plan.price.monthly,
      currency: plan.price.currency,
      billingCycle,
      nextBillingDate: trialEnd || periodEnd
    });

    await newSubscription.populate('plan');

    // Update user's subscription reference
    await User.findByIdAndUpdate(req.user._id, {
      'subscription.planId': planId,
      'subscription.status': newSubscription.status,
      'subscription.startDate': now,
      'subscription.endDate': periodEnd
    });

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to ${plan.name}`,
      data: {
        subscription: newSubscription,
        trial: trialEnd ? {
          active: true,
          endsAt: trialEnd,
          daysRemaining: plan.trialDays
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res, next) => {
  try {
    const { immediately = false, reason } = req.body;

    const subscription = await UserSubscription.getActiveSubscription(req.user._id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    if (subscription.planId === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel free plan'
      });
    }

    await subscription.cancel(immediately, reason);

    res.json({
      success: true,
      message: immediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the current billing period',
      data: {
        status: subscription.status,
        canceledAt: subscription.canceledAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    next(error);
  }
});

// Reactivate cancelled subscription
router.post('/reactivate', auth, async (req, res, next) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      $or: [{ status: 'cancelled' }, { cancelAtPeriodEnd: true }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No cancelled subscription found'
      });
    }

    await subscription.reactivate();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update payment method
router.put('/payment-method', auth, async (req, res, next) => {
  try {
    const { paymentMethodId, type, last4, brand, expiryMonth, expiryYear } = req.body;

    const subscription = await UserSubscription.getActiveSubscription(req.user._id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Update payment method
    subscription.paymentMethod = {
      type: type || 'card',
      last4,
      brand,
      expiryMonth,
      expiryYear
    };

    await subscription.save();

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: {
        paymentMethod: subscription.paymentMethod
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get subscription usage
router.get('/usage', auth, async (req, res, next) => {
  try {
    const subscription = await UserSubscription.getActiveSubscription(req.user._id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const usageDetails = {
      assessments: await subscription.checkUsageLimit('assessments'),
      templates: await subscription.checkUsageLimit('templates'),
      apiCalls: await subscription.checkUsageLimit('apiCalls'),
      storage: await subscription.checkUsageLimit('storage')
    };

    res.json({
      success: true,
      data: {
        planId: subscription.planId,
        usage: subscription.usage,
        limits: subscription.plan.limits,
        details: usageDetails,
        resetDate: subscription.usage.lastResetDate
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get subscription history
router.get('/history', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscriptions, total] = await Promise.all([
      UserSubscription.find({ user: req.user._id })
        .populate('plan', 'name tier')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      UserSubscription.countDocuments({ user: req.user._id })
    ]);

    res.json({
      success: true,
      data: subscriptions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
