import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { Configuration, OpenAIApi } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export class EmailMarketingService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async createEmailCampaign(
    subject: string,
    content: string,
    recipients: string[],
    campaignId?: string
  ) {
    try {
      // Generate personalized content using OpenAI
      const personalizedContent = await this.personalizeContent(content, recipients);

      // Send emails
      const emailPromises = recipients.map(async (recipient) => {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: recipient,
          subject,
          html: personalizedContent[recipient],
        });
      });

      await Promise.all(emailPromises);

      // Store in database
      const email = await prisma.email.create({
        data: {
          subject,
          content,
          status: 'sent',
          metrics: {
            sent: recipients.length,
            opened: 0,
            clicked: 0,
          },
          campaignId,
        },
      });

      return email;
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  async trackEmailMetrics(emailId: string, metrics: any) {
    try {
      const email = await prisma.email.update({
        where: { id: emailId },
        data: {
          metrics: {
            ...metrics,
          },
        },
      });

      return email;
    } catch (error) {
      console.error('Error tracking email metrics:', error);
      throw error;
    }
  }

  private async personalizeContent(
    content: string,
    recipients: string[]
  ): Promise<Record<string, string>> {
    try {
      const personalizedContent: Record<string, string> = {};

      for (const recipient of recipients) {
        const response = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt: `Personalize this email content for ${recipient}:\n\n${content}`,
          max_tokens: 500,
          temperature: 0.7,
        });

        personalizedContent[recipient] = response.data.choices[0].text || content;
      }

      return personalizedContent;
    } catch (error) {
      console.error('Error personalizing content:', error);
      return recipients.reduce((acc, recipient) => {
        acc[recipient] = content;
        return acc;
      }, {} as Record<string, string>);
    }
  }
} 