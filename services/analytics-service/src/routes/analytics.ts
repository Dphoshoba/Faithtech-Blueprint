import express from 'express';
import { validateToken } from '../middleware/auth';
import { AnalyticsController } from '../controllers/analytics';
import { validateEventSchema } from '../middleware/validation';

const router = express.Router();
const controller = new AnalyticsController();

// Event Collection Endpoints
router.post('/events', validateToken, validateEventSchema, controller.trackEvent);
router.post('/identify', validateToken, controller.identifyUser);
router.post('/page', validateToken, controller.trackPageView);

// KPI Metrics Endpoints
router.get('/kpi', validateToken, controller.getKPIMetrics);
router.get('/conversion-rates', validateToken, controller.getConversionRates);
router.get('/user-journey', validateToken, controller.getUserJourneyDistribution);
router.get('/engagement', validateToken, controller.getEngagementMetrics);
router.get('/retention', validateToken, controller.getRetentionMetrics);

// Feature Usage Analytics
router.get('/feature-usage', validateToken, controller.getFeatureUsage);
router.get('/feature-satisfaction', validateToken, controller.getFeatureSatisfaction);

// User Behavior Analytics
router.get('/user-paths', validateToken, controller.getUserPaths);
router.get('/session-analysis', validateToken, controller.getSessionAnalysis);
router.get('/user-segments', validateToken, controller.getUserSegments);

// Performance Analytics
router.get('/performance', validateToken, controller.getPerformanceMetrics);
router.get('/errors', validateToken, controller.getErrorMetrics);
router.get('/api-usage', validateToken, controller.getAPIUsageMetrics);

// Conversion Funnel Analytics
router.get('/funnels', validateToken, controller.getAllFunnelAnalytics);
router.get('/funnels/:funnelName', validateToken, controller.getFunnelAnalytics);
router.get('/funnels/:funnelName/dropoffs', validateToken, controller.getFunnelDropoffAnalysis);
router.get('/funnels/:funnelName/cohorts', validateToken, controller.getFunnelCohortAnalysis);

export default router;
