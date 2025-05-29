import { AnalyticsService, UsageMetric } from '../analytics.service';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
  });

  describe('trackEvent', () => {
    it('should track event with basic data', async () => {
      const result = await analyticsService.trackEvent('beta-123', 'login');
      
      expect(result).toMatchObject({
        participantId: 'beta-123',
        eventType: 'login',
        eventData: {}
      });
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should track event with additional data', async () => {
      const eventData = {
        page: 'dashboard',
        duration: 300
      };
      
      const result = await analyticsService.trackEvent('beta-123', 'page_view', eventData);
      
      expect(result.eventData).toEqual(eventData);
    });
  });

  describe('getAnalytics', () => {
    it('should calculate correct analytics for single event', async () => {
      await analyticsService.trackEvent('beta-123', 'login');
      
      const analytics = await analyticsService.getAnalytics();
      
      expect(analytics.totalEvents).toBe(1);
      expect(analytics.eventsByType.login).toBe(1);
      expect(analytics.eventsByParticipant['beta-123']).toBe(1);
      expect(analytics.averageEventsPerParticipant).toBe(1);
      expect(analytics.mostActiveParticipants).toHaveLength(1);
      expect(analytics.eventTimeline).toHaveLength(7); // Default week timeframe
    });

    it('should calculate correct analytics for multiple events', async () => {
      // Track events for participant 1
      await analyticsService.trackEvent('beta-123', 'login');
      await analyticsService.trackEvent('beta-123', 'page_view', { page: 'dashboard' });
      await analyticsService.trackEvent('beta-123', 'feature_use', { feature: 'calendar' });
      
      // Track events for participant 2
      await analyticsService.trackEvent('beta-456', 'login');
      await analyticsService.trackEvent('beta-456', 'page_view', { page: 'profile' });
      
      const analytics = await analyticsService.getAnalytics();
      
      expect(analytics.totalEvents).toBe(5);
      expect(analytics.eventsByType.login).toBe(2);
      expect(analytics.eventsByType.page_view).toBe(2);
      expect(analytics.eventsByType.feature_use).toBe(1);
      expect(analytics.eventsByParticipant['beta-123']).toBe(3);
      expect(analytics.eventsByParticipant['beta-456']).toBe(2);
      expect(analytics.averageEventsPerParticipant).toBe(2.5);
      expect(analytics.mostActiveParticipants).toHaveLength(2);
      expect(analytics.mostActiveParticipants[0].participantId).toBe('beta-123');
      expect(analytics.mostActiveParticipants[0].eventCount).toBe(3);
    });

    it('should handle different timeframes', async () => {
      // Track events
      await analyticsService.trackEvent('beta-123', 'login');
      await analyticsService.trackEvent('beta-123', 'page_view');
      
      // Get analytics for different timeframes
      const dayAnalytics = await analyticsService.getAnalytics('day');
      const weekAnalytics = await analyticsService.getAnalytics('week');
      const monthAnalytics = await analyticsService.getAnalytics('month');
      
      expect(dayAnalytics.eventTimeline).toHaveLength(1);
      expect(weekAnalytics.eventTimeline).toHaveLength(7);
      expect(monthAnalytics.eventTimeline).toHaveLength(30);
    });

    it('should handle empty event list', async () => {
      const analytics = await analyticsService.getAnalytics();
      
      expect(analytics.totalEvents).toBe(0);
      expect(analytics.averageEventsPerParticipant).toBe(0);
      expect(analytics.mostActiveParticipants).toHaveLength(0);
      expect(analytics.eventTimeline).toHaveLength(7);
      expect(analytics.eventTimeline.every(item => item.count === 0)).toBe(true);
    });
  });

  describe('event handling', () => {
    it('should emit events for tracked metrics', async () => {
      const events: any[] = [];
      
      analyticsService.on('analytics:event', (data) => events.push(data));
      
      await analyticsService.trackEvent('beta-123', 'login');
      
      expect(events.length).toBe(1);
      expect(events[0].metric.participantId).toBe('beta-123');
      expect(events[0].metric.eventType).toBe('login');
    });
  });
}); 