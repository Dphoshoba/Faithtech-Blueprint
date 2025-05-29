const mongoose = require('mongoose');

const subscriptionAnalyticsSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  usage: {
    users: [{
      count: Number,
      timestamp: Date
    }],
    templates: [{
      count: Number,
      timestamp: Date
    }],
    storage: [{
      bytes: Number,
      timestamp: Date
    }],
    apiCalls: [{
      count: Number,
      endpoint: String,
      timestamp: Date
    }]
  },
  costs: {
    base: Number,
    overages: {
      storage: Number,
      apiCalls: Number
    },
    total: Number
  },
  features: {
    accessed: [{
      name: String,
      count: Number,
      lastAccessed: Date
    }]
  },
  engagement: {
    activeUsers: {
      daily: [{
        date: Date,
        count: Number
      }],
      weekly: [{
        week: Date,
        count: Number
      }],
      monthly: [{
        month: Date,
        count: Number
      }]
    },
    templateUsage: [{
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
      },
      uses: Number,
      lastUsed: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes
subscriptionAnalyticsSchema.index({ organization: 1, 'period.start': 1, 'period.end': 1 });
subscriptionAnalyticsSchema.index({ 'period.start': 1 });
subscriptionAnalyticsSchema.index({ 'period.end': 1 });

// Methods
subscriptionAnalyticsSchema.methods.addUsageDataPoint = async function(type, value, metadata = {}) {
  const timestamp = new Date();
  
  switch (type) {
    case 'users':
      this.usage.users.push({ count: value, timestamp });
      break;
    case 'templates':
      this.usage.templates.push({ count: value, timestamp });
      break;
    case 'storage':
      this.usage.storage.push({ bytes: value, timestamp });
      break;
    case 'apiCalls':
      this.usage.apiCalls.push({ 
        count: value, 
        endpoint: metadata.endpoint,
        timestamp 
      });
      break;
  }

  await this.save();
};

subscriptionAnalyticsSchema.methods.recordFeatureAccess = async function(featureName) {
  const feature = this.features.accessed.find(f => f.name === featureName);
  
  if (feature) {
    feature.count += 1;
    feature.lastAccessed = new Date();
  } else {
    this.features.accessed.push({
      name: featureName,
      count: 1,
      lastAccessed: new Date()
    });
  }

  await this.save();
};

subscriptionAnalyticsSchema.methods.updateEngagementMetrics = async function(type, data) {
  const now = new Date();
  
  switch (type) {
    case 'daily':
      this.engagement.activeUsers.daily.push({
        date: now,
        count: data.count
      });
      break;
    case 'weekly':
      this.engagement.activeUsers.weekly.push({
        week: now,
        count: data.count
      });
      break;
    case 'monthly':
      this.engagement.activeUsers.monthly.push({
        month: now,
        count: data.count
      });
      break;
    case 'template':
      const templateUsage = this.engagement.templateUsage.find(
        t => t.templateId.toString() === data.templateId
      );
      
      if (templateUsage) {
        templateUsage.uses += 1;
        templateUsage.lastUsed = now;
      } else {
        this.engagement.templateUsage.push({
          templateId: data.templateId,
          uses: 1,
          lastUsed: now
        });
      }
      break;
  }

  await this.save();
};

// Statics
subscriptionAnalyticsSchema.statics.createPeriod = async function(organizationId, startDate, endDate) {
  return await this.create({
    organization: organizationId,
    period: {
      start: startDate,
      end: endDate
    },
    costs: {
      base: 0,
      overages: {
        storage: 0,
        apiCalls: 0
      },
      total: 0
    }
  });
};

subscriptionAnalyticsSchema.statics.getCurrentPeriod = async function(organizationId) {
  const now = new Date();
  return await this.findOne({
    organization: organizationId,
    'period.start': { $lte: now },
    'period.end': { $gte: now }
  });
};

const SubscriptionAnalytics = mongoose.model('SubscriptionAnalytics', subscriptionAnalyticsSchema);

module.exports = SubscriptionAnalytics; 