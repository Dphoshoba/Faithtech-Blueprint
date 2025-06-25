import { PrismaClient } from '@prisma/client';
import { ContentMarketingService } from './ContentMarketingService';
import { EmailMarketingService } from './EmailMarketingService';
import { SocialMediaService } from './SocialMediaService';

const prisma = new PrismaClient();

export class MarketingAutomationService {
  private contentMarketing: ContentMarketingService;
  private emailMarketing: EmailMarketingService;
  private socialMedia: SocialMediaService;

  constructor() {
    this.contentMarketing = new ContentMarketingService();
    this.emailMarketing = new EmailMarketingService();
    this.socialMedia = new SocialMediaService();
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    triggers: any[];
    actions: any[];
  }) {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          name: data.name,
          description: data.description,
          triggers: data.triggers,
          actions: data.actions,
          status: 'active',
        },
      });

      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string, triggerData: any) {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Execute actions based on triggers
      for (const action of workflow.actions) {
        await this.executeAction(action, triggerData);
      }

      return true;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  private async executeAction(action: any, triggerData: any) {
    switch (action.type) {
      case 'create_blog_post':
        await this.contentMarketing.createBlogPost(
          action.data.title,
          action.data.content,
          action.data.tags
        );
        break;

      case 'send_email':
        await this.emailMarketing.createEmailCampaign(
          action.data.subject,
          action.data.content,
          action.data.recipients,
          action.data.campaignId
        );
        break;

      case 'post_social':
        switch (action.data.platform) {
          case 'twitter':
            await this.socialMedia.postToTwitter(
              action.data.content,
              action.data.campaignId
            );
            break;
          case 'facebook':
            await this.socialMedia.postToFacebook(
              action.data.content,
              action.data.campaignId
            );
            break;
          case 'linkedin':
            await this.socialMedia.postToLinkedIn(
              action.data.content,
              action.data.campaignId
            );
            break;
        }
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
} 