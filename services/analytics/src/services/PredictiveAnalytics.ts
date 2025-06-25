import { PrismaClient } from '@prisma/client';
import { LinearRegression } from 'ml-regression';
import { Matrix } from 'ml-matrix';
import { ChurchMetrics, UserActivity, FeatureUsage } from '../types/Analytics';

export class PredictiveAnalytics {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async predictChurchGrowth(churchId: string, months: number = 6): Promise<number[]> {
    // Get historical member data
    const historicalData = await this.prisma.churchMetrics.findMany({
      where: { churchId },
      orderBy: { date: 'asc' },
      take: 12, // Last 12 months
    });

    if (historicalData.length < 6) {
      throw new Error('Insufficient historical data for prediction');
    }

    // Prepare data for regression
    const X = historicalData.map((_, i) => [i]);
    const y = historicalData.map(d => d.totalMembers);

    // Train linear regression model
    const regression = new LinearRegression(X, y);

    // Generate predictions
    const predictions = [];
    for (let i = 0; i < months; i++) {
      const prediction = regression.predict([historicalData.length + i]);
      predictions.push(Math.round(prediction));
    }

    return predictions;
  }

  async predictFeatureAdoption(featureId: string, churchId: string): Promise<{
    predictedUsers: number;
    confidence: number;
  }> {
    // Get historical feature usage data
    const usageData = await this.prisma.featureUsage.findMany({
      where: { 
        featureId,
        churchId,
      },
      orderBy: { date: 'asc' },
      take: 30, // Last 30 days
    });

    if (usageData.length < 7) {
      throw new Error('Insufficient usage data for prediction');
    }

    // Calculate daily growth rate
    const growthRates = [];
    for (let i = 1; i < usageData.length; i++) {
      const growth = (usageData[i].activeUsers - usageData[i - 1].activeUsers) / 
                    usageData[i - 1].activeUsers;
      growthRates.push(growth);
    }

    // Calculate average growth rate and confidence
    const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const variance = growthRates.reduce((a, b) => a + Math.pow(b - avgGrowthRate, 2), 0) / 
                    growthRates.length;
    const confidence = 1 - Math.min(1, Math.sqrt(variance));

    // Predict next day's users
    const lastUsage = usageData[usageData.length - 1];
    const predictedUsers = Math.round(lastUsage.activeUsers * (1 + avgGrowthRate));

    return {
      predictedUsers,
      confidence,
    };
  }

  async predictResourceNeeds(churchId: string): Promise<{
    storage: number;
    bandwidth: number;
    compute: number;
  }> {
    // Get historical resource usage
    const resourceData = await this.prisma.churchMetrics.findMany({
      where: { churchId },
      orderBy: { date: 'asc' },
      take: 30, // Last 30 days
    });

    if (resourceData.length < 7) {
      throw new Error('Insufficient resource data for prediction');
    }

    // Calculate daily growth rates for each resource
    const storageGrowth = this.calculateGrowthRate(resourceData.map(d => d.storageUsed));
    const bandwidthGrowth = this.calculateGrowthRate(resourceData.map(d => d.bandwidthUsed));
    const computeGrowth = this.calculateGrowthRate(resourceData.map(d => d.computeUnits));

    // Predict next month's needs
    const lastMetrics = resourceData[resourceData.length - 1];
    const daysInMonth = 30;

    return {
      storage: Math.round(lastMetrics.storageUsed * Math.pow(1 + storageGrowth, daysInMonth)),
      bandwidth: Math.round(lastMetrics.bandwidthUsed * Math.pow(1 + bandwidthGrowth, daysInMonth)),
      compute: Math.round(lastMetrics.computeUnits * Math.pow(1 + computeGrowth, daysInMonth)),
    };
  }

  async predictUserEngagement(userId: string): Promise<{
    engagementScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    // Get user activity data
    const activityData = await this.prisma.userActivity.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 30, // Last 30 days
    });

    if (activityData.length < 7) {
      throw new Error('Insufficient activity data for prediction');
    }

    // Calculate engagement metrics
    const loginFrequency = this.calculateFrequency(activityData, 'login');
    const featureUsage = this.calculateFeatureUsage(activityData);
    const interactionDepth = this.calculateInteractionDepth(activityData);

    // Calculate engagement score (0-100)
    const engagementScore = Math.round(
      (loginFrequency * 0.4 + featureUsage * 0.3 + interactionDepth * 0.3) * 100
    );

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (engagementScore >= 70) {
      riskLevel = 'low';
    } else if (engagementScore >= 40) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      engagementScore,
      loginFrequency,
      featureUsage,
      interactionDepth
    );

    return {
      engagementScore,
      riskLevel,
      recommendations,
    };
  }

  private calculateGrowthRate(values: number[]): number {
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      const growth = (values[i] - values[i - 1]) / values[i - 1];
      growthRates.push(growth);
    }
    return growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  }

  private calculateFrequency(activities: UserActivity[], type: string): number {
    const relevantActivities = activities.filter(a => a.type === type);
    return relevantActivities.length / activities.length;
  }

  private calculateFeatureUsage(activities: UserActivity[]): number {
    const uniqueFeatures = new Set(activities.map(a => a.featureId)).size;
    return uniqueFeatures / 10; // Assuming 10 is the maximum number of features
  }

  private calculateInteractionDepth(activities: UserActivity[]): number {
    const interactionTypes = new Set(activities.map(a => a.interactionType)).size;
    return interactionTypes / 5; // Assuming 5 is the maximum number of interaction types
  }

  private generateRecommendations(
    engagementScore: number,
    loginFrequency: number,
    featureUsage: number,
    interactionDepth: number
  ): string[] {
    const recommendations: string[] = [];

    if (loginFrequency < 0.3) {
      recommendations.push('Consider setting up automated reminders for regular platform access');
    }

    if (featureUsage < 0.4) {
      recommendations.push('Explore additional platform features through our tutorial videos');
    }

    if (interactionDepth < 0.3) {
      recommendations.push('Engage with more community features to increase interaction depth');
    }

    if (engagementScore < 40) {
      recommendations.push('Schedule a platform orientation session with our support team');
    }

    return recommendations;
  }
} 