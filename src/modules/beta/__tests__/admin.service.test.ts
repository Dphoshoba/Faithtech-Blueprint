import { AdminService } from '../admin.service';
import { BetaService } from '../beta.service';
import { FeedbackService } from '../feedback.service';
import { AnalyticsService } from '../analytics.service';

describe('AdminService', () => {
  let adminService: AdminService;
  let betaService: BetaService;
  let feedbackService: FeedbackService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    betaService = new BetaService();
    feedbackService = new FeedbackService();
    analyticsService = new AnalyticsService();
    adminService = new AdminService(betaService, feedbackService, analyticsService);
  });

  describe('getDashboard', () => {
    it('should return dashboard with all required sections', async () => {
      const dashboard = await adminService.getDashboard();
      
      expect(dashboard).toHaveProperty('participants');
      expect(dashboard).toHaveProperty('feedback');
      expect(dashboard).toHaveProperty('analytics');
      expect(dashboard).toHaveProperty('metrics');
    });

    it('should cache dashboard data', async () => {
      const dashboard1 = await adminService.getDashboard();
      const dashboard2 = await adminService.getDashboard();
      
      expect(dashboard1).toBe(dashboard2);
    });

    it('should invalidate cache on participant status change', async () => {
      const dashboard1 = await adminService.getDashboard();
      
      // Simulate participant status change
      betaService.on('beta:approved', () => {});
      betaService.emit('beta:approved', { participant: { id: 'test' } });
      
      const dashboard2 = await adminService.getDashboard();
      expect(dashboard1).not.toBe(dashboard2);
    });

    it('should invalidate cache on feedback update', async () => {
      const dashboard1 = await adminService.getDashboard();
      
      // Simulate feedback update
      feedbackService.on('feedback:updated', () => {});
      feedbackService.emit('feedback:updated', { feedback: { id: 'test' } });
      
      const dashboard2 = await adminService.getDashboard();
      expect(dashboard1).not.toBe(dashboard2);
    });
  });

  describe('dashboard data', () => {
    it('should calculate correct participant metrics', async () => {
      const dashboard = await adminService.getDashboard();
      
      expect(dashboard.participants).toHaveProperty('total');
      expect(dashboard.participants).toHaveProperty('byStatus');
      expect(dashboard.participants).toHaveProperty('recent');
      expect(Array.isArray(dashboard.participants.recent)).toBe(true);
    });

    it('should calculate correct feedback metrics', async () => {
      const dashboard = await adminService.getDashboard();
      
      expect(dashboard.feedback).toHaveProperty('total');
      expect(dashboard.feedback).toHaveProperty('byCategory');
      expect(dashboard.feedback).toHaveProperty('byPriority');
      expect(dashboard.feedback).toHaveProperty('byStatus');
      expect(dashboard.feedback).toHaveProperty('recent');
      expect(Array.isArray(dashboard.feedback.recent)).toBe(true);
    });

    it('should include usage analytics', async () => {
      const dashboard = await adminService.getDashboard();
      
      expect(dashboard.analytics).toHaveProperty('totalEvents');
      expect(dashboard.analytics).toHaveProperty('eventsByType');
      expect(dashboard.analytics).toHaveProperty('eventsByParticipant');
      expect(dashboard.analytics).toHaveProperty('averageEventsPerParticipant');
      expect(dashboard.analytics).toHaveProperty('mostActiveParticipants');
      expect(dashboard.analytics).toHaveProperty('eventTimeline');
    });

    it('should calculate correct overall metrics', async () => {
      const dashboard = await adminService.getDashboard();
      
      expect(dashboard.metrics).toHaveProperty('activeParticipants');
      expect(dashboard.metrics).toHaveProperty('averageFeedbackPerParticipant');
      expect(dashboard.metrics).toHaveProperty('averageEventsPerParticipant');
      expect(dashboard.metrics).toHaveProperty('responseTime');
    });
  });

  describe('event handling', () => {
    it('should emit dashboard update events', async () => {
      const events: any[] = [];
      
      adminService.on('admin:dashboard:updated', () => events.push('updated'));
      
      // Simulate cache invalidation
      betaService.emit('beta:approved', { participant: { id: 'test' } });
      
      expect(events).toContain('updated');
    });
  });
}); 