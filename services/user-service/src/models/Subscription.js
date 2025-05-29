const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    required: true,
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing'],
    required: true,
    default: 'active'
  },
  features: {
    maxUsers: {
      type: Number,
      required: true,
      default: 1
    },
    maxTemplates: {
      type: Number,
      required: true,
      default: 3
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    whiteLabeling: {
      type: Boolean,
      default: false
    }
  },
  billing: {
    customerId: String,
    subscriptionId: String,
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    activeUsers: {
      type: Number,
      default: 0
    },
    activeTemplates: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number, // in bytes
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    meteredUsage: {
      type: Map,
      of: {
        current: Number,
        lastSync: Date,
        billingMode: {
          type: String,
          enum: ['metered', 'licensed', 'graduated'],
          default: 'licensed'
        },
        tiers: [{
          upTo: Number,
          unitPrice: Number,
          flatFee: Number
        }]
      },
      default: new Map()
    }
  },
  metadata: {
    lastUpdated: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ organization: 1 }, { unique: true });
subscriptionSchema.index({ 'billing.customerId': 1 });
subscriptionSchema.index({ status: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return ['active', 'trialing'].includes(this.status);
});

// Methods
subscriptionSchema.methods.hasFeature = function(featureName) {
  const featureMap = {
    free: ['maxUsers:1', 'maxTemplates:3'],
    basic: ['maxUsers:5', 'maxTemplates:10', 'analytics'],
    pro: ['maxUsers:20', 'maxTemplates:50', 'analytics', 'customDomain', 'prioritySupport'],
    enterprise: ['maxUsers:unlimited', 'maxTemplates:unlimited', 'analytics', 'customDomain', 'prioritySupport', 'whiteLabeling']
  };

  const planFeatures = featureMap[this.plan];
  return planFeatures.includes(featureName);
};

subscriptionSchema.methods.canAddUser = function() {
  if (this.plan === 'enterprise') return true;
  return this.usage.activeUsers < this.features.maxUsers;
};

subscriptionSchema.methods.canAddTemplate = function() {
  if (this.plan === 'enterprise') return true;
  return this.usage.activeTemplates < this.features.maxTemplates;
};

subscriptionSchema.methods.updateUsage = async function() {
  const Organization = mongoose.model('Organization');
  const Template = mongoose.model('Template');

  const [userCount, templateCount] = await Promise.all([
    Organization.countDocuments({ _id: this.organization, 'users.active': true }),
    Template.countDocuments({ organization: this.organization, status: { $ne: 'archived' } })
  ]);

  this.usage.activeUsers = userCount;
  this.usage.activeTemplates = templateCount;
  this.metadata.lastUpdated = new Date();

  await this.save();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 