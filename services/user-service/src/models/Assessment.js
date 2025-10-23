const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'multiple-choice', 'scale', 'boolean', 'rating'],
    required: true
  },
  required: {
    type: Boolean,
    default: true
  },
  // For multiple-choice questions
  options: [{
    id: String,
    text: String,
    value: Number
  }],
  // For scale questions
  scaleRange: {
    min: Number,
    max: Number,
    step: Number,
    labels: {
      min: String,
      max: String
    }
  },
  // For text questions
  maxLength: Number,
  minLength: Number,
  // Validation rules
  validation: {
    pattern: String,
    message: String
  },
  // Conditional logic
  showIf: {
    questionId: String,
    operator: {
      type: String,
      enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains']
    },
    value: mongoose.Schema.Types.Mixed
  }
});

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be longer than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assessment description is required'],
    maxlength: [1000, 'Description cannot be longer than 1000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['Church Health', 'Leadership', 'Youth Ministry', 'Finance', 'Worship', 'Outreach', 'Small Groups', 'Volunteering', 'Other'],
    default: 'Other'
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
  timeLimit: {
    type: Number, // in minutes
    min: 0,
    max: 240,
    default: 30
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  questions: [questionSchema],
  totalQuestions: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Analytics
  completions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  averageCompletionTime: {
    type: Number, // in minutes
    default: 0
  },
  // Scoring configuration
  scoring: {
    method: {
      type: String,
      enum: ['automatic', 'manual', 'hybrid'],
      default: 'automatic'
    },
    maxScore: {
      type: Number,
      default: 100
    },
    passingScore: {
      type: Number,
      default: 70
    },
    weightedQuestions: {
      type: Boolean,
      default: false
    }
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
  allowedOrganizations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  }],
  // Metadata
  version: {
    type: Number,
    default: 1
  },
  publishedAt: {
    type: Date,
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
assessmentSchema.index({ status: 1, tier: 1 });
assessmentSchema.index({ category: 1, difficulty: 1 });
assessmentSchema.index({ tags: 1 });
assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ 'questions.id': 1 });

// Virtual for calculating total questions
assessmentSchema.pre('save', function(next) {
  this.totalQuestions = this.questions.length;
  next();
});

// Method to publish assessment
assessmentSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

// Method to archive assessment
assessmentSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// Method to update analytics
assessmentSchema.methods.updateAnalytics = function(completionTime, score) {
  this.completions += 1;
  
  // Update average score
  const totalScore = (this.averageScore * (this.completions - 1)) + score;
  this.averageScore = totalScore / this.completions;
  
  // Update average completion time
  const totalTime = (this.averageCompletionTime * (this.completions - 1)) + completionTime;
  this.averageCompletionTime = totalTime / this.completions;
  
  return this.save();
};

// Static method to get assessments by tier
assessmentSchema.statics.findByTier = function(tier) {
  return this.find({ status: 'published', tier });
};

// Static method to get public assessments
assessmentSchema.statics.findPublic = function() {
  return this.find({ status: 'published', isPublic: true });
};

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;

