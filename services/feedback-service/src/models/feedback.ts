import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  featureId: string;
  sentiment: number;
  rating: number;
  comment: string;
  tags: string[];
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema({
  featureId: {
    type: String,
    required: true,
    index: true,
  },
  sentiment: {
    type: Number,
    required: true,
    enum: [-1, 0, 1],
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: false,
  },
  tags: [{
    type: String,
    required: true,
  }],
  sessionId: {
    type: String,
    required: false,
    index: true,
  },
  userId: {
    type: String,
    required: false,
    index: true,
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    required: false,
  },
}, {
  timestamps: true,
});

// Add indexes
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ sentiment: 1, rating: 1 });
feedbackSchema.index({ tags: 1 });

// Add methods
feedbackSchema.methods.getSentimentLabel = function(): string {
  switch (this.sentiment) {
    case 1:
      return 'positive';
    case 0:
      return 'neutral';
    case -1:
      return 'negative';
    default:
      return 'unknown';
  }
};

// Add statics
feedbackSchema.statics.getAverageRating = async function(featureId: string): Promise<number> {
  const result = await this.aggregate([
    { $match: { featureId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);
  return result[0]?.avgRating || 0;
};

feedbackSchema.statics.getPopularTags = async function(limit = 10): Promise<Array<{ tag: string; count: number }>> {
  const result = await this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, tag: '$_id', count: 1 } }
  ]);
  return result;
};

export const FeedbackModel = mongoose.model<IFeedback>('Feedback', feedbackSchema); 