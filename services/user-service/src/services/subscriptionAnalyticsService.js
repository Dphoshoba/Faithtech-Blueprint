const SubscriptionAnalytics = require('../models/SubscriptionAnalytics');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

class SubscriptionAnalyticsService {
  /**
   * Track usage for analytics
   */
  static async trackUsage(organizationId, type, value, metadata = {}) {
    try {
      let currentPeriod = await SubscriptionAnalytics.getCurrentPeriod(organizationId);
      
      if (!currentPeriod) {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        currentPeriod = await SubscriptionAnalytics.createPeriod(
          organizationId,
          now,
          endOfMonth
        );
      }

      await currentPeriod.addUsageDataPoint(type, value, metadata);
      return currentPeriod;
    } catch (error) {
      logger.error('Error tracking usage:', error);
      throw error;
    }
  }

  /**
   * Get subscription metrics for an organization
   */
  static async getMetrics(organizationId, startDate, endDate) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const periods = await SubscriptionAnalytics.find({
        organization: organizationId,
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }).sort({ startDate: 1 });

      return {
        overview: await this.calculateOverviewMetrics(subscription, periods),
        usage: await this.calculateUsageMetrics(periods),
        revenue: await this.calculateRevenueMetrics(subscription, periods),
        retention: await this.calculateRetentionMetrics(subscription, periods)
      };
    } catch (error) {
      logger.error('Error getting subscription metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate overview metrics
   * @private
   */
  static async calculateOverviewMetrics(subscription, periods) {
    const currentPeriod = periods[periods.length - 1];
    const previousPeriod = periods[periods.length - 2];

    return {
      activeUsers: subscription.usage.activeUsers,
      activeTemplates: subscription.usage.activeTemplates,
      storageUsed: subscription.usage.storageUsed,
      apiCalls: subscription.usage.apiCalls,
      growth: {
        users: this.calculateGrowthRate(
          previousPeriod?.metrics?.activeUsers || 0,
          currentPeriod?.metrics?.activeUsers || 0
        ),
        templates: this.calculateGrowthRate(
          previousPeriod?.metrics?.activeTemplates || 0,
          currentPeriod?.metrics?.activeTemplates || 0
        )
      }
    };
  }

  /**
   * Calculate usage metrics
   * @private
   */
  static async calculateUsageMetrics(periods) {
    const usageByType = new Map();
    
    for (const period of periods) {
      for (const [type, data] of period.usage) {
        if (!usageByType.has(type)) {
          usageByType.set(type, []);
        }
        usageByType.get(type).push({
          date: period.startDate,
          value: data.value,
          metadata: data.metadata
        });
      }
    }

    return {
      byType: Object.fromEntries(usageByType),
      trends: this.calculateUsageTrends(usageByType)
    };
  }

  /**
   * Calculate revenue metrics
   * @private
   */
  static async calculateRevenueMetrics(subscription, periods) {
    const revenue = {
      current: 0,
      recurring: 0,
      lifetime: 0,
      byPeriod: []
    };

    for (const period of periods) {
      const periodRevenue = period.metrics?.revenue || 0;
      revenue.lifetime += periodRevenue;
      revenue.byPeriod.push({
        date: period.startDate,
        amount: periodRevenue
      });
    }

    revenue.current = revenue.byPeriod[revenue.byPeriod.length - 1]?.amount || 0;
    revenue.recurring = this.calculateRecurringRevenue(subscription);

    return revenue;
  }

  /**
   * Calculate retention metrics
   * @private
   */
  static async calculateRetentionMetrics(subscription, periods) {
    const retention = {
      userRetention: [],
      featureUsage: new Map(),
      churnRisk: await this.assessChurnRisk(subscription)
    };

    // Calculate user retention over time
    for (let i = 1; i < periods.length; i++) {
      const previousUsers = new Set(periods[i-1].metrics?.activeUserIds || []);
      const currentUsers = new Set(periods[i].metrics?.activeUserIds || []);
      const retainedUsers = new Set(
        [...currentUsers].filter(id => previousUsers.has(id))
      );

      retention.userRetention.push({
        period: periods[i].startDate,
        rate: previousUsers.size ? retainedUsers.size / previousUsers.size : 0
      });
    }

    // Calculate feature usage retention
    for (const period of periods) {
      for (const [feature, usage] of period.usage) {
        if (!retention.featureUsage.has(feature)) {
          retention.featureUsage.set(feature, []);
        }
        retention.featureUsage.get(feature).push({
          date: period.startDate,
          activeUsers: usage.activeUsers,
          totalUsers: period.metrics?.activeUsers || 0
        });
      }
    }

    return retention;
  }

  /**
   * Calculate growth rate between two values
   * @private
   */
  static calculateGrowthRate(previous, current) {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate usage trends
   * @private
   */
  static calculateUsageTrends(usageByType) {
    const trends = {};

    for (const [type, data] of usageByType) {
      if (data.length < 2) continue;

      const values = data.map(d => d.value);
      trends[type] = {
        trend: this.calculateTrendLine(values),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values)
      };
    }

    return trends;
  }

  /**
   * Calculate recurring revenue
   * @private
   */
  static calculateRecurringRevenue(subscription) {
    let mrr = 0;

    // Base subscription
    if (subscription.billing?.amount) {
      mrr += subscription.billing.interval === 'yearly'
        ? subscription.billing.amount / 12
        : subscription.billing.amount;
    }

    // Metered usage
    for (const [, usage] of subscription.usage.meteredUsage) {
      if (usage.billingMode === 'metered') {
        mrr += (usage.current * (usage.tiers[0]?.unitPrice || 0));
      }
    }

    return mrr;
  }

  /**
   * Assess churn risk
   * @private
   */
  static async assessChurnRisk(subscription) {
    const riskFactors = {
      usage: 0,
      engagement: 0,
      support: 0,
      payment: 0
    };

    // Usage patterns
    const usageThreshold = subscription.plan === 'free' ? 0.1 : 0.3;
    const usageRatio = subscription.usage.activeUsers / subscription.features.maxUsers;
    riskFactors.usage = usageRatio < usageThreshold ? 0.8 : 0.2;

    // Engagement (feature usage)
    const activeFeatures = Object.values(subscription.features).filter(Boolean).length;
    const totalFeatures = Object.keys(subscription.features).length;
    riskFactors.engagement = activeFeatures / totalFeatures < 0.5 ? 0.6 : 0.3;

    // Support history (if available)
    if (subscription.metadata?.supportTickets) {
      riskFactors.support = subscription.metadata.supportTickets.unresolved > 2 ? 0.7 : 0.2;
    }

    // Payment history
    if (subscription.status === 'past_due') {
      riskFactors.payment = 0.9;
    } else if (subscription.billing?.lastPayment) {
      riskFactors.payment = 0.1;
    }

    // Calculate overall risk score (0-1)
    const weights = { usage: 0.4, engagement: 0.3, support: 0.2, payment: 0.1 };
    const riskScore = Object.entries(riskFactors).reduce(
      (score, [factor, value]) => score + (value * weights[factor]),
      0
    );

    return {
      score: riskScore,
      factors: riskFactors,
      level: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low'
    };
  }

  /**
   * Calculate trend line using simple linear regression
   * @private
   */
  static calculateTrendLine(values) {
    const n = values.length;
    if (n < 2) return null;

    const xs = Array.from({length: n}, (_, i) => i);
    const sum_x = xs.reduce((a, b) => a + b, 0);
    const sum_y = values.reduce((a, b) => a + b, 0);
    const sum_xy = xs.reduce((acc, x, i) => acc + x * values[i], 0);
    const sum_xx = xs.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;

    return {
      slope,
      intercept,
      direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
      strength: Math.abs(slope)
    };
  }

  static async getUsageMetrics(organizationId, period = 'current') {
    try {
      let analytics;
      
      if (period === 'current') {
        analytics = await SubscriptionAnalytics.getCurrentPeriod(organizationId);
      } else {
        const [startDate, endDate] = this.getPeriodDates(period);
        analytics = await SubscriptionAnalytics.findOne({
          organization: organizationId,
          'period.start': { $gte: startDate },
          'period.end': { $lte: endDate }
        });
      }

      if (!analytics) {
        throw new Error('No analytics found for the specified period');
      }

      return this.calculateMetrics(analytics);
    } catch (error) {
      logger.error('Error getting usage metrics:', error);
      throw error;
    }
  }

  static async getEngagementTrends(organizationId, timeframe = 'monthly') {
    try {
      const analytics = await SubscriptionAnalytics.getCurrentPeriod(organizationId);
      if (!analytics) {
        throw new Error('No analytics found');
      }

      const trends = {
        activeUsers: this.calculateActiveUserTrends(analytics, timeframe),
        templateUsage: this.calculateTemplateUsageTrends(analytics),
        featureEngagement: this.calculateFeatureEngagement(analytics)
      };

      return trends;
    } catch (error) {
      logger.error('Error getting engagement trends:', error);
      throw error;
    }
  }

  static async getCostAnalysis(organizationId, months = 3) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const analytics = await SubscriptionAnalytics.find({
        organization: organizationId,
        'period.start': { $gte: startDate },
        'period.end': { $lte: endDate }
      }).sort({ 'period.start': 1 });

      return this.calculateCostTrends(analytics);
    } catch (error) {
      logger.error('Error getting cost analysis:', error);
      throw error;
    }
  }

  static async getFeatureUsageReport(organizationId) {
    try {
      const analytics = await SubscriptionAnalytics.getCurrentPeriod(organizationId);
      if (!analytics) {
        throw new Error('No analytics found');
      }

      return analytics.features.accessed.map(feature => ({
        name: feature.name,
        usageCount: feature.count,
        lastAccessed: feature.lastAccessed,
        trend: this.calculateFeatureUsageTrend(feature)
      }));
    } catch (error) {
      logger.error('Error getting feature usage report:', error);
      throw error;
    }
  }

  // Helper methods
  static getPeriodDates(period) {
    const now = new Date();
    const startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'last_month':
        startDate.setMonth(now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_3_months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'last_6_months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'last_year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        throw new Error('Invalid period specified');
    }

    return [startDate, endDate];
  }

  static calculateMetrics(analytics) {
    const metrics = {
      users: {
        current: this.getLatestValue(analytics.usage.users),
        trend: this.calculateTrend(analytics.usage.users)
      },
      templates: {
        current: this.getLatestValue(analytics.usage.templates),
        trend: this.calculateTrend(analytics.usage.templates)
      },
      storage: {
        current: this.getLatestValue(analytics.usage.storage, 'bytes'),
        trend: this.calculateTrend(analytics.usage.storage, 'bytes')
      },
      apiCalls: {
        total: this.sumValues(analytics.usage.apiCalls),
        byEndpoint: this.groupByEndpoint(analytics.usage.apiCalls)
      }
    };

    return metrics;
  }

  static calculateActiveUserTrends(analytics, timeframe) {
    const activeUsers = analytics.engagement.activeUsers[timeframe];
    return {
      data: activeUsers,
      trend: this.calculateTrend(activeUsers.map(u => ({ count: u.count })))
    };
  }

  static calculateTemplateUsageTrends(analytics) {
    return analytics.engagement.templateUsage
      .sort((a, b) => b.uses - a.uses)
      .map(template => ({
        templateId: template.templateId,
        uses: template.uses,
        lastUsed: template.lastUsed
      }));
  }

  static calculateFeatureEngagement(analytics) {
    return analytics.features.accessed
      .sort((a, b) => b.count - a.count)
      .map(feature => ({
        name: feature.name,
        count: feature.count,
        lastAccessed: feature.lastAccessed
      }));
  }

  static calculateCostTrends(analyticsArray) {
    return analyticsArray.map(analytics => ({
      period: {
        start: analytics.period.start,
        end: analytics.period.end
      },
      costs: {
        base: analytics.costs.base,
        overages: analytics.costs.overages,
        total: analytics.costs.total
      }
    }));
  }

  static getLatestValue(dataPoints, field = 'count') {
    if (!dataPoints || dataPoints.length === 0) return 0;
    return dataPoints[dataPoints.length - 1][field];
  }

  static calculateTrend(dataPoints, field = 'count') {
    if (!dataPoints || dataPoints.length < 2) return 0;
    
    const current = dataPoints[dataPoints.length - 1][field];
    const previous = dataPoints[dataPoints.length - 2][field];
    
    return ((current - previous) / previous) * 100;
  }

  static sumValues(dataPoints) {
    return dataPoints.reduce((sum, point) => sum + point.count, 0);
  }

  static groupByEndpoint(apiCalls) {
    return apiCalls.reduce((grouped, call) => {
      const endpoint = call.endpoint || 'unknown';
      grouped[endpoint] = (grouped[endpoint] || 0) + call.count;
      return grouped;
    }, {});
  }

  static calculateFeatureUsageTrend(feature) {
    // Implement your feature usage trend calculation logic here
    // This could involve comparing current usage with historical data
    return 0; // Placeholder
  }
}

module.exports = SubscriptionAnalyticsService; 