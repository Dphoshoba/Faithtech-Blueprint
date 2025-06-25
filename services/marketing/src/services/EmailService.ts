import { PrismaClient } from '@prisma/client';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { join } from 'path';
import { compile } from 'handlebars';

export class EmailService {
  private prisma: PrismaClient;
  private ses: SESClient;
  private s3: S3Client;
  private templates: Map<string, HandlebarsTemplateDelegate>;

  constructor() {
    this.prisma = new PrismaClient();
    this.ses = new SESClient({
      region: process.env.AWS_REGION,
    });
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
    });
    this.templates = new Map();
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    template?: string;
    data?: Record<string, any>;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<{
    messageId: string;
    status: 'sent' | 'failed';
  }> {
    const { to, subject, body, template, data, attachments } = params;

    try {
      let emailBody = body;

      // Use template if provided
      if (template) {
        emailBody = await this.renderTemplate(template, data || {});
      }

      // Prepare email command
      const command = new SendEmailCommand({
        Source: process.env.EMAIL_FROM,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: emailBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      // Add attachments if any
      if (attachments) {
        command.input.Message.Body.Attachments = attachments.map(attachment => ({
          Filename: attachment.filename,
          Content: attachment.content.toString('base64'),
          ContentType: attachment.contentType,
        }));
      }

      // Send email
      const response = await this.ses.send(command);

      // Log email
      await this.prisma.emailLog.create({
        data: {
          to,
          subject,
          template,
          status: 'sent',
          messageId: response.MessageId,
        },
      });

      return {
        messageId: response.MessageId,
        status: 'sent',
      };
    } catch (error) {
      // Log failure
      await this.prisma.emailLog.create({
        data: {
          to,
          subject,
          template,
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  }

  async sendPressRelease(pressRelease: string): Promise<void> {
    const pressList = await this.prisma.pressContact.findMany({
      where: {
        status: 'active',
      },
    });

    for (const contact of pressList) {
      await this.sendEmail({
        to: contact.email,
        subject: 'FaithTech Blueprint Press Release',
        body: pressRelease,
        template: 'press-release',
        data: {
          contactName: contact.name,
          publication: contact.publication,
        },
      });
    }
  }

  async sendAffiliateInvitation(program: any): Promise<void> {
    const potentialAffiliates = await this.prisma.potentialAffiliate.findMany({
      where: {
        status: 'pending',
      },
    });

    for (const affiliate of potentialAffiliates) {
      await this.sendEmail({
        to: affiliate.email,
        subject: 'Join FaithTech Blueprint Partner Program',
        template: 'affiliate-invitation',
        data: {
          name: affiliate.name,
          program: program.name,
          commission: program.commission,
          requirements: program.requirements,
          benefits: program.benefits,
        },
      });
    }
  }

  async sendBetaUserAnnouncement(params: {
    churchName: string;
    improvements: string[];
  }): Promise<void> {
    const betaUsers = await this.prisma.betaUser.findMany({
      where: {
        status: 'active',
      },
    });

    for (const user of betaUsers) {
      await this.sendEmail({
        to: user.email,
        subject: "You helped us build it - now we're launching!",
        template: 'beta-announcement',
        data: {
          name: user.name,
          churchName: params.churchName,
          improvements: params.improvements,
        },
      });
    }
  }

  async sendWaitlistAnnouncement(): Promise<void> {
    const waitlist = await this.prisma.waitlistSubscriber.findMany({
      where: {
        status: 'pending',
      },
    });

    for (const subscriber of waitlist) {
      await this.sendEmail({
        to: subscriber.email,
        subject: 'The wait is over - FaithTech Blueprint is here',
        template: 'waitlist-announcement',
        data: {
          name: subscriber.name,
          churchName: subscriber.churchName,
        },
      });
    }
  }

  async sendChurchLeaderAnnouncement(params: {
    name: string;
    churchName: string;
    location: string;
  }): Promise<void> {
    const churchLeaders = await this.prisma.churchLeader.findMany({
      where: {
        status: 'active',
      },
    });

    for (const leader of churchLeaders) {
      await this.sendEmail({
        to: leader.email,
        subject: 'From one church leader to another...',
        template: 'church-leader-announcement',
        data: {
          name: leader.name,
          churchName: params.churchName,
          location: params.location,
        },
      });
    }
  }

  private async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<string> {
    // Check if template is cached
    if (!this.templates.has(templateName)) {
      // Load template from S3
      const command = new GetObjectCommand({
        Bucket: process.env.EMAIL_TEMPLATES_BUCKET,
        Key: `templates/${templateName}.hbs`,
      });

      const response = await this.s3.send(command);
      const templateContent = await response.Body.transformToString();

      // Compile template
      const template = compile(templateContent);
      this.templates.set(templateName, template);
    }

    // Render template
    const template = this.templates.get(templateName);
    return template(data);
  }
} 