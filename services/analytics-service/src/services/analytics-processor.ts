import { AnalyticsRepository } from '../repositories/analytics';
import { logger } from '../utils/logger';
import { differenceInDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { Types } from 'mongoose';
import { UserModel } from '../models/user';
import { AssessmentModel } from '../models/assessment';
import { TemplateModel } from '../models/template';
import { SubscriptionModel } from '../models/subscription';
import { FunnelModel } from '../models/funnel';

interface UserSegment {
  _id: string;
  count: number;
}

interface AssessmentData {
  _id: string;
  completions: number;
}

interface TrendData {
  _id: string;
  count: number;
  downloads?: number;
}

interface TemplateData {
  name: string;
  downloadCount: number;
}

interface SubscriptionTier {
  _id: string;
  count: number;
}

export class AnalyticsProcessor {
  private repository: AnalyticsRepository;

  constructor() {
    this.repository = new AnalyticsRepository();
  }

  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = endOfDay(new Date());
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = startOfDay(subDays(endDate, 7));
        break;
      case '30d':
        startDate = startOfDay(subDays(endDate, 30));
        break;
      case '90d':
        startDate = startOfDay(subDays(endDate, 90));
        break;
      default:
        startDate = startOfDay(subDays(endDate, 30)); // Default to 30 days
    }

    return { startDate, endDate };
  }

  public async calculateKPIMetrics(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const previousStartDate = subDays(startDate, differenceInDays(endDate, startDate));

      // Current period metrics
      const currentActiveUsers = await this.repository.getUniqueUsers(startDate, endDate);
      const currentEvents = await this.repository.getEventsByTimeRange(startDate, endDate);
      
      // Previous period metrics for trend calculation
      const previousActiveUsers = await this.repository.getUniqueUsers(previousStartDate, startDate);

      // Calculate trends
      const usersTrend = ((currentActiveUsers - previousActiveUsers) / previousActiveUsers) * 100;

      return {
        activeUsers: {
          count: currentActiveUsers,
          trend: usersTrend,
        },
        totalEvents: currentEvents.length,
        averageEventsPerUser: currentEvents.length / (currentActiveUsers || 1),
      };
    } catch (error) {
      logger.error('Error calculating KPI metrics:', error);
      throw new Error('Failed to calculate KPI metrics');
    }
  }

  public async calculateConversionRates(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(startDate, endDate);

      const conversionSteps = [
        'signup_started',
        'signup_completed',
        'onboarding_started',
        'onboarding_completed',
      ];

      const stepCounts = events.reduce((acc, event) => {
        if (conversionSteps.includes(event.event)) {
          acc[event.event] = (acc[event.event] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate conversion rates between steps
      const conversionRates: Record<string, number> = {};
      for (let i = 0; i < conversionSteps.length - 1; i++) {
        const currentStep = stepCounts[conversionSteps[i]] || 0;
        const nextStep = stepCounts[conversionSteps[i + 1]] || 0;
        conversionRates[`${conversionSteps[i]}_to_${conversionSteps[i + 1]}`] =
          currentStep ? (nextStep / currentStep) * 100 : 0;
      }

      return conversionRates;
    } catch (error) {
      logger.error('Error calculating conversion rates:', error);
      throw new Error('Failed to calculate conversion rates');
    }
  }

  public async calculateUserJourneyDistribution() {
    try {
      const events = await this.repository.getEventsByTimeRange(
        subDays(new Date(), 30),
        new Date()
      );

      // Define user journey stages and their criteria
      const journeyStages = {
        visitor: (events: any[]) => events.length > 0,
        prospect: (events: any[]) => events.some(e => e.event === 'signup_started'),
        trial: (events: any[]) => events.some(e => e.event === 'signup_completed'),
        active: (events: any[]) => events.filter(e => e.event === 'feature_used').length >= 5,
        power_user: (events: any[]) => events.filter(e => e.event === 'feature_used').length >= 20,
      };

      // Group events by user
      const userEvents = events.reduce((acc, event) => {
        if (event.userId) {
          if (!acc[event.userId]) {
            acc[event.userId] = [];
          }
          acc[event.userId].push(event);
        }
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate distribution
      const distribution: Record<string, number> = {};
      Object.entries(journeyStages).forEach(([stage, criteria]) => {
        distribution[stage] = Object.values(userEvents).filter(criteria).length;
      });

      return distribution;
    } catch (error) {
      logger.error('Error calculating user journey distribution:', error);
      throw new Error('Failed to calculate user journey distribution');
    }
  }

  public async calculateEngagementMetrics(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const sessions = await this.repository.getUserSessions(startDate, endDate);

      const metrics = {
        averageSessionDuration: 0,
        sessionsPerUser: 0,
        totalSessions: 0,
        activeUsers: 0,
      };

      if (sessions.length > 0) {
        metrics.totalSessions = sessions.reduce((sum, s) => sum + s.session_count, 0);
        metrics.activeUsers = sessions.length;
        metrics.sessionsPerUser = metrics.totalSessions / metrics.activeUsers;
        metrics.averageSessionDuration = sessions.reduce((sum, s) => sum + (s.avg_session_duration || 0), 0) / sessions.length;
      }

      return metrics;
    } catch (error) {
      logger.error('Error calculating engagement metrics:', error);
      throw new Error('Failed to calculate engagement metrics');
    }
  }

  public async calculateRetentionMetrics(cohort: string) {
    try {
      const cohortDate = new Date(cohort);
      const intervals = [1, 7, 30]; // Days to check retention

      const metrics: Record<string, number> = {};

      // Get initial cohort size
      const cohortUsers = await this.repository.getEventsByTimeRange(
        startOfDay(cohortDate),
        endOfDay(cohortDate)
      );

      const cohortUserIds = [...new Set(cohortUsers.map(e => e.userId))];
      const initialSize = cohortUserIds.length;

      // Calculate retention for each interval
      for (const days of intervals) {
        const retentionDate = subDays(new Date(), days);
        const activeUsers = await this.repository.getEventsByTimeRange(
          startOfDay(retentionDate),
          endOfDay(retentionDate)
        );

        const activeUserIds = [...new Set(activeUsers.map(e => e.userId))];
        const retainedUsers = cohortUserIds.filter(id => activeUserIds.includes(id));

        metrics[`day${days}`] = initialSize ? (retainedUsers.length / initialSize) * 100 : 0;
      }

      return metrics;
    } catch (error) {
      logger.error('Error calculating retention metrics:', error);
      throw new Error('Failed to calculate retention metrics');
    }
  }

  public async calculateFeatureUsage(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(
        startDate,
        endDate,
        'feature_used'
      );

      const usage = events.reduce((acc, event) => {
        const feature = event.properties.feature_id;
        if (feature) {
          acc[feature] = (acc[feature] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return usage;
    } catch (error) {
      logger.error('Error calculating feature usage:', error);
      throw new Error('Failed to calculate feature usage');
    }
  }

  public async calculateFeatureSatisfaction() {
    try {
      const events = await this.repository.getEventsByTimeRange(
        subDays(new Date(), 30),
        new Date(),
        'feature_feedback'
      );

      const satisfaction = events.reduce((acc, event) => {
        const { feature_id, rating } = event.properties;
        if (feature_id && rating) {
          if (!acc[feature_id]) {
            acc[feature_id] = { total: 0, count: 0 };
          }
          acc[feature_id].total += rating;
          acc[feature_id].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      // Calculate average satisfaction scores
      return Object.entries(satisfaction).reduce((acc, [feature, data]) => {
        acc[feature] = data.total / data.count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Error calculating feature satisfaction:', error);
      throw new Error('Failed to calculate feature satisfaction');
    }
  }

  public async analyzeUserPaths(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(startDate, endDate);

      // Group events by user and sort by timestamp
      const userPaths = events.reduce((acc, event) => {
        if (event.userId) {
          if (!acc[event.userId]) {
            acc[event.userId] = [];
          }
          acc[event.userId].push({
            event: event.event,
            timestamp: event.timestamp,
          });
        }
        return acc;
      }, {} as Record<string, Array<{ event: string; timestamp: Date }>>);

      // Sort paths by timestamp
      Object.values(userPaths).forEach(path => {
        path.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });

      return userPaths;
    } catch (error) {
      logger.error('Error analyzing user paths:', error);
      throw new Error('Failed to analyze user paths');
    }
  }

  public async analyzeUserSessions(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const sessions = await this.repository.getUserSessions(startDate, endDate);

      const analysis = {
        totalSessions: 0,
        averageDuration: 0,
        sessionDistribution: {} as Record<string, number>,
      };

      if (sessions.length > 0) {
        analysis.totalSessions = sessions.reduce((sum, s) => sum + s.session_count, 0);
        analysis.averageDuration = sessions.reduce((sum, s) => sum + (s.avg_session_duration || 0), 0) / sessions.length;

        // Calculate session duration distribution
        sessions.forEach(session => {
          const duration = Math.floor(session.avg_session_duration || 0);
          const bracket = `${Math.floor(duration / 5) * 5}-${Math.floor(duration / 5) * 5 + 5}min`;
          analysis.sessionDistribution[bracket] = (analysis.sessionDistribution[bracket] || 0) + 1;
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Error analyzing user sessions:', error);
      throw new Error('Failed to analyze user sessions');
    }
  }

  public async calculateUserSegments() {
    try {
      const events = await this.repository.getEventsByTimeRange(
        subDays(new Date(), 30),
        new Date()
      );

      // Define segment criteria
      const segments = {
        new_users: (userEvents: any[]) => userEvents.length === 1,
        casual_users: (userEvents: any[]) => userEvents.length > 1 && userEvents.length <= 5,
        regular_users: (userEvents: any[]) => userEvents.length > 5 && userEvents.length <= 20,
        power_users: (userEvents: any[]) => userEvents.length > 20,
      };

      // Group events by user
      const userEvents = events.reduce((acc, event) => {
        if (event.userId) {
          if (!acc[event.userId]) {
            acc[event.userId] = [];
          }
          acc[event.userId].push(event);
        }
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate segments
      const segmentCounts: Record<string, number> = {};
      Object.entries(segments).forEach(([segment, criteria]) => {
        segmentCounts[segment] = Object.values(userEvents).filter(criteria).length;
      });

      return segmentCounts;
    } catch (error) {
      logger.error('Error calculating user segments:', error);
      throw new Error('Failed to calculate user segments');
    }
  }

  public async calculatePerformanceMetrics(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(
        startDate,
        endDate,
        'performance_metric'
      );

      const metrics = {
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0,
      };

      if (events.length > 0) {
        const responseTimes = events
          .filter(e => e.properties.metric_type === 'response_time')
          .map(e => e.properties.value);

        const errors = events
          .filter(e => e.properties.metric_type === 'error')
          .length;

        metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        metrics.errorRate = (errors / events.length) * 100;
        metrics.slowRequests = responseTimes.filter(t => t > 1000).length;
      }

      return metrics;
    } catch (error) {
      logger.error('Error calculating performance metrics:', error);
      throw new Error('Failed to calculate performance metrics');
    }
  }

  public async calculateErrorMetrics(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(
        startDate,
        endDate,
        'error'
      );

      // Group errors by type
      const errorsByType = events.reduce((acc, event) => {
        const errorType = event.properties.error_type || 'unknown';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalErrors: events.length,
        errorsByType,
        errorRate: events.length / (await this.repository.getEventCounts(startDate, endDate))['total'] * 100,
      };
    } catch (error) {
      logger.error('Error calculating error metrics:', error);
      throw new Error('Failed to calculate error metrics');
    }
  }

  public async calculateAPIUsageMetrics(timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(
        startDate,
        endDate,
        'api_request'
      );

      const metrics = {
        totalRequests: events.length,
        requestsByEndpoint: {} as Record<string, number>,
        averageResponseTime: 0,
        requestsPerMinute: 0,
      };

      if (events.length > 0) {
        // Calculate requests by endpoint
        metrics.requestsByEndpoint = events.reduce((acc, event) => {
          const endpoint = event.properties.endpoint || 'unknown';
          acc[endpoint] = (acc[endpoint] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate average response time
        const responseTimes = events
          .filter(e => e.properties.response_time)
          .map(e => e.properties.response_time);
        metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

        // Calculate requests per minute
        const timeRange = endDate.getTime() - startDate.getTime();
        metrics.requestsPerMinute = (events.length / (timeRange / 1000)) * 60;
      }

      return metrics;
    } catch (error) {
      logger.error('Error calculating API usage metrics:', error);
      throw new Error('Failed to calculate API usage metrics');
    }
  }

  async getUserMetrics(startDate: Date, endDate: Date) {
    const [
      totalUsers,
      newUsers,
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      userSegments,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      UserModel.countDocuments({
        lastActivityAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      UserModel.countDocuments({
        lastActivityAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      UserModel.countDocuments({
        lastActivityAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      UserModel.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const previousPeriodUsers = await UserModel.countDocuments({
      createdAt: {
        $gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
        $lt: startDate,
      },
    });

    const growth = previousPeriodUsers === 0
      ? 100
      : ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100;

    return {
      totalUsers,
      activeUsers: {
        daily: dailyActiveUsers,
        weekly: weeklyActiveUsers,
        monthly: monthlyActiveUsers,
      },
      userGrowth: {
        percentage: Math.round(growth * 100) / 100,
        trend: growth >= 0 ? 'up' : 'down',
      },
      userSegments: userSegments.map((segment: UserSegment) => ({
        name: segment._id,
        count: segment.count,
      })),
    };
  }

  async getAssessmentMetrics(startDate: Date, endDate: Date) {
    const [
      totalAssessments,
      completedAssessments,
      assessmentScores,
      popularAssessments,
      assessmentTrends,
    ] = await Promise.all([
      AssessmentModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      AssessmentModel.countDocuments({
        completedAt: { $exists: true },
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      AssessmentModel.aggregate([
        {
          $match: {
            completedAt: { $exists: true },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$score' },
          },
        },
      ]),
      AssessmentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$assessmentType',
            completions: { $sum: 1 },
          },
        },
        {
          $sort: { completions: -1 },
        },
        {
          $limit: 5,
        },
      ]),
      AssessmentModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { '_id': 1 },
        },
      ]),
    ]);

    return {
      totalAssessments,
      completionRate: totalAssessments === 0
        ? 0
        : Math.round((completedAssessments / totalAssessments) * 100),
      averageScore: assessmentScores[0]?.averageScore
        ? Math.round(assessmentScores[0].averageScore * 100) / 100
        : 0,
      popularAssessments: popularAssessments.map((assessment: AssessmentData) => ({
        name: assessment._id,
        completions: assessment.completions,
      })),
      assessmentTrends: assessmentTrends.map((trend: TrendData) => ({
        date: trend._id,
        count: trend.count,
      })),
    };
  }

  async getTemplateMetrics(startDate: Date, endDate: Date) {
    const [
      totalDownloads,
      customizedTemplates,
      templateRatings,
      popularTemplates,
      templateTrends,
    ] = await Promise.all([
      TemplateModel.aggregate([
        {
          $match: {
            'downloads.downloadedAt': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            downloadCount: { $size: '$downloads' },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$downloadCount' },
          },
        },
      ]),
      TemplateModel.countDocuments({
        'customizations.0': { $exists: true },
        updatedAt: { $gte: startDate, $lte: endDate },
      }),
      TemplateModel.aggregate([
        {
          $match: {
            'ratings.0': { $exists: true },
            updatedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $unwind: '$ratings',
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$ratings.rating' },
          },
        },
      ]),
      TemplateModel.aggregate([
        {
          $match: {
            'downloads.downloadedAt': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            name: 1,
            downloadCount: { $size: '$downloads' },
          },
        },
        {
          $sort: { downloadCount: -1 },
        },
        {
          $limit: 5,
        },
      ]),
      TemplateModel.aggregate([
        {
          $match: {
            'downloads.downloadedAt': { $gte: startDate, $lte: endDate },
          },
        },
        {
          $unwind: '$downloads',
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$downloads.downloadedAt' },
            },
            downloads: { $sum: 1 },
          },
        },
        {
          $sort: { '_id': 1 },
        },
      ]),
    ]);

    const totalTemplates = await TemplateModel.countDocuments({
      updatedAt: { $gte: startDate, $lte: endDate },
    });

    return {
      totalDownloads: totalDownloads[0]?.total || 0,
      customizationRate: totalTemplates === 0
        ? 0
        : Math.round((customizedTemplates / totalTemplates) * 100),
      averageRating: templateRatings[0]?.averageRating
        ? Math.round(templateRatings[0].averageRating * 10) / 10
        : 0,
      popularTemplates: popularTemplates.map((template: TemplateData) => ({
        name: template.name,
        downloads: template.downloadCount,
      })),
      templateTrends: templateTrends.map((trend: TrendData) => ({
        date: trend._id,
        downloads: trend.downloads,
      })),
    };
  }

  async getSubscriptionMetrics(startDate: Date, endDate: Date) {
    const [
      totalSubscribers,
      newSubscribers,
      cancelledSubscriptions,
      subscriptionTiers,
      revenueMetrics,
    ] = await Promise.all([
      SubscriptionModel.countDocuments({
        status: 'active',
      }),
      SubscriptionModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'active',
      }),
      SubscriptionModel.countDocuments({
        cancelledAt: { $gte: startDate, $lte: endDate },
      }),
      SubscriptionModel.aggregate([
        {
          $match: {
            status: 'active',
          },
        },
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 },
          },
        },
      ]),
      SubscriptionModel.aggregate([
        {
          $match: {
            status: 'active',
          },
        },
        {
          $group: {
            _id: null,
            mrr: { $sum: '$monthlyAmount' },
          },
        },
      ]),
    ]);

    const previousPeriodSubscribers = await SubscriptionModel.countDocuments({
      createdAt: {
        $gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
        $lt: startDate,
      },
      status: 'active',
    });

    const growth = previousPeriodSubscribers === 0
      ? 100
      : ((newSubscribers - previousPeriodSubscribers) / previousPeriodSubscribers) * 100;

    const mrr = revenueMetrics[0]?.mrr || 0;

    return {
      totalSubscribers,
      revenueMetrics: {
        mrr,
        arr: mrr * 12,
        growth: Math.round(growth * 100) / 100,
      },
      subscriptionTiers: subscriptionTiers.map((tier: SubscriptionTier) => ({
        name: tier._id,
        count: tier.count,
      })),
      churnRate: totalSubscribers === 0
        ? 0
        : Math.round((cancelledSubscriptions / totalSubscribers) * 100),
      conversionRate: newSubscribers === 0
        ? 0
        : Math.round((newSubscribers / totalSubscribers) * 100),
    };
  }

  async getFunnelMetrics(startDate: Date, endDate: Date) {
    // This is a placeholder implementation. In a real application,
    // you would need to implement funnel tracking and analytics
    // based on your specific funnel definitions and event tracking.
    return [
      {
        name: 'User Acquisition',
        stages: [
          { name: 'Visit Homepage', count: 1000, conversionRate: 100 },
          { name: 'View Features', count: 800, conversionRate: 80 },
          { name: 'Visit Registration', count: 400, conversionRate: 50 },
          { name: 'Complete Registration', count: 200, conversionRate: 25 },
          { name: 'Complete Onboarding', count: 150, conversionRate: 15 },
        ],
        overallConversion: 15,
      },
      {
        name: 'Assessment Completion',
        stages: [
          { name: 'View Assessments', count: 500, conversionRate: 100 },
          { name: 'View Assessment Detail', count: 400, conversionRate: 80 },
          { name: 'Start Assessment', count: 300, conversionRate: 60 },
          { name: 'Complete 50%', count: 200, conversionRate: 40 },
          { name: 'Complete Assessment', count: 150, conversionRate: 30 },
          { name: 'View Results', count: 120, conversionRate: 24 },
        ],
        overallConversion: 24,
      },
    ];
  }

  // Funnel Analytics Methods
  public async calculateFunnelAnalytics(funnelName: string, timeRange: string) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const events = await this.repository.getEventsByTimeRange(startDate, endDate);

      // Define funnel configurations
      const funnelConfigs = {
        'User Acquisition': [
          { name: 'Visit Homepage', event: 'page_view', page: '/home' },
          { name: 'View Features', event: 'page_view', page: '/features' },
          { name: 'Visit Registration', event: 'page_view', page: '/register' },
          { name: 'Complete Registration', event: 'user_registered' },
          { name: 'Complete Onboarding', event: 'onboarding_completed' }
        ],
        'Assessment Completion': [
          { name: 'View Assessments', event: 'page_view', page: '/assessments' },
          { name: 'View Assessment Detail', event: 'page_view', page: '/assessments/{id}' },
          { name: 'Start Assessment', event: 'assessment_started' },
          { name: 'Complete 50%', event: 'assessment_progress', threshold: 50 },
          { name: 'Complete Assessment', event: 'assessment_completed' },
          { name: 'View Results', event: 'assessment_results_viewed' }
        ],
        'Template Utilization': [
          { name: 'View Templates', event: 'page_view', page: '/templates' },
          { name: 'View Template Detail', event: 'page_view', page: '/templates/{id}' },
          { name: 'Download Template', event: 'template_downloaded' },
          { name: 'Customize Template', event: 'template_customized' },
          { name: 'Complete Template', event: 'template_completed' }
        ],
        'Subscription Conversion': [
          { name: 'View Pricing', event: 'page_view', page: '/pricing' },
          { name: 'Begin Subscription', event: 'subscription_started' },
          { name: 'Enter Payment Info', event: 'payment_info_entered' },
          { name: 'Complete Subscription', event: 'subscription_completed' },
          { name: 'Upgrade Subscription', event: 'subscription_upgraded' }
        ]
      };

      const config = funnelConfigs[funnelName as keyof typeof funnelConfigs];
      if (!config) {
        throw new Error(`Funnel "${funnelName}" not found`);
      }

      // Calculate stage metrics
      const stages = [];
      let previousCount = 0;

      for (let i = 0; i < config.length; i++) {
        const stage = config[i];
        let stageEvents = events.filter(e => e.event === stage.event);

        // Apply additional filters if needed
        if (stage.page) {
          stageEvents = stageEvents.filter(e => 
            e.properties?.page === stage.page || 
            e.properties?.path === stage.page
          );
        }

        if (stage.threshold) {
          stageEvents = stageEvents.filter(e => 
            e.properties?.progress >= stage.threshold
          );
        }

        const count = stageEvents.length;
        const conversionRate = i === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0;

        stages.push({
          name: stage.name,
          count,
          conversionRate: Math.round(conversionRate * 100) / 100
        });

        previousCount = count;
      }

      const overallConversion = stages.length > 0 && stages[0].count > 0 
        ? (stages[stages.length - 1].count / stages[0].count) * 100 
        : 0;

      return {
        name: funnelName,
        stages,
        overallConversion: Math.round(overallConversion * 100) / 100
      };
    } catch (error) {
      logger.error('Error calculating funnel analytics:', error);
      throw new Error('Failed to calculate funnel analytics');
    }
  }

  public async calculateAllFunnelAnalytics(timeRange: string) {
    try {
      const funnelNames = ['User Acquisition', 'Assessment Completion', 'Template Utilization', 'Subscription Conversion'];
      const analytics = await Promise.all(
        funnelNames.map(name => this.calculateFunnelAnalytics(name, timeRange))
      );
      return analytics;
    } catch (error) {
      logger.error('Error calculating all funnel analytics:', error);
      throw new Error('Failed to calculate all funnel analytics');
    }
  }

  public async analyzeFunnelDropoffs(funnelName: string, timeRange: string) {
    try {
      const funnelAnalytics = await this.calculateFunnelAnalytics(funnelName, timeRange);
      const dropoffs = [];

      for (let i = 0; i < funnelAnalytics.stages.length - 1; i++) {
        const currentStage = funnelAnalytics.stages[i];
        const nextStage = funnelAnalytics.stages[i + 1];
        const dropoffCount = currentStage.count - nextStage.count;
        const dropoffRate = currentStage.count > 0 ? (dropoffCount / currentStage.count) * 100 : 0;

        dropoffs.push({
          fromStage: currentStage.name,
          toStage: nextStage.name,
          dropoffCount,
          dropoffRate: Math.round(dropoffRate * 100) / 100,
          conversionRate: nextStage.conversionRate
        });
      }

      return {
        funnelName,
        dropoffs,
        totalDropoff: funnelAnalytics.stages[0].count - funnelAnalytics.stages[funnelAnalytics.stages.length - 1].count
      };
    } catch (error) {
      logger.error('Error analyzing funnel dropoffs:', error);
      throw new Error('Failed to analyze funnel dropoffs');
    }
  }

  public async analyzeFunnelCohorts(funnelName: string, cohortType: string) {
    try {
      const { startDate, endDate } = this.getDateRange('30d'); // Default to 30 days for cohort analysis
      const events = await this.repository.getEventsByTimeRange(startDate, endDate);

      // Group users by cohort (e.g., by signup date, source, etc.)
      const cohorts: Record<string, any[]> = {};

      events.forEach(event => {
        if (event.userId) {
          let cohortKey = '';
          
          switch (cohortType) {
            case 'weekly':
              const weekStart = new Date(event.timestamp);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              cohortKey = weekStart.toISOString().split('T')[0];
              break;
            case 'monthly':
              cohortKey = event.timestamp.toISOString().substring(0, 7); // YYYY-MM
              break;
            case 'source':
              cohortKey = event.properties?.source || 'direct';
              break;
            default:
              cohortKey = event.timestamp.toISOString().split('T')[0]; // Daily
          }

          if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = [];
          }
          cohorts[cohortKey].push(event);
        }
      });

      // Calculate funnel performance for each cohort
      const cohortAnalytics = await Promise.all(
        Object.entries(cohorts).map(async ([cohortKey, cohortEvents]) => {
          // This is a simplified version - in practice, you'd need to calculate
          // the funnel metrics specifically for each cohort's events
          const funnelAnalytics = await this.calculateFunnelAnalytics(funnelName, '30d');
          
          return {
            cohort: cohortKey,
            userCount: [...new Set(cohortEvents.map(e => e.userId))].length,
            eventCount: cohortEvents.length,
            conversionRate: funnelAnalytics.overallConversion,
            stages: funnelAnalytics.stages
          };
        })
      );

      return {
        funnelName,
        cohortType,
        cohorts: cohortAnalytics.sort((a, b) => a.cohort.localeCompare(b.cohort))
      };
    } catch (error) {
      logger.error('Error analyzing funnel cohorts:', error);
      throw new Error('Failed to analyze funnel cohorts');
    }
  }
}

export const analyticsProcessor = new AnalyticsProcessor();
