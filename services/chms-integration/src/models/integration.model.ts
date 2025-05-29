import mongoose from 'mongoose';
import { integrationProviders } from '../services/integrations/providerRegistry';

const integrationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  providerId: {
    type: String,
    required: true,
    enum: integrationProviders.map(p => p.id)
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'syncing'],
    default: 'connected'
  },
  authData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  lastSyncDate: Date,
  syncError: String,
  syncStats: {
    people: {
      synced: Number,
      errors: Number
    },
    groups: {
      synced: Number,
      errors: Number
    },
    giving: {
      synced: Number,
      errors: Number
    }
  },
  settings: {
    syncSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'manual'],
      default: 'daily'
    },
    syncCapabilities: [String]
  }
}, { timestamps: true });

// Ensure one integration per provider per organization
integrationSchema.index({ organizationId: 1, providerId: 1 }, { unique: true });

// Methods
integrationSchema.methods.updateSyncStats = async function(capability: string, stats: { synced: number, errors: number }) {
  if (this.syncStats && this.syncStats[capability]) {
    this.syncStats[capability] = stats;
    await this.save();
  }
};

integrationSchema.methods.updateStatus = async function(status: string, error?: string) {
  this.status = status;
  if (error) {
    this.syncError = error;
  }
  await this.save();
};

integrationSchema.methods.getProvider = function() {
  return integrationProviders.find(p => p.id === this.providerId);
};

// Statics
integrationSchema.statics.findByOrganization = function(organizationId: string) {
  return this.find({ organizationId });
};

integrationSchema.statics.findByProvider = function(providerId: string) {
  return this.find({ providerId });
};

const Integration = mongoose.model('Integration', integrationSchema);

export default Integration; 