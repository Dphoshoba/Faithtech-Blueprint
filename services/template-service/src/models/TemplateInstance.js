const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  changes: {
    html: String,
    css: String,
    js: String,
    settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  }
});

const templateInstanceSchema = new mongoose.Schema({
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customizations: [customizationSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  deploymentDetails: {
    url: String,
    platform: String,
    lastDeployed: Date,
    buildStatus: {
      type: String,
      enum: ['pending', 'building', 'success', 'failed'],
      default: 'pending'
    },
    buildLogs: [{
      timestamp: Date,
      message: String,
      level: {
        type: String,
        enum: ['info', 'warning', 'error']
      }
    }]
  },
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  version: {
    templateVersion: String,
    instanceVersion: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
templateInstanceSchema.index({ template: 1, organization: 1 });
templateInstanceSchema.index({ status: 1 });
templateInstanceSchema.index({ 'deploymentDetails.buildStatus': 1 });

// Methods
templateInstanceSchema.methods.incrementVersion = async function() {
  this.version.instanceVersion += 1;
  await this.save();
};

templateInstanceSchema.methods.updateDeploymentStatus = async function(status, message) {
  this.deploymentDetails.buildStatus = status;
  this.deploymentDetails.buildLogs.push({
    timestamp: new Date(),
    message,
    level: status === 'failed' ? 'error' : 'info'
  });
  
  if (status === 'success') {
    this.deploymentDetails.lastDeployed = new Date();
  }
  
  await this.save();
};

templateInstanceSchema.methods.publish = async function() {
  if (this.deploymentDetails.buildStatus !== 'success') {
    throw new Error('Cannot publish template instance with unsuccessful build');
  }
  
  this.status = 'published';
  await this.save();
};

const TemplateInstance = mongoose.model('TemplateInstance', templateInstanceSchema);

module.exports = TemplateInstance; 