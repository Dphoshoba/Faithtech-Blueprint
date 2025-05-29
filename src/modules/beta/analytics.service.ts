import { EventEmitter } from '../../utils/event-emitter';
import { Cache } from '../../utils/cache';
import logger from '../../utils/logger';

export interface UsageMetric {
  id: string;
  participantId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
}

export interface UsageAnalytics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByParticipant: Record<string, number>;
  averageEventsPerParticipant: number;
  mostActiveParticipants: Array<{ participantId: string; eventCount: number }>;
  eventTimeline: Array<{ date: string; count: number }>;
}

export class AnalyticsService {
  private eventEmitter: EventEmitter;
  private cache: Cache<UsageMetric>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.cache = new Cache<UsageMetric>({ maxSize: 10000 });
  }

  async trackEvent(participantId: string, eventType: string, eventData: Record<string, any> = {}): Promise<UsageMetric> {
    logger.info('Tracking usage event', { participantId, eventType });

    const metric: UsageMetric = {
      id: this.generateId(),
      participantId,
      eventType,
      eventData,
      timestamp: new Date()
    };

    await this.storeMetric(metric);
    this.eventEmitter.emit('analytics:event', { metric });

    return metric;
  }

  async getAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<UsageAnalytics> {
    const metrics = await this.getMetrics(timeframe);
    
    const analytics: UsageAnalytics = {
      totalEvents: metrics.length,
      eventsByType: {},
      eventsByParticipant: {},
      averageEventsPerParticipant: 0,
      mostActiveParticipants: [],
      eventTimeline: []
    };

    // Calculate event type distribution
    metrics.forEach(metric => {
      analytics.eventsByType[metric.eventType] = (analytics.eventsByType[metric.eventType] || 0) + 1;
      analytics.eventsByParticipant[metric.participantId] = (analytics.eventsByParticipant[metric.participantId] || 0) + 1;
    });

    // Calculate average events per participant
    const uniqueParticipants = Object.keys(analytics.eventsByParticipant).length;
    analytics.averageEventsPerParticipant = uniqueParticipants > 0
      ? metrics.length / uniqueParticipants
      : 0;

    // Get most active participants
    analytics.mostActiveParticipants = Object.entries(analytics.eventsByParticipant)
      .map(([participantId, eventCount]) => ({ participantId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Generate event timeline
    const timeline = this.generateTimeline(metrics, timeframe);
    analytics.eventTimeline = timeline;

    return analytics;
  }

  private generateTimeline(metrics: UsageMetric[], timeframe: 'day' | 'week' | 'month'): Array<{ date: string; count: number }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const timeline: Record<string, number> = {};
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      timeline[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    metrics.forEach(metric => {
      const dateStr = metric.timestamp.toISOString().split('T')[0];
      if (timeline[dateStr] !== undefined) {
        timeline[dateStr]++;
      }
    });

    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async storeMetric(metric: UsageMetric): Promise<void> {
    // TODO: Implement database storage
    this.cache.set(`metric:${metric.id}`, metric);
  }

  private async getMetrics(timeframe: 'day' | 'week' | 'month'): Promise<UsageMetric[]> {
    // TODO: Implement database query
    return [];
  }

  private generateId(): string {
    return `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }
} 