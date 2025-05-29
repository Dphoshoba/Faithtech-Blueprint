const { Subscription } = require('../models');

const subscriptionAccess = (requiredPlanName) => {
  return async (req, res, next) => {
    const subscription = await Subscription.findOne({ user: req.user._id }).populate('plan');
    if (!subscription || subscription.plan.name !== requiredPlanName) {
      return res.status(403).json({ error: `Requires ${requiredPlanName} plan` });
    }
    next();
  };
};

module.exports = subscriptionAccess; 