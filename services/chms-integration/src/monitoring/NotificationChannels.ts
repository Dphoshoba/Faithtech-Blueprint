import { Alert } from './IntegrationAlerts';
import { logger } from '../../../utils/logger';
import axios from 'axios';

// Base notification channel interface
export interface NotificationChannel {
  type: string;
  config: Record<string, any>;
  send: (alert: Alert) => Promise<void>;
}

// Email notification channel
export class EmailNotificationChannel implements NotificationChannel {
  type = 'email';
  
  constructor(private config: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    from: string;
    to: string[];
  }) {}

  async send(alert: Alert): Promise<void> {
    try {
      // In a real implementation, you would use a proper email service
      // This is a simplified example
      const message = {
        from: this.config.from,
        to: this.config.to,
        subject: `Integration Alert: ${alert.type} - ${alert.severity}`,
        text: `
          Alert ID: ${alert.id}
          Integration: ${alert.integrationId}
          Type: ${alert.type}
          Severity: ${alert.severity}
          Message: ${alert.message}
          Time: ${alert.timestamp}
          Metadata: ${JSON.stringify(alert.metadata, null, 2)}
        `,
      };

      // Send email using your preferred email service
      logger.info('Sending email notification:', message);
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      throw error;
    }
  }
}

// Slack notification channel
export class SlackNotificationChannel implements NotificationChannel {
  type = 'slack';
  
  constructor(private config: { webhookUrl: string }) {}

  async send(alert: Alert): Promise<void> {
    try {
      const message = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 Integration Alert: ${alert.type}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Integration:*\n${alert.integrationId}`,
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${alert.severity}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${alert.message}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Time:*\n${alert.timestamp}`,
            },
          },
        ],
      };

      await axios.post(this.config.webhookUrl, message);
    } catch (error) {
      logger.error('Failed to send Slack notification:', error);
      throw error;
    }
  }
}

// Microsoft Teams notification channel
export class TeamsNotificationChannel implements NotificationChannel {
  type = 'teams';
  
  constructor(private config: { webhookUrl: string }) {}

  async send(alert: Alert): Promise<void> {
    try {
      const message = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.0',
              body: [
                {
                  type: 'TextBlock',
                  size: 'Large',
                  weight: 'Bolder',
                  text: `🚨 Integration Alert: ${alert.type}`,
                },
                {
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'Integration',
                      value: alert.integrationId,
                    },
                    {
                      title: 'Severity',
                      value: alert.severity,
                    },
                    {
                      title: 'Message',
                      value: alert.message,
                    },
                    {
                      title: 'Time',
                      value: alert.timestamp.toString(),
                    },
                  ],
                },
              ],
            },
          },
        ],
      };

      await axios.post(this.config.webhookUrl, message);
    } catch (error) {
      logger.error('Failed to send Teams notification:', error);
      throw error;
    }
  }
}

// SMS notification channel
export class SMSNotificationChannel implements NotificationChannel {
  type = 'sms';
  
  constructor(private config: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    toNumbers: string[];
  }) {}

  async send(alert: Alert): Promise<void> {
    try {
      // In a real implementation, you would use a proper SMS service
      // This is a simplified example
      const message = {
        from: this.config.fromNumber,
        to: this.config.toNumbers,
        body: `Alert: ${alert.type} - ${alert.severity}\n${alert.message}`,
      };

      // Send SMS using your preferred SMS service
      logger.info('Sending SMS notification:', message);
    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
      throw error;
    }
  }
}

// Webhook notification channel
export class WebhookNotificationChannel implements NotificationChannel {
  type = 'webhook';
  
  constructor(private config: { webhookUrl: string; headers?: Record<string, string> }) {}

  async send(alert: Alert): Promise<void> {
    try {
      await axios.post(this.config.webhookUrl, alert, {
        headers: this.config.headers,
      });
    } catch (error) {
      logger.error('Failed to send webhook notification:', error);
      throw error;
    }
  }
}

// Discord notification channel
export class DiscordNotificationChannel implements NotificationChannel {
  type = 'discord';
  
  constructor(private config: { webhookUrl: string }) {}

  async send(alert: Alert): Promise<void> {
    try {
      const message = {
        embeds: [
          {
            title: `🚨 Integration Alert: ${alert.type}`,
            color: this.getSeverityColor(alert.severity),
            fields: [
              {
                name: 'Integration',
                value: alert.integrationId,
                inline: true,
              },
              {
                name: 'Severity',
                value: alert.severity,
                inline: true,
              },
              {
                name: 'Message',
                value: alert.message,
              },
              {
                name: 'Time',
                value: alert.timestamp.toString(),
              },
            ],
            timestamp: alert.timestamp.toISOString(),
          },
        ],
      };

      await axios.post(this.config.webhookUrl, message);
    } catch (error) {
      logger.error('Failed to send Discord notification:', error);
      throw error;
    }
  }

  private getSeverityColor(severity: string): number {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 0xFF0000; // Red
      case 'error':
        return 0xFFA500; // Orange
      case 'warning':
        return 0xFFFF00; // Yellow
      default:
        return 0x00FF00; // Green
    }
  }
}

// PagerDuty notification channel
export class PagerDutyNotificationChannel implements NotificationChannel {
  type = 'pagerduty';
  
  constructor(private config: {
    apiKey: string;
    serviceId: string;
    escalationPolicyId?: string;
  }) {}

