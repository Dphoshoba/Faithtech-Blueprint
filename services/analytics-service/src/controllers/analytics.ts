import { Request, Response } from 'express';
import { AnalyticsRepository } from '../repositories/analytics';
import { AnalyticsProcessor } from '../services/analytics-processor';
import { EventValidator } from '../validators/event';
import { logger } from '../utils/logger';

export class AnalyticsController {
  private repository: AnalyticsRepository;
  private processor: AnalyticsProcessor;
  private validator: EventValidator;

  constructor() {
    this.repository = new AnalyticsRepository();
    this.processor = new AnalyticsProcessor();
    this.validator = new EventValidator();
  }

  // Event Collection Methods
  public trackEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { event, properties } = req.body;
      const userId = req.user?.id;

      await this.validator.validateEvent(event, properties);
      await this.repository.saveEvent(event, properties, userId);

      res.status(201).json({ message: 'Event tracked successfully' });
    } catch (error) {
      logger.error('Error tracking event:', error);
      res.status(500).json({ error: 'Failed to track event' });
    }
  };

  public identifyUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, traits } = req.body;
      await this.repository.updateUserProfile(userId, traits);
      res.status(200).json({ message: 'User identified successfully' });
    } catch (error) {
      logger.error('Error identifying user:', error);
      res.status(500).json({ error: 'Failed to identify user' });
    }
  };

  public trackPageView = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, properties } = req.body;
      const userId = req.user?.id;

      await this.repository.savePageView(page, properties, userId);
      res.status(201).json({ message: 'Page view tracked successfully' });
    } catch (error) {
      logger.error('Error tracking page view:', error);
      res.status(500).json({ error: 'Failed to track page view' });
    }
  };

  // KPI Metrics Methods
  public getKPIMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const metrics = await this.processor.calculateKPIMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error fetching KPI metrics:', error);
      res.status(500).json({ error: 'Failed to fetch KPI metrics' });
    }
  };

  public getConversionRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const rates = await this.processor.calculateConversionRates(timeRange);
      res.status(200).json(rates);
    } catch (error) {
      logger.error('Error fetching conversion rates:', error);
      res.status(500).json({ error: 'Failed to fetch conversion rates' });
    }
  };

  public getUserJourneyDistribution = async (req: Request, res: Response): Promise<void> => {
    try {
      const distribution = await this.processor.calculateUserJourneyDistribution();
      res.status(200).json(distribution);
    } catch (error) {
      logger.error('Error fetching user journey distribution:', error);
      res.status(500).json({ error: 'Failed to fetch user journey distribution' });
    }
  };

  public getEngagementMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const metrics = await this.processor.calculateEngagementMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error fetching engagement metrics:', error);
      res.status(500).json({ error: 'Failed to fetch engagement metrics' });
    }
  };

  public getRetentionMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const cohort = req.query.cohort as string;
      const metrics = await this.processor.calculateRetentionMetrics(cohort);
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error fetching retention metrics:', error);
      res.status(500).json({ error: 'Failed to fetch retention metrics' });
    }
  };

  // Feature Usage Analytics Methods
  public getFeatureUsage = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const usage = await this.processor.calculateFeatureUsage(timeRange);
      res.status(200).json(usage);
    } catch (error) {
      logger.error('Error fetching feature usage:', error);
      res.status(500).json({ error: 'Failed to fetch feature usage' });
    }
  };

  public getFeatureSatisfaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const satisfaction = await this.processor.calculateFeatureSatisfaction();
      res.status(200).json(satisfaction);
    } catch (error) {
      logger.error('Error fetching feature satisfaction:', error);
      res.status(500).json({ error: 'Failed to fetch feature satisfaction' });
    }
  };

  // User Behavior Analytics Methods
  public getUserPaths = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const paths = await this.processor.analyzeUserPaths(timeRange);
      res.status(200).json(paths);
    } catch (error) {
      logger.error('Error analyzing user paths:', error);
      res.status(500).json({ error: 'Failed to analyze user paths' });
    }
  };

  public getSessionAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const analysis = await this.processor.analyzeUserSessions(timeRange);
      res.status(200).json(analysis);
    } catch (error) {
      logger.error('Error analyzing sessions:', error);
      res.status(500).json({ error: 'Failed to analyze sessions' });
    }
  };

  public getUserSegments = async (req: Request, res: Response): Promise<void> => {
    try {
      const segments = await this.processor.calculateUserSegments();
      res.status(200).json(segments);
    } catch (error) {
      logger.error('Error fetching user segments:', error);
      res.status(500).json({ error: 'Failed to fetch user segments' });
    }
  };

  // Performance Analytics Methods
  public getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const metrics = await this.processor.calculatePerformanceMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  };

  public getErrorMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const metrics = await this.processor.calculateErrorMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error fetching error metrics:', error);
      res.status(500).json({ error: 'Failed to fetch error metrics' });
    }
  };

  public getAPIUsageMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const metrics = await this.processor.calculateAPIUsageMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Error fetching API usage metrics:', error);
      res.status(500).json({ error: 'Failed to fetch API usage metrics' });
    }
  };

  // Conversion Funnel Methods
  public getFunnelAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { funnelName } = req.params;
      const timeRange = req.query.timeRange as string;
      const analytics = await this.processor.calculateFunnelAnalytics(funnelName, timeRange);
      res.status(200).json(analytics);
    } catch (error) {
      logger.error('Error fetching funnel analytics:', error);
      res.status(500).json({ error: 'Failed to fetch funnel analytics' });
    }
  };

  public getAllFunnelAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const timeRange = req.query.timeRange as string;
      const analytics = await this.processor.calculateAllFunnelAnalytics(timeRange);
      res.status(200).json(analytics);
    } catch (error) {
      logger.error('Error fetching all funnel analytics:', error);
      res.status(500).json({ error: 'Failed to fetch all funnel analytics' });
    }
  };

  public getFunnelDropoffAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { funnelName } = req.params;
      const timeRange = req.query.timeRange as string;
      const analysis = await this.processor.analyzeFunnelDropoffs(funnelName, timeRange);
      res.status(200).json(analysis);
    } catch (error) {
      logger.error('Error analyzing funnel dropoffs:', error);
      res.status(500).json({ error: 'Failed to analyze funnel dropoffs' });
    }
  };

  public getFunnelCohortAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { funnelName } = req.params;
      const cohortType = req.query.cohortType as string;
      const analysis = await this.processor.analyzeFunnelCohorts(funnelName, cohortType);
      res.status(200).json(analysis);
    } catch (error) {
      logger.error('Error analyzing funnel cohorts:', error);
      res.status(500).json({ error: 'Failed to analyze funnel cohorts' });
    }
  };
}
