import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { MarketingAnalytics } from '../../analytics/src/services/MarketingAnalytics';
import { ContentMarketingService } from './ContentMarketingService';
import { EmailMarketingService } from './EmailMarketingService';
import { SocialMediaService } from './SocialMediaService';

export class CampaignService {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private analytics: MarketingAnalytics;
  private contentMarketing: ContentMarketingService;
  private emailMarketing: EmailMarketingService;
  private socialMedia: SocialMediaService;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.analytics = new MarketingAnalytics();
    this.contentMarketing = new ContentMarketingService();
    this.emailMarketing = new EmailMarketingService();
    this.socialMedia = new SocialMediaService();
  }

  async createCampaign(params: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    targetAudience: string[];
    channels: string[];
    goals: {
      type: string;
      target: number;
    }[];
  }): Promise<{
    campaignId: string;
    status: 'draft' | 'active' | 'completed';
  }> {
    const { name, description, startDate, endDate, budget, targetAudience, channels, goals } = params;

    // Create campaign
    const campaign = await this.prisma.campaign.create({
      data: {
        name,
        description,
        startDate,
        endDate,
        budget,
        targetAudience,
        channels,
        goals: goals as any,
        status: 'draft',
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
        },
      },
    });

    // Generate campaign strategy
    const strategy = await this.generateCampaignStrategy({
      campaignId: campaign.id,
      targetAudience,
      channels,
      goals,
    });

    // Update campaign with strategy
    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        strategy: strategy as any,
      },
    });

    return {
      campaignId: campaign.id,
      status: 'draft',
    };
  }

  async launchCampaign(params: {
    campaignId: string;
  }): Promise<{
    status: 'active' | 'failed';
    message: string;
  }> {
    const { campaignId } = params;

    // Get campaign
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    try {
      // Launch campaign across channels
      await Promise.all(
        campaign.channels.map(async channel => {
          switch (channel) {
            case 'email':
              await this.emailMarketing.launchCampaign(campaign);
              break;
            case 'social':
              await this.socialMedia.launchCampaign(campaign);
              break;
            case 'content':
              await this.contentMarketing.launchCampaign(campaign);
              break;
          }
        })
      );

      // Update campaign status
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'active',
        },
      });

      return {
        status: 'active',
        message: 'Campaign launched successfully',
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Failed to launch campaign: ${error.message}`,
      };
    }
  }

  async pauseCampaign(params: {
    campaignId: string;
  }): Promise<{
    status: 'paused' | 'failed';
    message: string;
  }> {
    const { campaignId } = params;

    // Get campaign
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    try {
      // Pause campaign across channels
      await Promise.all(
        campaign.channels.map(async channel => {
          switch (channel) {
            case 'email':
              await this.emailMarketing.pauseCampaign(campaign);
              break;
            case 'social':
              await this.socialMedia.pauseCampaign(campaign);
              break;
            case 'content':
              await this.contentMarketing.pauseCampaign(campaign);
              break;
          }
        })
      );

      // Update campaign status
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'paused',
        },
      });

      return {
        status: 'paused',
        message: 'Campaign paused successfully',
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `Failed to pause campaign: ${error.message}`,
      };
    }
  }

  async getCampaignPerformance(params: {
    campaignId: string;
  }): Promise<{
    metrics: Record<string, number>;
    trends: Array<{
      date: Date;
      metrics: Record<string, number>;
    }>;
    channelPerformance: Record<string, Record<string, number>>;
  }> {
    const { campaignId } = params;

    // Get campaign metrics
    const report = await this.analytics.generateCampaignReport({
      campaignId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: new Date(),
    });

    // Get channel-specific performance
    const channelPerformance = await this.getChannelPerformance(campaignId);

    return {
      metrics: report.metrics,
      trends: report.trends,
      channelPerformance,
    };
  }

  async optimizeCampaign(params: {
    campaignId: string;
  }): Promise<{
    recommendations: string[];
    budgetAllocation: Record<string, number>;
  }> {
    const { campaignId } = params;

    // Get campaign performance
    const performance = await this.getCampaignPerformance({ campaignId });

    // Generate optimization recommendations
    const recommendations = await this.generateOptimizationRecommendations(performance);

    // Calculate optimal budget allocation
    const budgetAllocation = await this.calculateOptimalBudgetAllocation(performance);

    return {
      recommendations,
      budgetAllocation,
    };
  }

  private async generateCampaignStrategy(params: {
    campaignId: string;
    targetAudience: string[];
    channels: string[];
    goals: Array<{
      type: string;
      target: number;
    }>;
  }): Promise<Record<string, any>> {
    const { campaignId, targetAudience, channels, goals } = params;

    const prompt = `Generate a marketing campaign strategy with the following details:
      Campaign ID: ${campaignId}
      Target Audience: ${targetAudience.join(', ')}
      Channels: ${channels.join(', ')}
      Goals: ${JSON.stringify(goals, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating marketing campaign strategies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  private async getChannelPerformance(campaignId: string): Promise<Record<string, Record<string, number>>> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const channelPerformance: Record<string, Record<string, number>> = {};

    for (const channel of campaign.channels) {
      switch (channel) {
        case 'email':
          channelPerformance.email = await this.emailMarketing.getCampaignPerformance(campaignId);
          break;
        case 'social':
          channelPerformance.social = await this.socialMedia.getCampaignPerformance(campaignId);
          break;
        case 'content':
          channelPerformance.content = await this.contentMarketing.getCampaignPerformance(campaignId);
          break;
      }
    }

    return channelPerformance;
  }

  private async generateOptimizationRecommendations(performance: {
    metrics: Record<string, number>;
    trends: Array<{
      date: Date;
      metrics: Record<string, number>;
    }>;
    channelPerformance: Record<string, Record<string, number>>;
  }): Promise<string[]> {
    const prompt = `Generate optimization recommendations based on this campaign performance:
      ${JSON.stringify(performance, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at optimizing marketing campaigns.',
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

  private async calculateOptimalBudgetAllocation(performance: {
    metrics: Record<string, number>;
    trends: Array<{
      date: Date;
      metrics: Record<string, number>;
    }>;
    channelPerformance: Record<string, Record<string, number>>;
  }): Promise<Record<string, number>> {
    const prompt = `Calculate optimal budget allocation based on this campaign performance:
      ${JSON.stringify(performance, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at optimizing marketing budget allocation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return JSON.parse(completion.choices[0].message.content);
  }
} 