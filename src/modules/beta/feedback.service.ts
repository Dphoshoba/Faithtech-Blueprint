import { EventEmitter } from '../../utils/event-emitter';
import { Cache } from '../../utils/cache';
import logger from '../../utils/logger';

export interface Feedback {
  id: string;
  participantId: string;
  category: 'bug' | 'feature' | 'usability' | 'performance' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  averageResponseTime: number;
  resolutionRate: number;
}

export class FeedbackService {
  private eventEmitter: EventEmitter;
  private cache: Cache<Feedback>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.cache = new Cache<Feedback>({ maxSize: 1000 });
  }

  async submitFeedback(feedback: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Feedback> {
    logger.info('Processing feedback submission', { participantId: feedback.participantId });

    // Validate feedback
    this.validateFeedback(feedback);

    // Create feedback record
    const feedbackRecord: Feedback = {
      ...feedback,
      id: this.generateId(),
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store feedback
    await this.storeFeedback(feedbackRecord);

    // Notify team
    this.eventEmitter.emit('feedback:submitted', { feedback: feedbackRecord });

    return feedbackRecord;
  }

  private validateFeedback(feedback: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>): void {
    const errors: string[] = [];

    if (!feedback.participantId?.trim()) {
      errors.push('Participant ID is required');
    }

    if (!feedback.title?.trim()) {
      errors.push('Title is required');
    }

    if (!feedback.description?.trim()) {
      errors.push('Description is required');
    }

    if (!feedback.category) {
      errors.push('Category is required');
    }

    if (!feedback.priority) {
      errors.push('Priority is required');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid feedback: ${errors.join(', ')}`);
    }
  }

  async updateFeedbackStatus(id: string, status: Feedback['status']): Promise<Feedback> {
    const feedback = await this.getFeedback(id);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    feedback.status = status;
    feedback.updatedAt = new Date();
    await this.storeFeedback(feedback);

    this.eventEmitter.emit('feedback:updated', { feedback });

    return feedback;
  }

  async getFeedback(id: string): Promise<Feedback | null> {
    return this.cache.get(`feedback:${id}`) || null;
  }

  async getParticipantFeedback(participantId: string): Promise<Feedback[]> {
    // TODO: Implement database query
    return [];
  }

  async getAnalytics(): Promise<FeedbackAnalytics> {
    const allFeedback = await this.getAllFeedback();
    
    const analytics: FeedbackAnalytics = {
      totalFeedback: allFeedback.length,
      byCategory: {},
      byPriority: {},
      byStatus: {},
      averageResponseTime: 0,
      resolutionRate: 0
    };

    // Calculate category distribution
    allFeedback.forEach(feedback => {
      analytics.byCategory[feedback.category] = (analytics.byCategory[feedback.category] || 0) + 1;
      analytics.byPriority[feedback.priority] = (analytics.byPriority[feedback.priority] || 0) + 1;
      analytics.byStatus[feedback.status] = (analytics.byStatus[feedback.status] || 0) + 1;
    });

    // Calculate resolution rate
    const resolvedCount = allFeedback.filter(f => f.status === 'resolved' || f.status === 'closed').length;
    analytics.resolutionRate = allFeedback.length > 0 ? resolvedCount / allFeedback.length : 0;

    // Calculate average response time
    const responseTimes = allFeedback
      .filter(f => f.status !== 'new')
      .map(f => f.updatedAt.getTime() - f.createdAt.getTime());
    
    analytics.averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return analytics;
  }

  private async storeFeedback(feedback: Feedback): Promise<void> {
    // TODO: Implement database storage
    this.cache.set(`feedback:${feedback.id}`, feedback);
  }

  private async getAllFeedback(): Promise<Feedback[]> {
    // TODO: Implement database query
    return [];
  }

  private generateId(): string {
    return `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public emit(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }
} 