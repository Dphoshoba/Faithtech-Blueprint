import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const controller = new RecommendationController();

// Generate recommendations for an assessment
router.post(
  '/assessments/:assessmentId/recommendations',
  authenticate,
  validateRequest({
    params: {
      assessmentId: { type: 'string', required: true }
    }
  }),
  controller.generateRecommendations.bind(controller)
);

// Get recommendations for an assessment
router.get(
  '/assessments/:assessmentId/recommendations',
  authenticate,
  validateRequest({
    params: {
      assessmentId: { type: 'string', required: true }
    }
  }),
  controller.getRecommendations.bind(controller)
);

// Get recommendations for an organization
router.get(
  '/organizations/:organizationId/recommendations',
  authenticate,
  validateRequest({
    params: {
      organizationId: { type: 'string', required: true }
    }
  }),
  controller.getOrganizationRecommendations.bind(controller)
);

// Update implementation status
router.patch(
  '/recommendations/:recommendationId/status',
  authenticate,
  validateRequest({
    params: {
      recommendationId: { type: 'string', required: true }
    },
    body: {
      status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'], required: true },
      progress: { type: 'number', min: 0, max: 100, required: true },
      notes: { type: 'string' }
    }
  }),
  controller.updateImplementationStatus.bind(controller)
);

// Add feedback to recommendation
router.post(
  '/recommendations/:recommendationId/feedback',
  authenticate,
  validateRequest({
    params: {
      recommendationId: { type: 'string', required: true }
    },
    body: {
      helpful: { type: 'boolean', required: true },
      comments: { type: 'string' }
    }
  }),
  controller.addFeedback.bind(controller)
);

// Get implementation status for organization
router.get(
  '/organizations/:organizationId/implementation-status',
  authenticate,
  validateRequest({
    params: {
      organizationId: { type: 'string', required: true }
    }
  }),
  controller.getImplementationStatus.bind(controller)
);

export default router; 