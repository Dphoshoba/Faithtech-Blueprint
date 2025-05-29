const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock data for plans
const plans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    features: ['Feature 1', 'Feature 2']
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 19.99,
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']
  }
];

// Get all plans
router.get('/', async (req, res) => {
  try {
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
});

// Get plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = plans.find(p => p.id === req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plan', error: error.message });
  }
});

module.exports = router; 
module.exports = router; 