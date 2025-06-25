import { PrismaClient } from '@prisma/client';
import { ContentMarketingService } from './ContentMarketingService';
import { EmailMarketingService } from './EmailMarketingService';
import { SocialMediaService } from './SocialMediaService';

const prisma = new PrismaClient();

export class CampaignManagementService {
  private contentMarketing: ContentMarketingService;
  private emailMarketing: EmailMarketingService;
  private socialMedia: SocialMediaService;

  constructor() {
    this.contentMarketing = new ContentMarketingService();
    this.emailMarketing = new EmailMarketingService();
    this.socialMedia = new SocialMediaService();
  }

  async createCampaign(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    budget: number;
    channels: string[];
  }) {
    try {
      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          status: 'active',
          metrics: {
            spent: 0,
            reach: 0,
            engagement: 0,
          },
        },
      });

      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async updateCampaignMetrics(campaignId: string, metrics: any) {
    try {
      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          metrics: {
            ...metrics,
          },
        },
      });

      return campaign;
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
      throw error;
    }
  }

  async getCampaignPerformance(campaignId: string) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          posts: true,
          emails: true,
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Calculate overall performance metrics
      const performance = {
        totalSpent: campaign.metrics?.spent || 0,
        totalReach: campaign.metrics?.reach || 0,
        totalEngagement: campaign.metrics?.engagement || 0,
        posts: campaign.posts.length,
        emails: campaign.emails.length,
        roi: this.calculateROI(campaign),
      };

      return performance;
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      throw error;
    }
  }

  private calculateROI(campaign: any): number {
    const spent = campaign.metrics?.spent || 0;
    const revenue = campaign.metrics?.revenue || 0;
    return spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
  }
} 