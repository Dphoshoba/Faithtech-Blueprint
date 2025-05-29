import { FeedbackService, Feedback } from '../feedback.service';

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  let mockFeedback: Omit<Feedback, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

  beforeEach(() => {
    feedbackService = new FeedbackService();
    mockFeedback = {
      participantId: 'beta-123',
      category: 'bug',
      title: 'Login button not working',
      description: 'The login button does not respond when clicked',
      priority: 'high'
    };
  });

  describe('submitFeedback', () => {
    it('should accept valid feedback', async () => {
      const result = await feedbackService.submitFeedback(mockFeedback);
      
      expect(result).toMatchObject({
        ...mockFeedback,
        status: 'new'
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject feedback with missing required fields', async () => {
      const invalidFeedback = { ...mockFeedback, title: '' };
      
      await expect(feedbackService.submitFeedback(invalidFeedback))
        .rejects
        .toThrow('Invalid feedback: Title is required');
    });

    it('should reject feedback with missing participant ID', async () => {
      const invalidFeedback = { ...mockFeedback, participantId: '' };
      
      await expect(feedbackService.submitFeedback(invalidFeedback))
        .rejects
        .toThrow('Invalid feedback: Participant ID is required');
    });

    it('should reject feedback with missing description', async () => {
      const invalidFeedback = { ...mockFeedback, description: '' };
      
      await expect(feedbackService.submitFeedback(invalidFeedback))
        .rejects
        .toThrow('Invalid feedback: Description is required');
    });

    it('should reject feedback with missing category', async () => {
      const invalidFeedback = { ...mockFeedback, category: undefined as any };
      
      await expect(feedbackService.submitFeedback(invalidFeedback))
        .rejects
        .toThrow('Invalid feedback: Category is required');
    });

    it('should reject feedback with missing priority', async () => {
      const invalidFeedback = { ...mockFeedback, priority: undefined as any };
      
      await expect(feedbackService.submitFeedback(invalidFeedback))
        .rejects
        .toThrow('Invalid feedback: Priority is required');
    });
  });

  describe('updateFeedbackStatus', () => {
    it('should update feedback status', async () => {
      const feedback = await feedbackService.submitFeedback(mockFeedback);
      const updated = await feedbackService.updateFeedbackStatus(feedback.id, 'in-progress');
      
      expect(updated.status).toBe('in-progress');
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent feedback', async () => {
      await expect(feedbackService.updateFeedbackStatus('non-existent', 'in-progress'))
        .rejects
        .toThrow('Feedback not found');
    });
  });

  describe('getFeedback', () => {
    it('should return feedback by ID', async () => {
      const feedback = await feedbackService.submitFeedback(mockFeedback);
      const retrieved = await feedbackService.getFeedback(feedback.id);
      
      expect(retrieved).toEqual(feedback);
    });

    it('should return null for non-existent feedback', async () => {
      const retrieved = await feedbackService.getFeedback('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAnalytics', () => {
    it('should calculate correct analytics', async () => {
      // Submit multiple feedback items
      await feedbackService.submitFeedback(mockFeedback);
      await feedbackService.submitFeedback({
        ...mockFeedback,
        category: 'feature',
        priority: 'medium'
      });
      
      const feedback = await feedbackService.submitFeedback({
        ...mockFeedback,
        category: 'usability',
        priority: 'low'
      });
      
      // Update one feedback status
      await feedbackService.updateFeedbackStatus(feedback.id, 'resolved');
      
      const analytics = await feedbackService.getAnalytics();
      
      expect(analytics.totalFeedback).toBe(3);
      expect(analytics.byCategory.bug).toBe(1);
      expect(analytics.byCategory.feature).toBe(1);
      expect(analytics.byCategory.usability).toBe(1);
      expect(analytics.byPriority.high).toBe(1);
      expect(analytics.byPriority.medium).toBe(1);
      expect(analytics.byPriority.low).toBe(1);
      expect(analytics.byStatus.new).toBe(2);
      expect(analytics.byStatus.resolved).toBe(1);
      expect(analytics.resolutionRate).toBe(1/3);
      expect(analytics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should handle empty feedback list', async () => {
      const analytics = await feedbackService.getAnalytics();
      
      expect(analytics.totalFeedback).toBe(0);
      expect(analytics.resolutionRate).toBe(0);
      expect(analytics.averageResponseTime).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should emit events for feedback actions', async () => {
      const events: any[] = [];
      
      feedbackService.on('feedback:submitted', (data) => events.push(data));
      feedbackService.on('feedback:updated', (data) => events.push(data));
      
      const feedback = await feedbackService.submitFeedback(mockFeedback);
      await feedbackService.updateFeedbackStatus(feedback.id, 'in-progress');
      
      expect(events.length).toBe(2);
      expect(events[0].feedback.id).toBe(feedback.id);
      expect(events[1].feedback.id).toBe(feedback.id);
    });
  });
}); 