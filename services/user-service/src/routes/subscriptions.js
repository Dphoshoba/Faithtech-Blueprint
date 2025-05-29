const express = require('express');
const router = express.Router();
const { User, Subscription, Plan } = require('../models');
const auth = require('../middleware/auth');
const subscriptionAccess = require('../middleware/subscriptionAccess');

// Middleware to get user from token (dummy for now)
const getUser = async (req, res, next) => {
  // In production, extract user from JWT
  req.user = await User.findOne(); // Replace with real user lookup
  next();
};

// Mock data for subscriptions
const subscriptions = new Map();

// Get user's subscription
router.get('/me', auth, async (req, res) => {
  try {
    const subscription = subscriptions.get(req.user.id) || null;
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
});

// Subscribe to a plan
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    const subscription = {
      userId: req.user.id,
      planId,
      startDate: new Date(),
      status: 'active'
    };

    subscriptions.set(req.user.id, subscription);
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error: error.message });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = subscriptions.get(req.user.id);
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    subscriptions.set(req.user.id, subscription);

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
  }
});

// Example: Only Pro users can access this route
router.get('/pro-feature', auth, subscriptionAccess('Pro'), (req, res) => {
  res.json({ message: 'Welcome, Pro user!' });
});

module.exports = router; 