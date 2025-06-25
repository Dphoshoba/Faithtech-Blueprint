import { PrismaClient } from '@prisma/client';
import { ChurchMetrics, UserActivity, FeatureUsage } from '../types/Analytics';
import { Matrix } from 'ml-matrix';
import { ZScore } from 'ml-stat';

export class AnomalyDetection {
  private prisma: PrismaClient;
  private readonly Z_SCORE_THRESHOLD = 3; // Standard deviations for anomaly detection
  private readonly MIN_DATA_POINTS = 30; // Minimum data points needed for analysis

  constructor() {
    this.prisma = new PrismaClient();
  }

  async detectAnomalies(params: {
    churchId: string;
    metricType: 'members' | 'activity' | 'resources' | 'contributions';
    timeRange: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    anomalies: Array<{
      timestamp: Date;
      value: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    baseline: {
      mean: number;
      stdDev: number;
    };
  }> {
    const { churchId, metricType, timeRange } = params;

    // Get historical data
    const historicalData = await this.getHistoricalData(churchId, metricType, timeRange);

    if (historicalData.length < this.MIN_DATA_POINTS) {
      throw new Error('Insufficient data points for anomaly detection');
    }

    // Calculate baseline statistics
    const values = historicalData.map(d => d.value);
    const baseline = {
      mean: ZScore.mean(values),
      stdDev: ZScore.standardDeviation(values),
    };

    // Detect anomalies using Z-score
    const anomalies = historicalData
      .map(dataPoint => {
        const zScore = Math.abs((dataPoint.value - baseline.mean) / baseline.stdDev);
        const deviation = (dataPoint.value - baseline.mean) / baseline.mean;

        return {
          timestamp: dataPoint.timestamp,
          value: dataPoint.value,
          expectedValue: baseline.mean,
          deviation,
          severity: this.getSeverity(zScore),
          zScore,
        };
      })
      .filter(a => a.zScore > this.Z_SCORE_THRESHOLD)
      .map(({ zScore, ...anomaly }) => anomaly);

    return {
      anomalies,
      baseline,
    };
  }

  async detectUserActivityAnomalies(params: {
    userId: string;
    timeRange: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    anomalies: Array<{
      timestamp: Date;
      activityType: string;
      value: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    userBaseline: Record<string, {
      mean: number;
      stdDev: number;
    }>;
  }> {
    const { userId, timeRange } = params;

    // Get user activity data
    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Group activities by type
    const activitiesByType = activities.reduce((groups, activity) => {
      if (!groups[activity.type]) {
        groups[activity.type] = [];
      }
      groups[activity.type].push(activity);
      return groups;
    }, {} as Record<string, typeof activities>);

    // Calculate baseline for each activity type
    const userBaseline: Record<string, { mean: number; stdDev: number }> = {};
    const anomalies: Array<{
      timestamp: Date;
      activityType: string;
      value: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const [type, typeActivities] of Object.entries(activitiesByType)) {
      if (typeActivities.length < this.MIN_DATA_POINTS) continue;

      const values = typeActivities.map(a => a.value || 1);
      const mean = ZScore.mean(values);
      const stdDev = ZScore.standardDeviation(values);

      userBaseline[type] = { mean, stdDev };

      // Detect anomalies for this activity type
      typeActivities.forEach(activity => {
        const value = activity.value || 1;
        const zScore = Math.abs((value - mean) / stdDev);
        const deviation = (value - mean) / mean;

        if (zScore > this.Z_SCORE_THRESHOLD) {
          anomalies.push({
            timestamp: activity.timestamp,
            activityType: type,
            value,
            expectedValue: mean,
            deviation,
            severity: this.getSeverity(zScore),
          });
        }
      });
    }

    return {
      anomalies,
      userBaseline,
    };
  }

  async detectResourceUsageAnomalies(params: {
    churchId: string;
    resourceType: 'storage' | 'bandwidth' | 'compute';
    timeRange: {
      start: Date;
      end: Date;
    };
  }): Promise<{
    anomalies: Array<{
      timestamp: Date;
      value: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    baseline: {
      mean: number;
      stdDev: number;
      trend: number;
    };
  }> {
    const { churchId, resourceType, timeRange } = params;

    // Get resource usage data
    const usageData = await this.prisma.churchMetrics.findMany({
      where: {
        churchId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (usageData.length < this.MIN_DATA_POINTS) {
      throw new Error('Insufficient data points for anomaly detection');
    }

    // Extract values for the specified resource type
    const values = usageData.map(d => {
      switch (resourceType) {
        case 'storage':
          return d.storageUsed;
        case 'bandwidth':
          return d.bandwidthUsed;
        case 'compute':
          return d.computeUnits;
        default:
          return 0;
      }
    });

    // Calculate baseline statistics
    const baseline = {
      mean: ZScore.mean(values),
      stdDev: ZScore.standardDeviation(values),
      trend: this.calculateTrend(values),
    };

    // Detect anomalies
    const anomalies = usageData
      .map((dataPoint, index) => {
        const value = values[index];
        const zScore = Math.abs((value - baseline.mean) / baseline.stdDev);
        const deviation = (value - baseline.mean) / baseline.mean;

        return {
          timestamp: dataPoint.timestamp,
          value,
          expectedValue: baseline.mean,
          deviation,
          severity: this.getSeverity(zScore),
          zScore,
        };
      })
      .filter(a => a.zScore > this.Z_SCORE_THRESHOLD)
      .map(({ zScore, ...anomaly }) => anomaly);

    return {
      anomalies,
      baseline,
    };
  }

  private async getHistoricalData(
    churchId: string,
    metricType: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const metrics = await this.prisma.churchMetrics.findMany({
      where: {
        churchId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return metrics.map(metric => ({
      timestamp: metric.timestamp,
      value: this.getMetricValue(metric, metricType),
    }));
  }

  private getMetricValue(metric: ChurchMetrics, type: string): number {
    switch (type) {
      case 'members':
        return metric.totalMembers;
      case 'activity':
        return metric.activeUsers;
      case 'resources':
        return metric.storageUsed;
      case 'contributions':
        return metric.totalContributions;
      default:
        return 0;
    }
  }

  private getSeverity(zScore: number): 'low' | 'medium' | 'high' {
    if (zScore >= 5) return 'high';
    if (zScore >= 4) return 'medium';
    return 'low';
  }

  private calculateTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }

    return numerator / denominator;
  }
} 