const mongoose = require('mongoose');
const crypto = require('crypto');

const integrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['planning-center', 'breeze', 'ccb', 'elvanto', 'rock-rms', 'fellowship-one'],
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'pending'],
    default: 'pending'
  },
  
  // OAuth credentials (encrypted)
  credentials: {
    accessToken: String,
    refreshToken: String,
    tokenType: String,
    expiresAt: Date,
    scope: String
  },
  
  // API credentials
  apiKey: String,
  apiSecret: String,
  subdomain: String,
  orgId: String,
  
  // Sync configuration
  syncConfig: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'weekly', 'manual'],
      default: 'daily'
    },
    syncPeople: {
      type: Boolean,
      default: true
    },
    syncGroups: {
      type: Boolean,
      default: true
    },
    syncEvents: {
      type: Boolean,
      default: false
    },
    syncGiving: {
      type: Boolean,
      default: false
    },
    lastSyncAt: Date,
    nextSyncAt: Date
  },
  
  // Field mapping (map CHMS fields to our system)
  fieldMapping: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Sync statistics
  stats: {
    totalSyncs: {
      type: Number,
      default: 0
    },
    lastSyncStatus: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: null
    },
    recordsSynced: {
      type: Number,
      default: 0
    },
    errors: [{
      message: String,
      timestamp: Date,
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Webhook configuration
  webhooks: {
    enabled: {
      type: Boolean,
      default: false
    },
    url: String,
    secret: String,
    events: [String]
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
integrationSchema.index({ user: 1, provider: 1 });
integrationSchema.index({ status: 1, 'syncConfig.nextSyncAt': 1 });

// Encrypt sensitive fields before saving
integrationSchema.pre('save', function(next) {
  if (this.isModified('credentials.accessToken') && this.credentials.accessToken) {
    // In production, use proper encryption with a secret key
    // For now, we'll just store as-is (NOT SECURE - for demo only)
    // this.credentials.accessToken = encrypt(this.credentials.accessToken);
  }
  next();
});

// Method to test connection
integrationSchema.methods.testConnection = async function() {
  try {
    // This would call the actual CHMS API to test connectivity
    // For now, return mock success
    this.status = 'active';
    await this.save();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    this.status = 'error';
    this.stats.errors.push({
      message: error.message,
      timestamp: new Date()
    });
    await this.save();
    return { success: false, message: error.message };
  }
};

// Method to trigger sync
integrationSchema.methods.sync = async function() {
  try {
    this.syncConfig.lastSyncAt = new Date();
    this.stats.totalSyncs += 1;
    
    // Calculate next sync time based on frequency
    const now = new Date();
    switch (this.syncConfig.frequency) {
      case 'hourly':
        this.syncConfig.nextSyncAt = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'daily':
        this.syncConfig.nextSyncAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        this.syncConfig.nextSyncAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        this.syncConfig.nextSyncAt = null;
    }
    
    await this.save();
    return { success: true, recordsSynced: 0 };
  } catch (error) {
    this.stats.lastSyncStatus = 'failed';
    this.stats.errors.push({
      message: error.message,
      timestamp: new Date()
    });
    await this.save();
    throw error;
  }
};

// Static method to get active integrations
integrationSchema.statics.getActiveIntegrations = function(userId) {
  return this.find({ user: userId, status: 'active', active: true });
};

// Static method to find integrations needing sync
integrationSchema.statics.findDueForSync = function() {
  return this.find({
    status: 'active',
    'syncConfig.enabled': true,
    'syncConfig.nextSyncAt': { $lte: new Date() }
  });
};

const Integration = mongoose.model('Integration', integrationSchema);

module.exports = Integration;

