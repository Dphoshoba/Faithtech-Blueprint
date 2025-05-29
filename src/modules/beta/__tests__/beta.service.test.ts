import { BetaService, BetaParticipant } from '../beta.service';

describe('BetaService', () => {
  let betaService: BetaService;
  let mockParticipant: Omit<BetaParticipant, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

  beforeEach(() => {
    betaService = new BetaService();
    mockParticipant = {
      churchName: 'Test Church',
      churchSize: 200,
      location: 'Test City',
      contactName: 'John Doe',
      contactEmail: 'john@testchurch.com',
      contactPhone: '123-456-7890',
      techReadiness: 4,
      useCases: ['worship', 'community', 'giving']
    };
  });

  describe('applyForBeta', () => {
    it('should accept valid applications', async () => {
      const result = await betaService.applyForBeta(mockParticipant);
      
      expect(result).toMatchObject({
        ...mockParticipant,
        status: 'pending'
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject applications with missing required fields', async () => {
      const invalidParticipant = { ...mockParticipant, churchName: '' };
      
      await expect(betaService.applyForBeta(invalidParticipant))
        .rejects
        .toThrow('Invalid application: Church name is required');
    });

    it('should reject applications with church size below minimum', async () => {
      const invalidParticipant = { ...mockParticipant, churchSize: 20 };
      
      await expect(betaService.applyForBeta(invalidParticipant))
        .rejects
        .toThrow('Invalid application: Church size must be at least 50');
    });

    it('should reject applications with church size above maximum', async () => {
      const invalidParticipant = { ...mockParticipant, churchSize: 6000 };
      
      await expect(betaService.applyForBeta(invalidParticipant))
        .rejects
        .toThrow('Invalid application: Church size must be less than 5000');
    });

    it('should reject applications with low tech readiness', async () => {
      const invalidParticipant = { ...mockParticipant, techReadiness: 1 };
      
      await expect(betaService.applyForBeta(invalidParticipant))
        .rejects
        .toThrow('Invalid application: Tech readiness score must be at least 3');
    });

    it('should reject applications with no use cases', async () => {
      const invalidParticipant = { ...mockParticipant, useCases: [] };
      
      await expect(betaService.applyForBeta(invalidParticipant))
        .rejects
        .toThrow('Invalid application: At least one use case must be selected');
    });
  });

  describe('application evaluation', () => {
    it('should approve applications meeting criteria', async () => {
      const result = await betaService.applyForBeta(mockParticipant);
      
      // Wait for evaluation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updated = await betaService.getApplication(result.id);
      expect(updated?.status).toBe('approved');
    });

    it('should reject applications not meeting criteria', async () => {
      const lowScoreParticipant = {
        ...mockParticipant,
        churchSize: 60,
        techReadiness: 3,
        useCases: ['worship']
      };
      
      const result = await betaService.applyForBeta(lowScoreParticipant);
      
      // Wait for evaluation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updated = await betaService.getApplication(result.id);
      expect(updated?.status).toBe('rejected');
    });
  });

  describe('criteria management', () => {
    it('should allow updating criteria', () => {
      const newCriteria = {
        minChurchSize: 100,
        maxChurchSize: 2000,
        requiredUseCases: ['worship'],
        minTechReadiness: 4,
        maxParticipants: 25
      };
      
      betaService.setCriteria(newCriteria);
      const updatedCriteria = betaService.getCriteria();
      
      expect(updatedCriteria).toEqual(newCriteria);
    });

    it('should allow partial criteria updates', () => {
      const originalCriteria = betaService.getCriteria();
      const partialUpdate = {
        minChurchSize: 100,
        maxParticipants: 25
      };
      
      betaService.setCriteria(partialUpdate);
      const updatedCriteria = betaService.getCriteria();
      
      expect(updatedCriteria).toEqual({
        ...originalCriteria,
        ...partialUpdate
      });
    });
  });

  describe('event handling', () => {
    it('should emit events for application status changes', async () => {
      const events: any[] = [];
      
      betaService.on('beta:approved', (data) => events.push(data));
      betaService.on('beta:rejected', (data) => events.push(data));
      betaService.on('beta:onboarded', (data) => events.push(data));
      
      const result = await betaService.applyForBeta(mockParticipant);
      
      // Wait for evaluation and onboarding to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].participant.id).toBe(result.id);
    });
  });
}); 