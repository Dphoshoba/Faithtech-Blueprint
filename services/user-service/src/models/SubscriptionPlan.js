const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    maxlength: 500
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  price: {
    monthly: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    yearly: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    }
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    included: {
      type: Boolean,
      default: true
    }
  }],
  limits: {
    assessments: {
      type: Number,
      default: 10,
      min: -1 // -1 means unlimited
    },
    templates: {
      type: Number,
      default: 5,
      min: -1 // -1 means unlimited
    },
    apiCalls: {
      type: Number,
      default: 1000,
      min: -1 // -1 means unlimited
    },
    storage: {
      type: Number, // in GB
      default: 1,
      min: -1 // -1 means unlimited
    },
    users: {
      type: Number,
      default: 1,
      min: -1 // -1 means unlimited
    },
    organizations: {
      type: Number,
      default: 1,
      min: -1 // -1 means unlimited
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    whiteLabeling: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    }
  },
  // Stripe integration
  stripeProductId: {
    type: String,
    default: null
  },
  stripePriceId: {
    monthly: String,
    yearly: String
  },
  // Status and visibility
  active: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  popular: {
    type: Boolean,
    default: false
  },
  // Trial configuration
  trialDays: {
    type: Number,
    default: 0,
    min: 0
  },
  // Metadata
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes (planId already has unique index from schema definition)
subscriptionPlanSchema.index({ tier: 1, active: 1 });
subscriptionPlanSchema.index({ featured: 1, order: 1 });

// Virtual for annual savings
subscriptionPlanSchema.virtual('annualSavings').get(function() {
  if (this.price.monthly === 0) return 0;
  const monthlyCost = this.price.monthly * 12;
  return monthlyCost - this.price.yearly;
});

// Method to check if plan has feature
subscriptionPlanSchema.methods.hasFeature = function(featureName) {
  return this.features.some(f => f.name === featureName && f.included);
};

// Method to check if plan allows certain limit
subscriptionPlanSchema.methods.checkLimit = function(limitType, value) {
  const limit = this.limits[limitType];
  if (limit === undefined) return true; // No limit defined
  if (limit === -1) return true; // Unlimited
  return value <= limit;
};

// Static method to get active public plans
subscriptionPlanSchema.statics.getPublicPlans = function() {
  return this.find({ active: true, isPublic: true }).sort({ order: 1, 'price.monthly': 1 });
};

// Static method to get plan by tier
subscriptionPlanSchema.statics.findByTier = function(tier) {
  return this.findOne({ tier, active: true });
};

// Static method to get featured plans
subscriptionPlanSchema.statics.getFeaturedPlans = function() {
  return this.find({ active: true, isPublic: true, featured: true }).sort({ order: 1 });
};

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;

