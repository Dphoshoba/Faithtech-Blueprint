import { PrismaClient } from '@prisma/client';
import { ContentMarketingService } from './services/ContentMarketingService';
import { EmailMarketingService } from './services/EmailMarketingService';
import { SocialMediaService } from './services/SocialMediaService';
import { CampaignManagementService } from './services/CampaignManagementService';
import { MarketingAutomationService } from './services/MarketingAutomationService';
import { AnalyticsService } from './services/AnalyticsService';

const prisma = new PrismaClient();

// Initialize services
const contentMarketing = new ContentMarketingService();
const emailMarketing = new EmailMarketingService();
const socialMedia = new SocialMediaService();
const campaignManagement = new CampaignManagementService();
const marketingAutomation = new MarketingAutomationService();
const analytics = new AnalyticsService();

// Export services
export {
  contentMarketing,
  emailMarketing,
  socialMedia,
  campaignManagement,
  marketingAutomation,
  analytics,
};

// Example usage
async function main() {
  try {
    // Create a new campaign
    const campaign = await campaignManagement.createCampaign({
      name: 'Q2 2024 Launch',
      description: 'Product launch campaign for Q2 2024',
      startDate: new Date(),
      budget: 10000,
      channels: ['twitter', 'facebook', 'linkedin', 'email'],
    });

    // Create and publish content
    const blogPost = await contentMarketing.createBlogPost(
      'New Product Launch: FaithTech Blueprint',
      'Exciting news! We are launching our new product...',
      ['faithtech', 'launch', 'product']
    );

    // Send email campaign
    const email = await emailMarketing.createEmailCampaign(
      'Join us for our product launch!',
      'We are excited to announce...',
      ['user1@example.com', 'user2@example.com'],
      campaign.id
    );

    // Post to social media
    const socialPost = await socialMedia.postToTwitter(
      'Exciting news! Our new product is launching soon. Stay tuned! #FaithTech #Launch',
      campaign.id
    );

    // Create automation workflow
    const workflow = await marketingAutomation.createWorkflow({
      name: 'Product Launch Sequence',
      triggers: [
        {
          type: 'campaign_start',
          campaignId: campaign.id,
        },
      ],
      actions: [
        {
          type: 'send_email',
          data: {
            subject: 'Welcome to our launch!',
            content: 'Thank you for joining us...',
            recipients: ['user1@example.com'],
          },
        },
      ],
    });

    // Analyze campaign performance
    const performance = await analytics.analyzeCampaignPerformance(campaign.id);
    console.log('Campaign Performance:', performance);

  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the example
if (require.main === module) {
  main();
} 