const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  score: Number,
  notes: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const categoryScoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  maxPossible: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  recommendations: [{
    text: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    actionItems: [String],
    resources: [{
      title: String,
      url: String,
      type: String
    }]
  }]
});

const assessmentResponseSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'archived'],
    default: 'in_progress'
  },
  answers: [answerSchema],
  categoryScores: [categoryScoreSchema],
  overallScore: {
    score: Number,
    maxPossible: Number,
    percentage: Number
  },
  completedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update lastUpdated
assessmentResponseSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to calculate scores
assessmentResponseSchema.methods.calculateScores = async function() {
  const assessment = await mongoose.model('Assessment').findById(this.assessment);
  
  // Calculate category scores
  const categoryScores = {};
  this.answers.forEach(answer => {
    const question = assessment.questions.id(answer.questionId);
    if (!question) return;

    const category = question.category;
    if (!categoryScores[category]) {
      categoryScores[category] = {
        score: 0,
        maxPossible: 0,
        count: 0
      };
    }

    if (question.type === 'multiple-choice' || question.type === 'likert') {
      const option = question.options.find(opt => opt.value === answer.value);
      if (option) {
        const score = option.value * (question.weight || 1);
        categoryScores[category].score += score;
        const maxOptionValue = Math.max(...question.options.map(opt => opt.value));
        categoryScores[category].maxPossible += maxOptionValue * (question.weight || 1);
        categoryScores[category].count++;
      }
    }
  });

  // Convert to array format and calculate percentages
  this.categoryScores = Object.entries(categoryScores).map(([name, data]) => ({
    name,
    score: data.score,
    maxPossible: data.maxPossible,
    percentage: (data.score / data.maxPossible) * 100
  }));

  // Calculate overall score
  const overall = this.categoryScores.reduce((acc, cat) => {
    acc.score += cat.score;
    acc.maxPossible += cat.maxPossible;
    return acc;
  }, { score: 0, maxPossible: 0 });

  this.overallScore = {
    score: overall.score,
    maxPossible: overall.maxPossible,
    percentage: (overall.score / overall.maxPossible) * 100
  };

  if (this.isModified('answers')) {
    await this.save();
  }
};

// Indexes
assessmentResponseSchema.index({ assessment: 1, respondent: 1 });
assessmentResponseSchema.index({ organization: 1, status: 1 });
assessmentResponseSchema.index({ completedAt: -1 });

const AssessmentResponse = mongoose.model('AssessmentResponse', assessmentResponseSchema);

module.exports = AssessmentResponse; 