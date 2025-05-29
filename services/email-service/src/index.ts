import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

export interface EmailService {
  sendTemplateEmail(
    templateName: string,
    recipientEmail: string,
    templateData: Record<string, any>
  ): Promise<void>;
}

export class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor(config: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    templatesDir?: string;
  }) {
    this.transporter = nodemailer.createTransport(config.smtp);
    this.templatesDir = config.templatesDir || path.join(__dirname, 'templates');
  }

  async sendTemplateEmail(
    templateName: string,
    recipientEmail: string,
    templateData: Record<string, any>
  ): Promise<void> {
    try {
      // Load template
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      
      // Compile template
      const template = Handlebars.compile(templateContent);
      const html = template(templateData);

      // Send email
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipientEmail,
        subject: templateData.subject || 'FaithTech Blueprint Notification',
        html,
      });
    } catch (error) {
      console.error('Error sending template email:', error);
      throw new Error('Failed to send template email');
    }
  }
} 