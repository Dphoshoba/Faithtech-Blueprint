import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { MarketingAnalytics } from '../../analytics/src/services/MarketingAnalytics';
import { CampaignService } from './CampaignService';
import { EmailMarketingService } from './EmailMarketingService';
import { SocialMediaService } from './SocialMediaService';
import { ContentMarketingService } from './ContentMarketingService';

export class AutomationService {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private analytics: MarketingAnalytics;
  private campaign: CampaignService;
  private email: EmailMarketingService;
  private social: SocialMediaService;
  private content: ContentMarketingService;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.analytics = new MarketingAnalytics();
    this.campaign = new CampaignService();
    this.email = new EmailMarketingService();
    this.social = new SocialMediaService();
    this.content = new ContentMarketingService();
  }

  async createAutomationWorkflow(params: {
    name: string;
    description: string;
    trigger: {
      type: string;
      conditions: Record<string, any>;
    };
    actions: Array<{
      type: string;
      config: Record<string, any>;
    }>;
  }): Promise<{
    workflowId: string;
    status: 'active' | 'inactive';
  }> {
    const { name, description, trigger, actions } = params;

    // Create workflow
    const workflow = await this.prisma.automationWorkflow.create({
      data: {
        name,
        description,
        trigger: trigger as any,
        actions: actions as any,
        status: 'active',
      },
    });

    // Start workflow monitoring
    this.monitorWorkflow(workflow.id);

    return {
      workflowId: workflow.id,
      status: 'active',
    };
  }

  async executeWorkflow(params: {
    workflowId: string;
    context: Record<string, any>;
  }): Promise<{
    success: boolean;
    results: Array<{
      action: string;
      status: 'success' | 'failed';
      message: string;
    }>;
  }> {
    const { workflowId, context } = params;

    // Get workflow
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const results = [];

    // Execute actions
    for (const action of workflow.actions) {
      try {
        switch (action.type) {
          case 'send_email':
            await this.email.sendAutomatedEmail({
              template: action.config.template,
              recipient: context.recipient,
              data: context.data,
            });
            break;

          case 'post_social':
            await this.social.createAutomatedPost({
              platform: action.config.platform,
              content: action.config.content,
              schedule: action.config.schedule,
            });
            break;

          case 'create_content':
            await this.content.createAutomatedContent({
              type: action.config.type,
              topic: action.config.topic,
              targetAudience: action.config.targetAudience,
            });
            break;

          case 'launch_campaign':
            await this.campaign.launchCampaign({
              campaignId: action.config.campaignId,
            });
            break;
        }

        results.push({
          action: action.type,
          status: 'success',
          message: 'Action executed successfully',
        });
      } catch (error) {
        results.push({
          action: action.type,
          status: 'failed',
          message: error.message,
        });
      }
    }

    // Log execution
    await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        context: context as any,
        results: results as any,
        status: results.every(r => r.status === 'success') ? 'success' : 'failed',
      },
    });

    return {
      success: results.every(r => r.status === 'success'),
      results,
    };
  }

  async getWorkflowPerformance(params: {
    workflowId: string;
  }): Promise<{
    metrics: {
      totalExecutions: number;
      successRate: number;
      averageExecutionTime: number;
    };
    recentExecutions: Array<{
      timestamp: Date;
      status: 'success' | 'failed';
      results: Array<{
        action: string;
        status: 'success' | 'failed';
        message: string;
      }>;
    }>;
  }> {
    const { workflowId } = params;

    // Get workflow executions
    const executions = await this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    // Calculate metrics
    const metrics = {
      totalExecutions: executions.length,
      successRate: executions.filter(e => e.status === 'success').length / executions.length,
      averageExecutionTime: executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length,
    };

    return {
      metrics,
      recentExecutions: executions.map(e => ({
        timestamp: e.timestamp,
        status: e.status,
        results: e.results,
      })),
    };
  }

  async optimizeWorkflow(params: {
    workflowId: string;
  }): Promise<{
    recommendations: string[];
    optimizations: Array<{
      action: string;
      changes: Record<string, any>;
    }>;
  }> {
    const { workflowId } = params;

    // Get workflow performance
    const performance = await this.getWorkflowPerformance({ workflowId });

    // Generate optimization recommendations
    const recommendations = await this.generateOptimizationRecommendations(performance);

    // Calculate optimizations
    const optimizations = await this.calculateOptimizations(performance);

    return {
      recommendations,
      optimizations,
    };
  }

  private async monitorWorkflow(workflowId: string): Promise<void> {
    // Get workflow
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Start monitoring loop
    setInterval(async () => {
      try {
        // Check trigger conditions
        const shouldExecute = await this.checkTriggerConditions(workflow.trigger);

        if (shouldExecute) {
          // Execute workflow
          await this.executeWorkflow({
            workflowId,
            context: await this.getWorkflowContext(workflow),
          });
        }
      } catch (error) {
        console.error(`Error monitoring workflow ${workflowId}:`, error);
      }
    }, 60000); // Check every minute
  }

  private async checkTriggerConditions(trigger: {
    type: string;
    conditions: Record<string, any>;
  }): Promise<boolean> {
    switch (trigger.type) {
      case 'schedule':
        return this.checkScheduleTrigger(trigger.conditions);
      case 'event':
        return this.checkEventTrigger(trigger.conditions);
      case 'condition':
        return this.checkConditionTrigger(trigger.conditions);
      default:
        return false;
    }
  }

  private async checkScheduleTrigger(conditions: Record<string, any>): Promise<boolean> {
    const now = new Date();
    const schedule = conditions.schedule;

    switch (schedule.type) {
      case 'daily':
        return now.getHours() === schedule.hour && now.getMinutes() === schedule.minute;
      case 'weekly':
        return (
          now.getDay() === schedule.day &&
          now.getHours() === schedule.hour &&
          now.getMinutes() === schedule.minute
        );
      case 'monthly':
        return (
          now.getDate() === schedule.day &&
          now.getHours() === schedule.hour &&
          now.getMinutes() === schedule.minute
        );
      default:
        return false;
    }
  }

  private async checkEventTrigger(conditions: Record<string, any>): Promise<boolean> {
    const event = conditions.event;
    const recentEvents = await this.prisma.event.findMany({
      where: {
        type: event.type,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    return recentEvents.length > 0;
  }

  private async checkConditionTrigger(conditions: Record<string, any>): Promise<boolean> {
    const { metric, operator, value } = conditions;
    const currentValue = await this.analytics.getMetricValue(metric);

    switch (operator) {
      case 'gt':
        return currentValue > value;
      case 'lt':
        return currentValue < value;
      case 'eq':
        return currentValue === value;
      default:
        return false;
    }
  }

  private async getWorkflowContext(workflow: any): Promise<Record<string, any>> {
    const prompt = `Generate context for this automation workflow:
      ${JSON.stringify(workflow, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at generating context for automation workflows.',
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

  private async generateOptimizationRecommendations(performance: {
    metrics: {
      totalExecutions: number;
      successRate: number;
      averageExecutionTime: number;
    };
    recentExecutions: Array<{
      timestamp: Date;
      status: 'success' | 'failed';
      results: Array<{
        action: string;
        status: 'success' | 'failed';
        message: string;
      }>;
    }>;
  }): Promise<string[]> {
    const prompt = `Generate optimization recommendations based on this workflow performance:
      ${JSON.stringify(performance, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at optimizing automation workflows.',
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

  private async calculateOptimizations(performance: {
    metrics: {
      totalExecutions: number;
      successRate: number;
      averageExecutionTime: number;
    };
    recentExecutions: Array<{
      timestamp: Date;
      status: 'success' | 'failed';
      results: Array<{
        action: string;
        status: 'success' | 'failed';
        message: string;
      }>;
    }>;
  }): Promise<Array<{
    action: string;
    changes: Record<string, any>;
  }>> {
    const prompt = `Calculate optimizations based on this workflow performance:
      ${JSON.stringify(performance, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at calculating optimizations for automation workflows.',
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