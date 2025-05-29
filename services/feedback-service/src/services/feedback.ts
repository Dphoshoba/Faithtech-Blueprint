import { Document, Model } from 'mongoose';
import { FeedbackModel, IFeedback } from '../models/feedback';
import { SessionRecording } from '../integrations/session-recording';
import { AnalyticsService } from '../integrations/analytics';

interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topTags: Array<{ tag: string; count: number }>;
}

interface FeedbackQuery {
  featureId?: string;
  startDate?: Date;
  endDate?: Date;
  sentiment?: number;
  minRating?: number;
  tags?: string[];
}

export class FeedbackService {
  private sessionRecording: SessionRecording;
  private analyticsService: AnalyticsService;

  constructor(
    private feedbackModel: Model<IFeedback & Document>,
    sessionRecording: SessionRecording,
    analyticsService: AnalyticsService
  ) {
    this.sessionRecording = sessionRecording;
    this.analyticsService = analyticsService;
  }

  async submitFeedback(feedback: Omit<IFeedback, 'createdAt' | 'updatedAt'>): Promise<IFeedback> {
    try {
      // Create feedback record
      const newFeedback = await this.feedbackModel.create(feedback);

      // Track feedback event in analytics
      await this.analyticsService.trackEvent('feedback_submitted', {
        featureId: feedback.featureId,
        sentiment: feedback.sentiment,
        rating: feedback.rating,
        tags: feedback.tags,
      });

      // If session recording is available, mark this moment
      if (feedback.sessionId) {
        await this.sessionRecording.addFeedbackMarker({
          sessionId: feedback.sessionId,
          feedbackId: newFeedback.id,
          timestamp: new Date(),
          sentiment: feedback.sentiment,
        });
      }

      return newFeedback;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  async getFeedbackStats(query: FeedbackQuery = {}): Promise<FeedbackStats> {
    try {
      const matchQuery = this.buildMatchQuery(query);

      const [stats] = await this.feedbackModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            sentiments: {
              $push: '$sentiment'
            },
            allTags: {
              $push: '$tags'
            }
          }
        }
      ]);

      if (!stats) {
        return {
          totalCount: 0,
          averageRating: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          topTags: [],
        };
      }

      // Calculate sentiment breakdown
      const sentimentBreakdown = stats.sentiments.reduce(
        (acc: { positive: number; neutral: number; negative: number }, sentiment: number) => {
          if (sentiment === 1) acc.positive++;
          else if (sentiment === 0) acc.neutral++;
          else if (sentiment === -1) acc.negative++;
          return acc;
        },
        { positive: 0, neutral: 0, negative: 0 }
      );

      // Calculate top tags
      const tagCounts = stats.allTags
        .flat()
        .reduce((acc: { [key: string]: number }, tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalCount: stats.totalCount,
        averageRating: Number(stats.averageRating.toFixed(2)),
        sentimentBreakdown,
        topTags,
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      throw new Error('Failed to get feedback statistics');
    }
  }

  async getFeedbackByFeature(featureId: string): Promise<IFeedback[]> {
    return this.feedbackModel
      .find({ featureId })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  async getFeedbackWithSessionRecording(feedbackId: string): Promise<{
    feedback: IFeedback;
    sessionUrl?: string;
  }> {
    const feedback = await this.feedbackModel.findById(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    let sessionUrl;
    if (feedback.sessionId) {
      sessionUrl = await this.sessionRecording.getSessionUrl(feedback.sessionId);
    }

    return { feedback, sessionUrl };
  }

  private buildMatchQuery(query: FeedbackQuery) {
    const matchQuery: any = {};

    if (query.featureId) {
      matchQuery.featureId = query.featureId;
    }

    if (query.startDate || query.endDate) {
      matchQuery.createdAt = {};
      if (query.startDate) {
        matchQuery.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        matchQuery.createdAt.$lte = query.endDate;
      }
    }

    if (typeof query.sentiment === 'number') {
      matchQuery.sentiment = query.sentiment;
    }

    if (typeof query.minRating === 'number') {
      matchQuery.rating = { $gte: query.minRating };
    }

    if (query.tags && query.tags.length > 0) {
      matchQuery.tags = { $in: query.tags };
    }

    return matchQuery;
  }
} 