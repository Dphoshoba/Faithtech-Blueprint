import { EventEmitter } from '../../utils/event-emitter';
import { Cache } from '../../utils/cache';
import { BetaService, BetaParticipant } from './beta.service';
import { FeedbackService, Feedback } from './feedback.service';
import { AnalyticsService, UsageAnalytics } from './analytics.service';
import logger from '../../utils/logger';

export interface AdminDashboard {
  participants: {
    total: number;
    byStatus: Record<string, number>;
    recent: BetaParticipant[];
  };
  feedback: {
    total: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    recent: Feedback[];
  };
  analytics: UsageAnalytics;
  metrics: {
    activeParticipants: number;
    averageFeedbackPerParticipant: number;
    averageEventsPerParticipant: number;
    responseTime: number;
  };
}

export class AdminService {
  private eventEmitter: EventEmitter;
  private cache: Cache<AdminDashboard>;
  private betaService: BetaService;
  private feedbackService: FeedbackService;
  private analyticsService: AnalyticsService;

  constructor(
    betaService: BetaService,
    feedbackService: FeedbackService,
    analyticsService: AnalyticsService
  ) {
    this.eventEmitter = new EventEmitter();
    this.cache = new Cache<AdminDashboard>({ maxSize: 100 });
    this.betaService = betaService;
    this.feedbackService = feedbackService;
    this.analyticsService = analyticsService;

    // Subscribe to events
    this.betaService.on('beta:approved', () => this.invalidateCache());
    this.betaService.on('beta:rejected', () => this.invalidateCache());
    this.betaService.on('beta:onboarded', () => this.invalidateCache());
    this.feedbackService.on('feedback:submitted', () => this.invalidateCache());
    this.feedbackService.on('feedback:updated', () => this.invalidateCache());
  }

  async getDashboard(): Promise<AdminDashboard> {
    const cached = this.cache.get('dashboard');
    if (cached) {
      return cached;
    }

    const dashboard = await this.generateDashboard();
    this.cache.set('dashboard', dashboard);
    return dashboard;
  }

  private async generateDashboard(): Promise<AdminDashboard> {
    logger.info('Generating admin dashboard');

    // Get all participants
    const participants = await this.getAllParticipants();
    const participantStatus = this.calculateParticipantStatus(participants);

    // Get feedback analytics
    const feedbackAnalytics = await this.feedbackService.getAnalytics();

    // Get usage analytics
    const usageAnalytics = await this.analyticsService.getAnalytics();

    // Calculate metrics
    const metrics = await this.calculateMetrics(participants, feedbackAnalytics, usageAnalytics);

    const dashboard: AdminDashboard = {
      participants: {
        total: participants.length,
        byStatus: participantStatus,
        recent: this.getRecentParticipants(participants)
      },
      feedback: {
        total: feedbackAnalytics.totalFeedback,
        byCategory: feedbackAnalytics.byCategory,
        byPriority: feedbackAnalytics.byPriority,
        byStatus: feedbackAnalytics.byStatus,
        recent: await this.getRecentFeedback()
      },
      analytics: usageAnalytics,
      metrics
    };

    return dashboard;
  }

  private async getAllParticipants(): Promise<BetaParticipant[]> {
    // TODO: Implement database query
    return [];
  }

  private calculateParticipantStatus(participants: BetaParticipant[]): Record<string, number> {
    const status: Record<string, number> = {};
    participants.forEach(participant => {
      status[participant.status] = (status[participant.status] || 0) + 1;
    });
    return status;
  }

  private getRecentParticipants(participants: BetaParticipant[]): BetaParticipant[] {
    return participants
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  private async getRecentFeedback(): Promise<Feedback[]> {
    // TODO: Implement database query
    return [];
  }

  private async calculateMetrics(
    participants: BetaParticipant[],
    feedbackAnalytics: any,
    usageAnalytics: UsageAnalytics
  ): Promise<AdminDashboard['metrics']> {
    const activeParticipants = participants.filter(p => p.status === 'onboarded').length;
    const totalParticipants = participants.length;

    return {
      activeParticipants,
      averageFeedbackPerParticipant: totalParticipants > 0
        ? feedbackAnalytics.totalFeedback / totalParticipants
        : 0,
      averageEventsPerParticipant: usageAnalytics.averageEventsPerParticipant,
      responseTime: feedbackAnalytics.averageResponseTime
    };
  }

  private invalidateCache(): void {
    this.cache.delete('dashboard');
    this.eventEmitter.emit('admin:dashboard:updated');
  }

  public on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }
} 