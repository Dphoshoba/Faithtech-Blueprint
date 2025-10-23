const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'textarea', 'email', 'url'],
    default: 'text'
  },
  description: String,
  required: {
    type: Boolean,
    default: false
  },
  defaultValue: String,
  options: [String], // For select type
  validation: {
    pattern: String,
    min: Number,
    max: Number,
    message: String
  },
  placeholder: String,
  section: String, // Group variables by section
  order: {
    type: Number,
    default: 0
  }
});

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  order: {
    type: Number,
    default: 0
  },
  variables: [String] // Array of variable keys in this section
});

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Template title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Template description is required'],
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Strategic Planning',
      'Ministry Planning',
      'Event Planning',
      'Budget',
      'Reports',
      'Policies',
      'Communications',
      'Forms',
      'Other'
    ],
    default: 'Other'
  },
  type: {
    type: String,
    enum: ['document', 'spreadsheet', 'presentation', 'form'],
    default: 'document'
  },
  tier: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // Template content
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['markdown', 'html', 'docx', 'custom'],
    default: 'markdown'
  },
  variables: [variableSchema],
  sections: [sectionSchema],
  
  // Styling and branding
  styling: {
    fontFamily: {
      type: String,
      default: 'Arial, sans-serif'
    },
    fontSize: {
      type: Number,
      default: 12
    },
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    secondaryColor: {
      type: String,
      default: '#dc004e'
    },
    headerImage: String,
    footerText: String,
    pageSize: {
      type: String,
      enum: ['A4', 'Letter', 'Legal'],
      default: 'Letter'
    },
    margins: {
      top: { type: Number, default: 1 },
      bottom: { type: Number, default: 1 },
      left: { type: Number, default: 1 },
      right: { type: Number, default: 1 }
    }
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  estimatedTime: {
    type: Number, // in minutes
    default: 30
  },
  
  // Usage analytics
  usageCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Access control
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Versioning
  version: {
    type: String,
    default: '1.0.0'
  },
  versionHistory: [{
    version: String,
    changes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: Date
  }],
  
  publishedAt: Date,
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes
templateSchema.index({ status: 1, tier: 1 });
templateSchema.index({ category: 1, difficulty: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ featured: 1, usageCount: -1 });

// Method to publish template
templateSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Method to archive template
templateSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// Method to increment usage
templateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Method to add rating
templateSchema.methods.addRating = function(rating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + rating) / this.rating.count;
  return this.save();
};

// Static method to get by tier
templateSchema.statics.findByTier = function(tier) {
  return this.find({ status: 'published', tier });
};

// Static method to get featured
templateSchema.statics.getFeatured = function() {
  return this.find({ status: 'published', featured: true })
    .sort({ usageCount: -1 })
    .limit(6);
};

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;

