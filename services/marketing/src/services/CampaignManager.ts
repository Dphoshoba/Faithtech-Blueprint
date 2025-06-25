import { PrismaClient } from '@prisma/client';
import { EmailService } from './EmailService';
import { SocialMediaService } from './SocialMediaService';
import { AnalyticsService } from '../analytics/services/AnalyticsService';
import { OpenAI } from 'openai';

export class CampaignManager {
  private prisma: PrismaClient;
  private emailService: EmailService;
  private socialMediaService: SocialMediaService;
  private analyticsService: AnalyticsService;
  private openai: OpenAI;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.socialMediaService = new SocialMediaService();
    this.analyticsService = new AnalyticsService();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createCampaign(params: {
    name: string;
    type: 'email' | 'social' | 'press' | 'affiliate';
    targetAudience: string[];
    content: {
      subject?: string;
      body: string;
      media?: string[];
    };
    schedule: {
      startDate: Date;
      endDate?: Date;
      frequency?: string;
    };
    metrics: {
      targetLeads?: number;
      targetConversions?: number;
      targetROI?: number;
    };
  }): Promise<{
    campaignId: string;
    status: 'draft' | 'scheduled' | 'active' | 'completed';
  }> {
    const { name, type, targetAudience, content, schedule, metrics } = params;

    const campaign = await this.prisma.campaign.create({
      data: {
        name,
        type,
        targetAudience,
        content: content as any,
        schedule: schedule as any,
        metrics: metrics as any,
        status: 'draft',
      },
    });

    return {
      campaignId: campaign.id,
      status: campaign.status,
    };
  }

  async launchCampaign(params: {
    campaignId: string;
    channels: string[];
  }): Promise<{
    status: 'success' | 'failed';
    message: string;
  }> {
    const { campaignId, channels } = params;

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    try {
      // Launch on selected channels
      for (const channel of channels) {
        switch (channel) {
          case 'email':
            await this.launchEmailCampaign(campaign);
            break;
          case 'social':
            await this.launchSocialCampaign(campaign);
            break;
          case 'press':
            await this.launchPressRelease(campaign);
            break;
          case 'affiliate':
            await this.launchAffiliateProgram(campaign);
            break;
        }
      }

      // Update campaign status
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'active' },
      });

      return {
        status: 'success',
        message: 'Campaign launched successfully',
      };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message,
      };
    }
  }

  async generatePressRelease(params: {
    churchName: string;
    location: string;
    achievements: string[];
    contactInfo: {
      name: string;
      email: string;
      phone: string;
      website: string;
    };
  }): Promise<string> {
    const { churchName, location, achievements, contactInfo } = params;

    const prompt = `Generate a press release for FaithTech Blueprint with the following details:
      Church Name: ${churchName}
      Location: ${location}
      Achievements: ${achievements.join(', ')}
      Contact: ${JSON.stringify(contactInfo)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing press releases for technology companies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  }

  async createAffiliateProgram(params: {
    name: string;
    commission: number;
    requirements: string[];
    benefits: string[];
  }): Promise<{
    programId: string;
    status: 'active' | 'inactive';
  }> {
    const { name, commission, requirements, benefits } = params;

    const program = await this.prisma.affiliateProgram.create({
      data: {
        name,
        commission,
        requirements: requirements as any,
        benefits: benefits as any,
        status: 'active',
      },
    });

    return {
      programId: program.id,
      status: program.status,
    };
  }

  async trackCampaignMetrics(params: {
    campaignId: string;
    metrics: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      revenue?: number;
    };
  }): Promise<void> {
    const { campaignId, metrics } = params;

    await this.prisma.campaignMetrics.create({
      data: {
        campaignId,
        metrics: metrics as any,
        timestamp: new Date(),
      },
    });

    // Update analytics
    await this.analyticsService.trackCampaignPerformance(campaignId, metrics);
  }

  async generateSocialMediaContent(params: {
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
    campaign: string;
    targetAudience: string[];
  }): Promise<{
    posts: Array<{
      content: string;
      media?: string[];
      schedule: Date;
    }>;
  }> {
    const { platform, campaign, targetAudience } = params;

    const prompt = `Generate social media content for ${platform} with the following details:
      Campaign: ${campaign}
      Target Audience: ${targetAudience.join(', ')}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating engaging social media content for technology companies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    const posts = this.parseSocialMediaContent(content);

    return { posts };
  }

  private async launchEmailCampaign(campaign: any): Promise<void> {
    const subscribers = await this.prisma.subscriber.findMany({
      where: {
        tags: {
          hasSome: campaign.targetAudience,
        },
      },
    });

    for (const subscriber of subscribers) {
      await this.emailService.sendEmail({
        to: subscriber.email,
        subject: campaign.content.subject,
        body: this.personalizeContent(campaign.content.body, subscriber),
      });
    }
  }

  private async launchSocialCampaign(campaign: any): Promise<void> {
    const content = await this.generateSocialMediaContent({
      platform: 'facebook',
      campaign: campaign.name,
      targetAudience: campaign.targetAudience,
    });

    for (const post of content.posts) {
      await this.socialMediaService.schedulePost({
        platform: 'facebook',
        content: post.content,
        media: post.media,
        schedule: post.schedule,
      });
    }
  }

  private async launchPressRelease(campaign: any): Promise<void> {
    const pressRelease = await this.generatePressRelease({
      churchName: 'FaithTech Blueprint',
      location: 'Global',
      achievements: [
        '200+ churches served',
        '89% increase in online engagement',
        '12 hours saved per week in administrative tasks',
      ],
      contactInfo: {
        name: 'David George',
        email: 'david@faithtechblueprint.com',
        phone: '555-0123',
        website: 'https://faithtechblueprint.com',
      },
    });

    // Send to press distribution list
    await this.emailService.sendPressRelease(pressRelease);
  }

  private async launchAffiliateProgram(campaign: any): Promise<void> {
    const program = await this.createAffiliateProgram({
      name: 'FaithTech Blueprint Partner Program',
      commission: 25,
      requirements: [
        'Complete certification course',
        'Demonstrated experience with churches',
        'Commitment to quality standards',
      ],
      benefits: [
        '25% recurring commission',
        'White-label assessment reports',
        'Priority support',
        'Monthly training webinars',
      ],
    });

    // Notify potential affiliates
    await this.emailService.sendAffiliateInvitation(program);
  }

  private personalizeContent(content: string, subscriber: any): string {
    return content
      .replace(/\[Name\]/g, subscriber.name)
      .replace(/\[Church Name\]/g, subscriber.churchName || 'your church')
      .replace(/\[Location\]/g, subscriber.location || 'your area');
  }

  private parseSocialMediaContent(content: string): Array<{
    content: string;
    media?: string[];
    schedule: Date;
  }> {
    // Parse the AI-generated content into structured posts
    const posts = content.split('\n\n').map(post => ({
      content: post,
      schedule: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in next 7 days
    }));

    return posts;
  }
} 