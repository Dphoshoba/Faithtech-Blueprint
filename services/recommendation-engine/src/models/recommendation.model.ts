import mongoose from 'mongoose';
import { Recommendation } from '../services/recommendations/types';

interface IRecommendation extends mongoose.Document {
  assessmentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recommendations: Recommendation[];
  generatedAt: Date;
  feedback?: {
    helpful: boolean;
    comments: string;
    submittedAt: Date;
  };
  implementationStatus?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
    lastUpdated: Date;
    notes: string;
  };
}

const recommendationSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendations: [{
    id: String,
    title: String,
    description: String,
    category: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    templates: [String],
    resources: [String],
    templateDetails: [{
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      description: String,
      type: String
    }],
    resourceDetails: [{
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      description: String,
      type: String,
      url: String
    }]
  }],
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  feedback: {
    helpful: Boolean,
    comments: String,
    submittedAt: Date
  },
  implementationStatus: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastUpdated: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
recommendationSchema.index({ generatedAt: -1 });
recommendationSchema.index({ 'implementationStatus.status': 1 });

// Methods
recommendationSchema.methods.updateImplementationStatus = async function(
  status: IRecommendation['implementationStatus']['status'],
  progress: number,
  notes?: string
) {
  this.implementationStatus = {
    status,
    progress,
    lastUpdated: new Date(),
    notes: notes || this.implementationStatus?.notes
  };
  await this.save();
};

recommendationSchema.methods.addFeedback = async function(
  helpful: boolean,
  comments?: string
) {
  this.feedback = {
    helpful,
    comments,
    submittedAt: new Date()
  };
  await this.save();
};

// Statics
recommendationSchema.statics.findByOrganization = function(organizationId: string) {
  return this.find({ organizationId })
    .sort({ generatedAt: -1 });
};

recommendationSchema.statics.findByAssessment = function(assessmentId: string) {
  return this.findOne({ assessmentId })
    .sort({ generatedAt: -1 });
};

recommendationSchema.statics.findImplementationStatus = function(organizationId: string) {
  return this.find({
    organizationId,
    'implementationStatus.status': { $ne: 'completed' }
  })
    .sort({ 'implementationStatus.lastUpdated': -1 });
};

const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema);

export default Recommendation; 