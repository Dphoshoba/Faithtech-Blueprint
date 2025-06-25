import { PrismaClient } from '@prisma/client';
import { ChurchMetrics, UserActivity, FeatureUsage } from '../types/Analytics';
import { Matrix } from 'ml-matrix';
import { RandomForestRegression } from 'ml-random-forest';
import { KMeans } from 'ml-kmeans';
import { PCA } from 'ml-pca';

export class MachineLearning {
  private prisma: PrismaClient;
  private readonly MIN_TRAINING_SAMPLES = 100;
  private readonly PREDICTION_HORIZON = 30; // days

  constructor() {
    this.prisma = new PrismaClient();
  }

  async trainGrowthModel(churchId: string): Promise<{
    model: RandomForestRegression;
    metrics: {
      r2: number;
      mse: number;
    };
  }> {
    // Get historical growth data
    const historicalData = await this.prisma.churchMetrics.findMany({
      where: { churchId },
      orderBy: { date: 'asc' },
    });

    if (historicalData.length < this.MIN_TRAINING_SAMPLES) {
      throw new Error('Insufficient training data');
    }

    // Prepare features
    const features = this.extractGrowthFeatures(historicalData);
    const labels = historicalData.map(d => d.totalMembers);

    // Train random forest model
    const model = new RandomForestRegression({
      nEstimators: 100,
      maxDepth: 10,
      seed: 42,
    });

    model.train(features, labels);

    // Calculate model metrics
    const predictions = model.predict(features);
    const metrics = this.calculateModelMetrics(labels, predictions);

    return { model, metrics };
  }

