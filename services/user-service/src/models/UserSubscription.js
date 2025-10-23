const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trialing', 'past_due'],
    default: 'active',
    required: true
  },
  // Billing period
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  // Trial information
  trialStart: Date,
  trialEnd: Date,
  isTrialing: {
    type: Boolean,
    default: false
  },
  // Cancellation
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: Date,
  cancellationReason: String,
  // Usage tracking
  usage: {
    assessments: {
      type: Number,
      default: 0,
      min: 0
    },
    templates: {
      type: Number,
      default: 0,
      min: 0
    },
    apiCalls: {
      type: Number,
      default: 0,
      min: 0
    },
    storage: {
      type: Number, // in bytes
      default: 0,
      min: 0
    },
    // Reset tracking
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    resetPeriod: {
      type: String,
      enum: ['monthly', 'yearly', 'never'],
      default: 'monthly'
    }
  },
  // Payment information
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank', 'paypal', 'other'],
      default: 'card'
    },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  // Billing
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  // Renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  nextBillingDate: Date,
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  notes: String
}, {
  timestamps: true
});

// Compound indexes
userSubscriptionSchema.index({ user: 1, status: 1 });
userSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
userSubscriptionSchema.index({ stripeSubscriptionId: 1 });

// Pre-save middleware to calculate next period end
userSubscriptionSchema.pre('save', function(next) {
  // Check if subscription has expired
  if (this.currentPeriodEnd < new Date() && this.status === 'active') {
    if (!this.autoRenew || this.cancelAtPeriodEnd) {
      this.status = 'expired';
    } else {
      // Auto-renew: set new period
      this.currentPeriodStart = this.currentPeriodEnd;
      if (this.billingCycle === 'monthly') {
        this.currentPeriodEnd = new Date(this.currentPeriodEnd.setMonth(this.currentPeriodEnd.getMonth() + 1));
      } else if (this.billingCycle === 'yearly') {
        this.currentPeriodEnd = new Date(this.currentPeriodEnd.setFullYear(this.currentPeriodEnd.getFullYear() + 1));
      }
      this.nextBillingDate = this.currentPeriodEnd;
    }
  }
  
  // Check trial status
  if (this.isTrialing && this.trialEnd && this.trialEnd < new Date()) {
    this.isTrialing = false;
  }
  
  next();
});

// Method to cancel subscription
userSubscriptionSchema.methods.cancel = function(immediately = false, reason = null) {
  if (immediately) {
    this.status = 'cancelled';
    this.canceledAt = new Date();
  } else {
    this.cancelAtPeriodEnd = true;
  }
  
  if (reason) {
    this.cancellationReason = reason;
  }
  
  return this.save();
};

// Method to reactivate subscription
userSubscriptionSchema.methods.reactivate = function() {
  if (this.status === 'cancelled' || this.cancelAtPeriodEnd) {
    this.status = 'active';
    this.cancelAtPeriodEnd = false;
    this.canceledAt = null;
    return this.save();
  }
  throw new Error('Subscription cannot be reactivated');
};

// Method to upgrade/downgrade plan
userSubscriptionSchema.methods.changePlan = async function(newPlanId) {
  const SubscriptionPlan = mongoose.model('SubscriptionPlan');
  const newPlan = await SubscriptionPlan.findOne({ planId: newPlanId, active: true });
  
  if (!newPlan) {
    throw new Error('Invalid plan');
  }
  
  this.plan = newPlan._id;
  this.planId = newPlan.planId;
  this.amount = newPlan.price[this.billingCycle] || newPlan.price.monthly;
  
  return this.save();
};

// Method to check usage limit
userSubscriptionSchema.methods.checkUsageLimit = async function(limitType) {
  const SubscriptionPlan = mongoose.model('SubscriptionPlan');
  const plan = await SubscriptionPlan.findById(this.plan);
  
  if (!plan) {
    throw new Error('Plan not found');
  }
  
  const limit = plan.limits[limitType];
  const currentUsage = this.usage[limitType] || 0;
  
  // -1 or Infinity means unlimited
  if (limit === -1 || limit === Infinity) {
    return { allowed: true, limit: Infinity, current: currentUsage, remaining: Infinity };
  }
  
  const allowed = currentUsage < limit;
  const remaining = Math.max(0, limit - currentUsage);
  
  return { allowed, limit, current: currentUsage, remaining };
};

// Method to increment usage
userSubscriptionSchema.methods.incrementUsage = function(limitType, amount = 1) {
  if (!this.usage[limitType]) {
    this.usage[limitType] = 0;
  }
  this.usage[limitType] += amount;
  return this.save();
};

// Method to reset usage (for monthly/yearly reset)
userSubscriptionSchema.methods.resetUsage = function() {
  this.usage.assessments = 0;
  this.usage.templates = 0;
  this.usage.apiCalls = 0;
  this.usage.storage = 0;
  this.usage.lastResetDate = new Date();
  return this.save();
};

// Static method to get active subscription for user
userSubscriptionSchema.statics.getActiveSubscription = function(userId) {
  return this.findOne({ 
    user: userId, 
    status: { $in: ['active', 'trialing'] } 
  }).populate('plan');
};

// Static method to check for expiring subscriptions
userSubscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    status: 'active',
    autoRenew: false,
    currentPeriodEnd: { $lte: expiryDate }
  }).populate('user', 'email firstName lastName');
};

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);

module.exports = UserSubscription;