  async send(alert: Alert): Promise<void> {
    try {
      const incident = {
        incident: {
          type: 'incident',
          title: `Integration Alert: ${alert.type} - ${alert.severity}`,
          urgency: this.getUrgency(alert.severity),
          body: {
            type: 'incident_body',
            details: `
              Integration: ${alert.integrationId}
              Type: ${alert.type}
              Severity: ${alert.severity}
              Message: ${alert.message}
              Time: ${alert.timestamp}
              Metadata: ${JSON.stringify(alert.metadata, null, 2)}
            `,
          },
          service: {
            id: this.config.serviceId,
            type: 'service_reference',
          },
          ...(this.config.escalationPolicyId && {
            escalation_policy: {
              id: this.config.escalationPolicyId,
              type: 'escalation_policy_reference',
            },
          }),
        },
      };

      await axios.post('https://api.pagerduty.com/incidents', incident, {
        headers: {
          'Authorization': `Token token=${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.pagerduty+json;version=2',
        },
      });
    } catch (error) {
      logger.error('Failed to send PagerDuty notification:', error);
      throw error;
    }
  }

  private getUrgency(severity: string): 'high' | 'low' {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'high';
      default:
        return 'low';
    }
  }
}

// Jira notification channel
export class JiraNotificationChannel implements NotificationChannel {
  type = 'jira';
  
  constructor(private config: {
    baseUrl: string;
    username: string;
    apiToken: string;
    projectKey: string;
    issueType: string;
    priorityMap?: Record<string, string>;
  }) {}

  async send(alert: Alert): Promise<void> {
    try {
      const issue = {
        fields: {
          project: {
            key: this.config.projectKey,
          },
          summary: `Integration Alert: ${alert.type} - ${alert.severity}`,
          description: `
            *Integration:* ${alert.integrationId}
            *Type:* ${alert.type}
            *Severity:* ${alert.severity}
            *Message:* ${alert.message}
            *Time:* ${alert.timestamp}
            *Metadata:* {code:json}${JSON.stringify(alert.metadata, null, 2)}{code}
          `,
          issuetype: {
            name: this.config.issueType,
          },
          priority: {
            name: this.getPriority(alert.severity),
          },
          labels: ['integration-alert', alert.type.toLowerCase()],
        },
      };

      await axios.post(`${this.config.baseUrl}/rest/api/2/issue`, issue, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      logger.error('Failed to send Jira notification:', error);
      throw error;
    }
  }

  private getPriority(severity: string): string {
    const priorityMap = this.config.priorityMap || {
      critical: 'Highest',
      error: 'High',
      warning: 'Medium',
      info: 'Low',
    };
    return priorityMap[severity.toLowerCase()] || 'Medium';
  }
}

// ServiceNow notification channel
export class ServiceNowNotificationChannel implements NotificationChannel {
  type = 'servicenow';
  
  constructor(private config: {
    instanceUrl: string;
    username: string;
    password: string;
    tableName: string;
    impactMap?: Record<string, number>;
    urgencyMap?: Record<string, number>;
  }) {}

  async send(alert: Alert): Promise<void> {
    try {
      const incident = {
        short_description: `Integration Alert: ${alert.type} - ${alert.severity}`,
        description: `
          Integration: ${alert.integrationId}
          Type: ${alert.type}
          Severity: ${alert.severity}
          Message: ${alert.message}
          Time: ${alert.timestamp}
          Metadata: ${JSON.stringify(alert.metadata, null, 2)}
        `,
        impact: this.getImpact(alert.severity),
        urgency: this.getUrgency(alert.severity),
        category: 'Integration',
        subcategory: alert.type,
        assignment_group: 'Integration Team',
        caller_id: 'System',
      };

      await axios.post(`${this.config.instanceUrl}/api/now/table/${this.config.tableName}`, incident, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      logger.error('Failed to send ServiceNow notification:', error);
      throw error;
    }
  }

  private getImpact(severity: string): number {
    const impactMap = this.config.impactMap || {
      critical: 1, // High
      error: 2,    // Medium
      warning: 3,  // Low
      info: 3,     // Low
    };
    return impactMap[severity.toLowerCase()] || 2;
  }

  private getUrgency(severity: string): number {
    const urgencyMap = this.config.urgencyMap || {
      critical: 1, // High
      error: 2,    // Medium
      warning: 3,  // Low
      info: 3,     // Low
    };
    return urgencyMap[severity.toLowerCase()] || 2;
  }
}

// Notification channel factory
export class NotificationChannelFactory {
  static createChannel(type: string, config: Record<string, any>): NotificationChannel {
    switch (type) {
      case 'email':
        return new EmailNotificationChannel(config);
      case 'slack':
        return new SlackNotificationChannel(config);
      case 'teams':
        return new TeamsNotificationChannel(config);
      case 'sms':
        return new SMSNotificationChannel(config);
      case 'webhook':
        return new WebhookNotificationChannel(config);
      case 'discord':
        return new DiscordNotificationChannel(config);
      case 'pagerduty':
        return new PagerDutyNotificationChannel(config);
      case 'jira':
        return new JiraNotificationChannel(config);
      case 'servicenow':
        return new ServiceNowNotificationChannel(config);
      default:
        throw new Error(`Unsupported notification channel type: ${type}`);
    }
  }
} 