  async predictGrowth(params: {
    churchId: string;
    days: number;
  }): Promise<Array<{
    date: Date;
    predictedMembers: number;
    confidence: number;
  }>> {
    const { churchId, days } = params;

    // Train model
    const { model } = await this.trainGrowthModel(churchId);

    // Get recent data for prediction
    const recentData = await this.prisma.churchMetrics.findMany({
      where: { churchId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // Prepare features for prediction
    const features = this.extractGrowthFeatures(recentData);

    // Generate predictions
    const predictions = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const predictionDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedMembers = model.predict(features);
      const confidence = this.calculatePredictionConfidence(model, features);

      predictions.push({
        date: predictionDate,
        predictedMembers: Math.round(predictedMembers),
        confidence,
      });
    }

    return predictions;
  }

  async clusterUsers(params: {
    churchId: string;
    features: string[];
  }): Promise<Array<{
    clusterId: number;
    users: Array<{
      id: string;
      features: Record<string, number>;
    }>;
    centroid: Record<string, number>;
  }>> {
    const { churchId, features } = params;

    // Get user activity data
    const userData = await this.prisma.userActivity.findMany({
      where: { churchId },
      include: {
        user: true,
      },
    });

    // Prepare feature matrix
    const featureMatrix = userData.map(user => {
      const userFeatures = features.map(feature => {
        switch (feature) {
          case 'login_frequency':
            return this.calculateLoginFrequency(user);
          case 'feature_usage':
            return this.calculateFeatureUsage(user);
          case 'engagement_score':
            return this.calculateEngagementScore(user);
          default:
            return 0;
        }
      });
      return userFeatures;
    });

    // Perform PCA for dimensionality reduction
    const pca = new PCA(featureMatrix);
    const reducedFeatures = pca.predict(featureMatrix);

    // Perform clustering
    const kmeans = new KMeans(reducedFeatures, {
      k: 5,
      seed: 42,
    });

    // Format results
    return kmeans.clusters.map((cluster, index) => ({
      clusterId: index,
      users: cluster.map(userIndex => ({
        id: userData[userIndex].userId,
        features: features.reduce((acc, feature, i) => {
          acc[feature] = featureMatrix[userIndex][i];
          return acc;
        }, {} as Record<string, number>),
      })),
      centroid: features.reduce((acc, feature, i) => {
        acc[feature] = kmeans.centroids[index][i];
        return acc;
      }, {} as Record<string, number>),
    }));
  }

  async predictUserChurn(params: {
    churchId: string;
    userId: string;
  }): Promise<{
    churnProbability: number;
    riskFactors: string[];
    recommendations: string[];
  }> {
    const { churchId, userId } = params;

    // Get user activity data
    const userData = await this.prisma.userActivity.findMany({
      where: {
        churchId,
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 90, // Last 90 days
    });

    // Calculate churn risk factors
    const riskFactors = this.calculateChurnRiskFactors(userData);

    // Calculate churn probability
    const churnProbability = this.calculateChurnProbability(riskFactors);

    // Generate recommendations
    const recommendations = this.generateChurnPreventionRecommendations(
      riskFactors,
      churnProbability
    );

    return {
      churnProbability,
      riskFactors,
      recommendations,
    };
  }

  private extractGrowthFeatures(data: ChurchMetrics[]): number[][] {
    return data.map(metric => [
      metric.activeUsers,
      metric.totalContributions,
      metric.storageUsed,
      metric.bandwidthUsed,
      this.calculateGrowthRate(metric),
      this.calculateEngagementRate(metric),
    ]);
  }

  private calculateGrowthRate(metric: ChurchMetrics): number {
    return (
      (metric.totalMembers - metric.previousMembers) / metric.previousMembers
    );
  }

  private calculateEngagementRate(metric: ChurchMetrics): number {
    return metric.activeUsers / metric.totalMembers;
  }

  private calculateModelMetrics(
    actual: number[],
    predicted: number[]
  ): { r2: number; mse: number } {
    const n = actual.length;
    const mean = actual.reduce((a, b) => a + b, 0) / n;

    const ssTotal = actual.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const ssResidual = actual.reduce(
      (a, b, i) => a + Math.pow(b - predicted[i], 2),
      0
    );

    const r2 = 1 - ssResidual / ssTotal;
    const mse = ssResidual / n;

    return { r2, mse };
  }

  private calculatePredictionConfidence(
    model: RandomForestRegression,
    features: number[][]
  ): number {
    // Calculate confidence based on tree variance
    const predictions = model.predict(features);
    const variance = this.calculateVariance(predictions);
    const maxVariance = Math.max(...predictions) - Math.min(...predictions);

    return 1 - variance / maxVariance;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return (
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );
  }

  private calculateLoginFrequency(user: UserActivity): number {
    const logins = user.activities.filter(a => a.type === 'login');
    return logins.length / 30; // Average logins per day
  }

  private calculateFeatureUsage(user: UserActivity): number {
    const uniqueFeatures = new Set(
      user.activities.map(a => a.featureId)
    ).size;
    return uniqueFeatures / 10; // Normalized by max features
  }

  private calculateEngagementScore(user: UserActivity): number {
    const activities = user.activities;
    const totalActivities = activities.length;
    const uniqueFeatures = new Set(activities.map(a => a.featureId)).size;
    const interactionTypes = new Set(
      activities.map(a => a.interactionType)
    ).size;

    return (
      (totalActivities * 0.4 + uniqueFeatures * 0.3 + interactionTypes * 0.3) /
      10
    );
  }

  private calculateChurnRiskFactors(userData: UserActivity[]): string[] {
    const riskFactors: string[] = [];

    // Check login frequency
    const loginFrequency = this.calculateLoginFrequency(userData[0]);
    if (loginFrequency < 0.1) {
      riskFactors.push('low_login_frequency');
    }

    // Check feature usage
    const featureUsage = this.calculateFeatureUsage(userData[0]);
    if (featureUsage < 0.2) {
      riskFactors.push('low_feature_usage');
    }

    // Check engagement
    const engagementScore = this.calculateEngagementScore(userData[0]);
    if (engagementScore < 0.3) {
      riskFactors.push('low_engagement');
    }

    // Check activity recency
    const lastActivity = userData[0].activities[0]?.timestamp;
    if (lastActivity) {
      const daysSinceLastActivity =
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 14) {
        riskFactors.push('inactive_14_days');
      }
    }

    return riskFactors;
  }

  private calculateChurnProbability(riskFactors: string[]): number {
    const weights: Record<string, number> = {
      low_login_frequency: 0.3,
      low_feature_usage: 0.25,
      low_engagement: 0.25,
      inactive_14_days: 0.2,
    };

    return riskFactors.reduce(
      (probability, factor) => probability + (weights[factor] || 0),
      0
    );
  }

  private generateChurnPreventionRecommendations(
    riskFactors: string[],
    churnProbability: number
  ): string[] {
    const recommendations: string[] = [];

    if (riskFactors.includes('low_login_frequency')) {
      recommendations.push(
        'Send personalized email reminders about platform features'
      );
    }

    if (riskFactors.includes('low_feature_usage')) {
      recommendations.push(
        'Schedule a platform orientation session with support team'
      );
    }

    if (riskFactors.includes('low_engagement')) {
      recommendations.push(
        'Invite to participate in community events and discussions'
      );
    }

    if (riskFactors.includes('inactive_14_days')) {
      recommendations.push(
        'Send re-engagement email with personalized content'
      );
    }

    if (churnProbability > 0.7) {
      recommendations.push(
        'Schedule a one-on-one call to understand user needs'
      );
    }

    return recommendations;
  }
} 