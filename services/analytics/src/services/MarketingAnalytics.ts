import { PrismaClient } from '@prisma/client';
import { Matrix } from 'ml-matrix';
import { RandomForestRegression } from 'ml-random-forest';
import { KMeans } from 'ml-kmeans';
import { PCA } from 'ml-pca';
import { OpenAI } from 'openai';

export class MarketingAnalytics {
  private prisma: PrismaClient;
  private openai: OpenAI;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async trackCampaignPerformance(params: {
    campaignId: string;
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
      cost: number;
    };
  }): Promise<void> {
    const { campaignId, metrics } = params;

    // Store metrics
    await this.prisma.campaignMetrics.create({
      data: {
        campaignId,
        metrics: metrics as any,
        timestamp: new Date(),
      },
    });

    // Update campaign performance
    await this.updateCampaignPerformance(campaignId, metrics);
  }

  async generateCampaignReport(params: {
    campaignId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<{
    summary: string;
    metrics: {
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
      totalRevenue: number;
      totalCost: number;
      roi: number;
      ctr: number;
      conversionRate: number;
      cpa: number;
    };
    trends: Array<{
      date: Date;
      metrics: Record<string, number>;
    }>;
    recommendations: string[];
  }> {
    const { campaignId, startDate, endDate } = params;

    // Get campaign metrics
    const metrics = await this.prisma.campaignMetrics.findMany({
      where: {
        campaignId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate aggregate metrics
    const aggregateMetrics = this.calculateAggregateMetrics(metrics);

    // Generate trends
    const trends = this.calculateTrends(metrics);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(metrics);

    // Generate summary
    const summary = await this.generateSummary(aggregateMetrics, trends, recommendations);

    return {
      summary,
      metrics: aggregateMetrics,
      trends,
      recommendations,
    };
  }

  async predictCampaignPerformance(params: {
    campaignId: string;
    days: number;
  }): Promise<{
    predictions: Array<{
      date: Date;
      metrics: Record<string, number>;
      confidence: number;
    }>;
  }> {
    const { campaignId, days } = params;

    // Get historical metrics
    const metrics = await this.prisma.campaignMetrics.findMany({
      where: { campaignId },
      orderBy: { timestamp: 'asc' },
    });

    // Prepare features
    const features = this.extractFeatures(metrics);

    // Train prediction model
    const model = new RandomForestRegression({
      nEstimators: 100,
      maxDepth: 10,
      seed: 42,
    });

    const labels = metrics.map(m => m.metrics.conversions);
    model.train(features, labels);

    // Generate predictions
    const predictions = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const predictionDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const predictedConversions = model.predict(features);
      const confidence = this.calculatePredictionConfidence(model, features);

      predictions.push({
        date: predictionDate,
        metrics: {
          conversions: Math.round(predictedConversions),
          revenue: this.estimateRevenue(predictedConversions),
        },
        confidence,
      });
    }

    return { predictions };
  }

  async analyzeAudienceSegmentation(params: {
    campaignId: string;
  }): Promise<{
    segments: Array<{
      name: string;
      size: number;
      characteristics: Record<string, any>;
      performance: Record<string, number>;
    }>;
  }> {
    const { campaignId } = params;

    // Get audience data
    const audience = await this.prisma.campaignAudience.findMany({
      where: { campaignId },
      include: {
        interactions: true,
      },
    });

    // Prepare features for clustering
    const features = this.extractAudienceFeatures(audience);

    // Perform PCA for dimensionality reduction
    const pca = new PCA(features);
    const reducedFeatures = pca.predict(features);

    // Perform clustering
    const kmeans = new KMeans(reducedFeatures, {
      k: 5,
      seed: 42,
    });

    // Analyze segments
    const segments = kmeans.clusters.map((cluster, index) => {
      const segmentAudience = cluster.map(i => audience[i]);
      return {
        name: `Segment ${index + 1}`,
        size: cluster.length,
        characteristics: this.analyzeSegmentCharacteristics(segmentAudience),
        performance: this.analyzeSegmentPerformance(segmentAudience),
      };
    });

    return { segments };
  }

  async generateMarketingInsights(params: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    insights: string[];
    trends: Array<{
      metric: string;
      change: number;
      significance: number;
    }>;
    recommendations: string[];
  }> {
    const { startDate, endDate } = params;

    // Get all campaign metrics
    const metrics = await this.prisma.campaignMetrics.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Analyze trends
    const trends = this.analyzeTrends(metrics);

    // Generate insights
    const insights = await this.generateInsights(metrics, trends);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(metrics);

    return {
      insights,
      trends,
      recommendations,
    };
  }

  async getMetricValue(metric: string): Promise<number> {
    // Get latest metric value
    const latestMetric = await this.prisma.campaignMetrics.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latestMetric) {
      return 0;
    }

    return latestMetric.metrics[metric] || 0;
  }

  private async updateCampaignPerformance(
    campaignId: string,
    metrics: Record<string, number>
  ): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Update campaign metrics
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        metrics: {
          ...campaign.metrics,
          ...metrics,
        },
      },
    });
  }

  private calculateAggregateMetrics(metrics: any[]): {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalCost: number;
    roi: number;
    ctr: number;
    conversionRate: number;
    cpa: number;
  } {
    const totals = metrics.reduce(
      (acc, m) => {
        acc.impressions += m.metrics.impressions;
        acc.clicks += m.metrics.clicks;
        acc.conversions += m.metrics.conversions;
        acc.revenue += m.metrics.revenue;
        acc.cost += m.metrics.cost;
        return acc;
      },
      {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cost: 0,
      }
    );

    return {
      ...totals,
      roi: (totals.revenue - totals.cost) / totals.cost,
      ctr: totals.clicks / totals.impressions,
      conversionRate: totals.conversions / totals.clicks,
      cpa: totals.cost / totals.conversions,
    };
  }

  private calculateTrends(metrics: any[]): Array<{
    date: Date;
    metrics: Record<string, number>;
  }> {
    const dailyMetrics = metrics.reduce((acc, m) => {
      const date = m.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
        };
      }
      Object.keys(m.metrics).forEach(key => {
        acc[date][key] += m.metrics[key];
      });
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(dailyMetrics).map(([date, metrics]) => ({
      date: new Date(date),
      metrics,
    }));
  }

  private async generateRecommendations(metrics: any[]): Promise<string[]> {
    const prompt = `Analyze these campaign metrics and provide recommendations:
      ${JSON.stringify(metrics, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing marketing campaign performance and providing actionable recommendations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content.split('\n').filter(Boolean);
  }

  private async generateSummary(
    metrics: Record<string, number>,
    trends: any[],
    recommendations: string[]
  ): Promise<string> {
    const prompt = `Generate a summary of this marketing campaign performance:
      Metrics: ${JSON.stringify(metrics, null, 2)}
      Trends: ${JSON.stringify(trends, null, 2)}
      Recommendations: ${recommendations.join('\n')}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at summarizing marketing campaign performance.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  }

  private extractFeatures(metrics: any[]): number[][] {
    return metrics.map(m => [
      m.metrics.impressions,
      m.metrics.clicks,
      m.metrics.conversions,
      m.metrics.revenue,
      m.metrics.cost,
    ]);
  }

  private calculatePredictionConfidence(
    model: RandomForestRegression,
    features: number[][]
  ): number {
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

  private estimateRevenue(conversions: number): number {
    // Simple revenue estimation based on average conversion value
    const averageConversionValue = 100; // This should be calculated from historical data
    return conversions * averageConversionValue;
  }

  private extractAudienceFeatures(audience: any[]): number[][] {
    return audience.map(a => [
      a.interactions.length,
      a.interactions.filter((i: any) => i.type === 'click').length,
      a.interactions.filter((i: any) => i.type === 'conversion').length,
      a.interactions.reduce((sum: number, i: any) => sum + i.value, 0),
    ]);
  }

  private analyzeSegmentCharacteristics(segment: any[]): Record<string, any> {
    return {
      averageInteractions: segment.reduce((sum, a) => sum + a.interactions.length, 0) / segment.length,
      clickRate: segment.filter(a => a.interactions.some((i: any) => i.type === 'click')).length / segment.length,
      conversionRate: segment.filter(a => a.interactions.some((i: any) => i.type === 'conversion')).length / segment.length,
      averageValue: segment.reduce((sum, a) => sum + a.interactions.reduce((s: number, i: any) => s + i.value, 0), 0) / segment.length,
    };
  }

  private analyzeSegmentPerformance(segment: any[]): Record<string, number> {
    return {
      totalConversions: segment.reduce((sum, a) => sum + a.interactions.filter((i: any) => i.type === 'conversion').length, 0),
      totalRevenue: segment.reduce((sum, a) => sum + a.interactions.reduce((s: number, i: any) => s + i.value, 0), 0),
      averageOrderValue: segment.reduce((sum, a) => sum + a.interactions.reduce((s: number, i: any) => s + i.value, 0), 0) / segment.length,
    };
  }

  private analyzeTrends(metrics: any[]): Array<{
    metric: string;
    change: number;
    significance: number;
  }> {
    const trends = [];
    const metricNames = Object.keys(metrics[0].metrics);

    for (const metric of metricNames) {
      const values = metrics.map(m => m.metrics[metric]);
      const change = (values[values.length - 1] - values[0]) / values[0];
      const significance = this.calculateSignificance(values);

      trends.push({
        metric,
        change,
        significance,
      });
    }

    return trends;
  }

  private calculateSignificance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return 1 / (1 + Math.sqrt(variance));
  }

  private async generateInsights(
    metrics: any[],
    trends: any[]
  ): Promise<string[]> {
    const prompt = `Generate insights from these marketing metrics and trends:
      Metrics: ${JSON.stringify(metrics, null, 2)}
      Trends: ${JSON.stringify(trends, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing marketing data and generating insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content.split('\n').filter(Boolean);
  }
} 