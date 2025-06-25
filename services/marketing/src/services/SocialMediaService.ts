import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { TwitterApi } from 'twitter-api-v2';
import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { LinkedInApi } from 'linkedin-api-v2';
import { AnalyticsService } from '../analytics/services/AnalyticsService';
import axios from 'axios';

const prisma = new PrismaClient();

export class SocialMediaService {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private twitter: TwitterApi;
  private facebook: FacebookAdsApi;
  private linkedin: LinkedInApi;
  private analytics: AnalyticsService;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize social media clients
    this.twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    FacebookAdsApi.init(process.env.FACEBOOK_ACCESS_TOKEN!);
    this.facebook = FacebookAdsApi.getInstance();

    this.linkedin = new LinkedInApi({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    });

    this.analytics = new AnalyticsService();
  }

  async createAutomatedPost(params: {
    platform: 'twitter' | 'facebook' | 'linkedin';
    content: string;
    schedule?: Date;
  }): Promise<{
    postId: string;
    url: string;
    status: 'scheduled' | 'published';
  }> {
    const { platform, content, schedule } = params;

    try {
      let postId: string;
      let url: string;
      let status: 'scheduled' | 'published' = 'published';

      // Generate platform-specific content
      const platformContent = await this.generatePlatformContent(platform, content);

      if (schedule) {
        // Schedule post
        await this.prisma.scheduledPost.create({
          data: {
            platform,
            content: platformContent,
            scheduledFor: schedule,
            status: 'scheduled',
          },
        });
        status = 'scheduled';
      } else {
        // Post immediately
        switch (platform) {
          case 'twitter':
            const tweet = await this.twitter.v2.tweet(platformContent);
            postId = tweet.data.id;
            url = `https://twitter.com/user/status/${postId}`;
            break;

          case 'facebook':
            const fbPost = await this.facebook.post('me/feed', {
              message: platformContent,
            });
            postId = fbPost.id;
            url = `https://facebook.com/${postId}`;
            break;

          case 'linkedin':
            const liPost = await this.linkedin.post('v2/shares', {
              text: {
                text: platformContent,
              },
            });
            postId = liPost.id;
            url = `https://linkedin.com/feed/update/${postId}`;
            break;
        }
      }

      // Log post
      await this.prisma.socialMediaPost.create({
        data: {
          platform,
          content: platformContent,
          postId: postId || '',
          url: url || '',
          status,
          scheduledFor: schedule,
        },
      });

      return {
        postId: postId || '',
        url: url || '',
        status,
      };
    } catch (error) {
      console.error(`Error creating ${platform} post:`, error);
      throw new Error(`Failed to create ${platform} post`);
    }
  }

  async getPostPerformance(params: {
    platform: 'twitter' | 'facebook' | 'linkedin';
    postId: string;
  }): Promise<{
    metrics: {
      impressions: number;
      engagements: number;
      clicks: number;
      shares: number;
    };
  }> {
    const { platform, postId } = params;

    try {
      let metrics;

      switch (platform) {
        case 'twitter':
          const tweetMetrics = await this.twitter.v2.singleTweet(postId, {
            'tweet.fields': ['public_metrics'],
          });
          metrics = tweetMetrics.data.public_metrics;
          break;

        case 'facebook':
          const fbMetrics = await this.facebook.get(`${postId}/insights`, {
            metric: ['post_impressions', 'post_engagements', 'post_clicks', 'post_shares'],
          });
          metrics = fbMetrics.data[0].values[0].value;
          break;

        case 'linkedin':
          const liMetrics = await this.linkedin.get(`v2/shares/${postId}/statistics`);
          metrics = liMetrics;
          break;
      }

      return {
        metrics: {
          impressions: metrics.impressions || 0,
          engagements: metrics.engagements || 0,
          clicks: metrics.clicks || 0,
          shares: metrics.shares || 0,
        },
      };
    } catch (error) {
      console.error(`Error getting ${platform} post performance:`, error);
      throw new Error(`Failed to get ${platform} post performance`);
    }
  }

  async getPlatformAnalytics(params: {
    platform: 'twitter' | 'facebook' | 'linkedin';
    startDate: Date;
    endDate: Date;
  }): Promise<{
    metrics: {
      totalPosts: number;
      totalImpressions: number;
      totalEngagements: number;
      engagementRate: number;
    };
    trends: Array<{
      date: Date;
      metrics: Record<string, number>;
    }>;
  }> {
    const { platform, startDate, endDate } = params;

    // Get posts
    const posts = await this.prisma.socialMediaPost.findMany({
      where: {
        platform,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate metrics
    const metrics = {
      totalPosts: posts.length,
      totalImpressions: posts.reduce((sum, post) => sum + (post.metrics?.impressions || 0), 0),
      totalEngagements: posts.reduce((sum, post) => sum + (post.metrics?.engagements || 0), 0),
      engagementRate:
        posts.reduce((sum, post) => sum + (post.metrics?.engagements || 0), 0) /
        posts.reduce((sum, post) => sum + (post.metrics?.impressions || 0), 0),
    };

    // Calculate trends
    const trends = this.calculatePlatformTrends(posts);

    return {
      metrics,
      trends,
    };
  }

  private async generatePlatformContent(
    platform: 'twitter' | 'facebook' | 'linkedin',
    content: string
  ): Promise<string> {
    const prompt = `Generate ${platform} content from this base content:
      ${content}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating engaging ${platform} content.`,
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

  private calculatePlatformTrends(posts: any[]): Array<{
    date: Date;
    metrics: Record<string, number>;
  }> {
    const dailyMetrics = posts.reduce((acc, post) => {
      const date = post.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          posts: 0,
          impressions: 0,
          engagements: 0,
          clicks: 0,
          shares: 0,
        };
      }

      acc[date].posts++;
      acc[date].impressions += post.metrics?.impressions || 0;
      acc[date].engagements += post.metrics?.engagements || 0;
      acc[date].clicks += post.metrics?.clicks || 0;
      acc[date].shares += post.metrics?.shares || 0;

      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(dailyMetrics).map(([date, metrics]) => ({
      date: new Date(date),
      metrics,
    }));
  }

  async schedulePost(params: {
    platform: 'facebook' | 'linkedin' | 'twitter' | 'instagram';
    content: string;
    media?: string[];
    schedule: Date;
    campaign?: string;
  }): Promise<{
    postId: string;
    status: 'scheduled' | 'failed';
  }> {
    const { platform, content, media, schedule, campaign } = params;

    try {
      // Schedule post on platform
      let postId: string;
      switch (platform) {
        case 'facebook':
          postId = await this.facebook.schedulePost(content, media, schedule);
          break;
        case 'linkedin':
          postId = await this.linkedin.schedulePost(content, media, schedule);
          break;
        case 'twitter':
          postId = await this.twitter.schedulePost(content, media, schedule);
          break;
        case 'instagram':
          postId = await this.instagram.schedulePost(content, media, schedule);
          break;
      }

      // Log scheduled post
      await this.prisma.socialMediaPost.create({
        data: {
          platform,
          content,
          media: media as any,
          schedule,
          campaign,
          status: 'scheduled',
          postId,
        },
      });

      return {
        postId,
        status: 'scheduled',
      };
    } catch (error) {
      // Log failure
      await this.prisma.socialMediaPost.create({
        data: {
          platform,
          content,
          media: media as any,
          schedule,
          campaign,
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  }

  async createAdCampaign(params: {
    platform: 'facebook' | 'linkedin' | 'twitter' | 'instagram';
    name: string;
    budget: number;
    targetAudience: {
      demographics?: Record<string, any>;
      interests?: string[];
      behaviors?: string[];
    };
    content: {
      text: string;
      media?: string[];
      callToAction?: string;
    };
    schedule: {
      startDate: Date;
      endDate: Date;
    };
  }): Promise<{
    campaignId: string;
    status: 'active' | 'failed';
  }> {
    const { platform, name, budget, targetAudience, content, schedule } = params;

    try {
      // Create campaign on platform
      let campaignId: string;
      switch (platform) {
        case 'facebook':
          campaignId = await this.facebook.createAdCampaign(
            name,
            budget,
            targetAudience,
            content,
            schedule
          );
          break;
        case 'linkedin':
          campaignId = await this.linkedin.createAdCampaign(
            name,
            budget,
            targetAudience,
            content,
            schedule
          );
          break;
        case 'twitter':
          campaignId = await this.twitter.createAdCampaign(
            name,
            budget,
            targetAudience,
            content,
            schedule
          );
          break;
        case 'instagram':
          campaignId = await this.instagram.createAdCampaign(
            name,
            budget,
            targetAudience,
            content,
            schedule
          );
          break;
      }

      // Log campaign
      await this.prisma.socialMediaCampaign.create({
        data: {
          platform,
          name,
          budget,
          targetAudience: targetAudience as any,
          content: content as any,
          schedule: schedule as any,
          status: 'active',
          campaignId,
        },
      });

      return {
        campaignId,
        status: 'active',
      };
    } catch (error) {
      // Log failure
      await this.prisma.socialMediaCampaign.create({
        data: {
          platform,
          name,
          budget,
          targetAudience: targetAudience as any,
          content: content as any,
          schedule: schedule as any,
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  }

  async trackPostPerformance(params: {
    postId: string;
    metrics: {
      impressions?: number;
      engagement?: number;
      clicks?: number;
      conversions?: number;
    };
  }): Promise<void> {
    const { postId, metrics } = params;

    // Update post metrics
    await this.prisma.socialMediaPost.update({
      where: { postId },
      data: {
        metrics: metrics as any,
        lastUpdated: new Date(),
      },
    });

    // Track in analytics
    await this.analytics.trackSocialMediaPerformance(postId, metrics);
  }

  async trackCampaignPerformance(params: {
    campaignId: string;
    metrics: {
      spend?: number;
      impressions?: number;
      clicks?: number;
      conversions?: number;
      costPerClick?: number;
      costPerConversion?: number;
    };
  }): Promise<void> {
    const { campaignId, metrics } = params;

    // Update campaign metrics
    await this.prisma.socialMediaCampaign.update({
      where: { campaignId },
      data: {
        metrics: metrics as any,
        lastUpdated: new Date(),
      },
    });

    // Track in analytics
    await this.analytics.trackCampaignPerformance(campaignId, metrics);
  }

  async generateAdCreative(params: {
    platform: 'facebook' | 'linkedin' | 'twitter' | 'instagram';
    campaign: string;
    targetAudience: string[];
  }): Promise<{
    text: string;
    media?: string[];
    callToAction?: string;
  }> {
    const { platform, campaign, targetAudience } = params;

    // Generate platform-specific creative
    switch (platform) {
      case 'facebook':
        return this.generateFacebookAd(campaign, targetAudience);
      case 'linkedin':
        return this.generateLinkedInAd(campaign, targetAudience);
      case 'twitter':
        return this.generateTwitterAd(campaign, targetAudience);
      case 'instagram':
        return this.generateInstagramAd(campaign, targetAudience);
    }
  }

  private async generateFacebookAd(
    campaign: string,
    targetAudience: string[]
  ): Promise<{
    text: string;
    media?: string[];
    callToAction?: string;
  }> {
    // Generate Facebook-specific ad creative
    return {
      text: `Stop Feeling Lost in Church Technology Decisions

Church leaders are spending 40% more on technology than 5 years ago, but seeing less ministry impact.

The problem isn't the technology - it's the strategy.

FaithTech Blueprint gives you a clear roadmap for technology decisions that actually advance your ministry.

✅ 15-minute assessment reveals your blind spots
✅ Strategic roadmap tailored to your church
✅ Proven templates from successful churches
✅ Integration with your existing systems

Over 200 churches have already transformed their digital ministry strategy.

Take the free assessment and see what's possible for your church.`,
      callToAction: 'Start Free Assessment',
    };
  }

  private async generateLinkedInAd(
    campaign: string,
    targetAudience: string[]
  ): Promise<{
    text: string;
    media?: string[];
    callToAction?: string;
  }> {
    // Generate LinkedIn-specific ad creative
    return {
      text: `Church Technology Strategy from a Pastor Who Codes

Most church technology consultants understand either ministry OR technology. Not both.

I'm David George - ordained pastor with 10+ years in ministry leadership AND software developer with expertise in modern web applications.

I built FaithTech Blueprint because churches need technology guidance that understands ministry context, not just technical capabilities.

The platform includes:
• Ministry-focused technology assessments
• Strategic implementation roadmaps
• Proven templates from successful churches
• Seamless integrations with popular ChMS platforms

Join 200+ church leaders who've already transformed their technology strategy.`,
      callToAction: 'Learn More',
    };
  }

  private async generateTwitterAd(
    campaign: string,
    targetAudience: string[]
  ): Promise<{
    text: string;
    media?: string[];
    callToAction?: string;
  }> {
    // Generate Twitter-specific ad creative
    return {
      text: `Stop guessing about church technology. Get strategic guidance that understands ministry context.

Join 200+ churches using FaithTech Blueprint to transform their digital ministry.

Free assessment: faithtechblueprint.com/assessment`,
      callToAction: 'Take Assessment',
    };
  }

  private async generateInstagramAd(
    campaign: string,
    targetAudience: string[]
  ): Promise<{
    text: string;
    media?: string[];
    callToAction?: string;
  }> {
    // Generate Instagram-specific ad creative
    return {
      text: `Transform your church's technology strategy with FaithTech Blueprint.

✅ Ministry-focused assessments
✅ Strategic roadmaps
✅ Proven templates
✅ Seamless integrations

Join 200+ churches already seeing results.

Link in bio for your free assessment.`,
      callToAction: 'Get Started',
    };
  }

  async postToTwitter(content: string, campaignId?: string) {
    try {
      const tweet = await this.twitter.v2.tweet(content);

      const post = await prisma.post.create({
        data: {
          title: content.substring(0, 100),
          content,
          platform: 'twitter',
          status: 'published',
          metrics: {
            likes: 0,
            retweets: 0,
            replies: 0,
          },
          campaignId,
        },
      });

      return post;
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      throw error;
    }
  }

  async postToFacebook(content: string, campaignId?: string) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
        {
          message: content,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`,
          },
        }
      );

      const post = await prisma.post.create({
        data: {
          title: content.substring(0, 100),
          content,
          platform: 'facebook',
          status: 'published',
          metrics: {
            likes: 0,
            shares: 0,
            comments: 0,
          },
          campaignId,
        },
      });

      return post;
    } catch (error) {
      console.error('Error posting to Facebook:', error);
      throw error;
    }
  }

  async postToLinkedIn(content: string, campaignId?: string) {
    try {
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:person:${process.env.LINKEDIN_USER_ID}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const post = await prisma.post.create({
        data: {
          title: content.substring(0, 100),
          content,
          platform: 'linkedin',
          status: 'published',
          metrics: {
            likes: 0,
            shares: 0,
            comments: 0,
          },
          campaignId,
        },
      });

      return post;
    } catch (error) {
      console.error('Error posting to LinkedIn:', error);
      throw error;
    }
  }

  async updatePostMetrics(postId: string, platform: string, metrics: any) {
    try {
      const post = await prisma.post.update({
        where: { id: postId },
        data: {
          metrics: {
            ...metrics,
          },
        },
      });

      return post;
    } catch (error) {
      console.error('Error updating post metrics:', error);
      throw error;
    }
  }
} 