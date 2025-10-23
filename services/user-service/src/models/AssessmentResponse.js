const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, boolean, or array
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  skipped: {
    type: Boolean,
    default: false
  }
});

const assessmentResponseSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  responses: [responseSchema],
  
  // Status tracking
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'expired'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Scoring
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  maxScore: {
    type: Number,
    default: 100
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    default: false
  },
  
  // Time tracking
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  
  // Results and feedback
  results: {
    summary: String,
    strengths: [String],
    areasForImprovement: [String],
    recommendations: [String],
    detailedFeedback: [{
      category: String,
      score: Number,
      feedback: String
    }]
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  
  // Version tracking (in case assessment changes)
  assessmentVersion: {
    type: Number,
    default: 1
  },
  
  // Review status (for manual grading)
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: String
}, {
  timestamps: true
});

// Compound indexes
assessmentResponseSchema.index({ assessment: 1, user: 1 });
assessmentResponseSchema.index({ status: 1, completedAt: -1 });
assessmentResponseSchema.index({ user: 1, status: 1 });

// Pre-save middleware to calculate scores and percentages
assessmentResponseSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Calculate total score from responses
  if (this.responses.length > 0) {
    this.totalScore = this.responses.reduce((sum, response) => sum + (response.score || 0), 0);
    this.percentage = this.maxScore > 0 ? (this.totalScore / this.maxScore) * 100 : 0;
  }
  
  // Calculate total time spent
  if (this.responses.length > 0) {
    this.totalTimeSpent = this.responses.reduce((sum, response) => sum + (response.timeSpent || 0), 0);
  }
  
  next();
});

// Method to mark as completed
assessmentResponseSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Update assessment analytics
  const Assessment = mongoose.model('Assessment');
  const assessment = await Assessment.findById(this.assessment);
  if (assessment) {
    const completionTimeMinutes = this.totalTimeSpent / 60;
    await assessment.updateAnalytics(completionTimeMinutes, this.percentage);
  }
  
  return this.save();
};

// Method to abandon response
assessmentResponseSchema.methods.abandon = function() {
  this.status = 'abandoned';
  return this.save();
};

// Method to add a response to a question
assessmentResponseSchema.methods.addResponse = function(questionId, answer, score = 0, timeSpent = 0) {
  const existingIndex = this.responses.findIndex(r => r.questionId === questionId);
  
  if (existingIndex >= 0) {
    // Update existing response
    this.responses[existingIndex] = {
      questionId,
      answer,
      score,
      timeSpent,
      skipped: false
    };
  } else {
    // Add new response
    this.responses.push({
      questionId,
      answer,
      score,
      timeSpent,
      skipped: false
    });
  }
  
  return this.save();
};

// Static method to get user's assessment history
assessmentResponseSchema.statics.getUserHistory = function(userId, options = {}) {
  const { status, limit = 10, skip = 0 } = options;
  const query = { user: userId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('assessment', 'title category difficulty')
    .sort({ completedAt: -1, startedAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get assessment statistics
assessmentResponseSchema.statics.getAssessmentStats = async function(assessmentId) {
  const results = await this.aggregate([
    { $match: { assessment: mongoose.Types.ObjectId(assessmentId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalCompletions: { $sum: 1 },
        averageScore: { $avg: '$percentage' },
        averageTimeSpent: { $avg: '$totalTimeSpent' },
        passRate: {
          $avg: {
            $cond: [{ $eq: ['$passed', true] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return results[0] || {
    totalCompletions: 0,
    averageScore: 0,
    averageTimeSpent: 0,
    passRate: 0
  };
};

const AssessmentResponse = mongoose.model('AssessmentResponse', assessmentResponseSchema);

module.exports = AssessmentResponse;

