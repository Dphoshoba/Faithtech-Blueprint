const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'likert', 'open-ended', 'boolean'],
    required: true
  },
  options: [{
    text: String,
    value: Number,
    weight: Number
  }],
  category: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    default: 1
  },
  required: {
    type: Boolean,
    default: true
  }
});

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Assessment description is required']
  },
  type: {
    type: String,
    enum: ['ministry-tech', 'digital-maturity', 'custom'],
    required: true
  },
  questions: [questionSchema],
  categories: [{
    name: String,
    description: String,
    weight: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  metadata: {
    estimatedTime: Number,
    targetAudience: String,
    prerequisites: [String],
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total possible score
assessmentSchema.virtual('maxScore').get(function() {
  return this.questions.reduce((total, question) => {
    if (question.type === 'multiple-choice' || question.type === 'likert') {
      const maxOptionValue = Math.max(...question.options.map(opt => opt.value));
      return total + (maxOptionValue * question.weight);
    }
    return total;
  }, 0);
});

// Indexes
assessmentSchema.index({ organization: 1, status: 1 });
assessmentSchema.index({ 'metadata.tags': 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment; 