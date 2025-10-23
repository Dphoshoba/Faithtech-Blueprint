const mongoose = require('mongoose');

const templateInstanceSchema = new mongoose.Schema({
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // User's variable values
  variables: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'archived'],
    default: 'draft'
  },
  
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedSections: [{
    type: String
  }],
  
  // Generated content
  generatedContent: String,
  generatedPDF: String, // S3 URL or file path
  generatedHTML: String,
  
  // Sharing and collaboration
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Custom branding
  branding: {
    logoURL: String,
    primaryColor: String,
    secondaryColor: String,
    organizationName: String,
    headerText: String,
    footerText: String
  },
  
  // Metadata
  lastEditedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  downloadedAt: Date,
  
  // Version tracking (from template)
  templateVersion: {
    type: String,
    default: '1.0.0'
  },
  
  // Tags and notes
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Compound indexes
templateInstanceSchema.index({ template: 1, user: 1 });
templateInstanceSchema.index({ user: 1, status: 1 });
templateInstanceSchema.index({ status: 1, updatedAt: -1 });

// Pre-save middleware to update lastEditedAt
templateInstanceSchema.pre('save', function(next) {
  this.lastEditedAt = new Date();
  
  // Calculate progress based on completed sections
  if (this.completedSections && this.completedSections.length > 0) {
    const Template = mongoose.model('Template');
    Template.findById(this.template).then(template => {
      if (template && template.sections.length > 0) {
        this.progress = Math.round(
          (this.completedSections.length / template.sections.length) * 100
        );
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Method to mark as completed
templateInstanceSchema.methods.complete = function() {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  return this.save();
};

// Method to share with user
templateInstanceSchema.methods.shareWith = function(userId, role = 'viewer') {
  const existing = this.sharedWith.find(s => s.user.toString() === userId.toString());
  
  if (!existing) {
    this.sharedWith.push({
      user: userId,
      role,
      sharedAt: new Date()
    });
  } else {
    existing.role = role;
  }
  
  return this.save();
};

// Method to remove share
templateInstanceSchema.methods.unshareWith = function(userId) {
  this.sharedWith = this.sharedWith.filter(
    s => s.user.toString() !== userId.toString()
  );
  return this.save();
};

// Static method to get user's instances
templateInstanceSchema.statics.getUserInstances = function(userId, options = {}) {
  const { status, limit = 10, skip = 0 } = options;
  const query = {
    $or: [
      { user: userId },
      { 'sharedWith.user': userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('template', 'title category type')
    .populate('user', 'firstName lastName email')
    .sort({ lastEditedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get recently used
templateInstanceSchema.statics.getRecentlyUsed = function(userId, limit = 5) {
  return this.find({ user: userId })
    .populate('template', 'title category')
    .sort({ lastEditedAt: -1 })
    .limit(limit);
};

const TemplateInstance = mongoose.model('TemplateInstance', templateInstanceSchema);

module.exports = TemplateInstance;

