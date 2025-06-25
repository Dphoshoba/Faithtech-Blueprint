import { IntegrationStatus, IntegrationMetrics } from '../types';
import { logger } from '../../../utils/logger';
import { IntegrationError } from '../errors';

export interface AlertConfig {
  errorThreshold: number;
  syncTimeThreshold: number;
  statusCheckInterval: number;
  notificationChannels: NotificationChannel[];
}

export interface Alert {
  id: string;
  integrationId: string;
  type: 'error' | 'performance' | 'status';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  send: (alert: Alert) => Promise<void>;
}

export class IntegrationAlerts {
  private alerts: Alert[] = [];
  private config: AlertConfig;
  private statusChecks: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: AlertConfig) {
    this.config = config;
  }

  async checkIntegrationStatus(status: IntegrationStatus): Promise<void> {
    const alerts: Alert[] = [];

    // Check error rate
    if (status.metrics.errorCount > this.config.errorThreshold) {
      alerts.push({
        id: `${status.integrationId}-error-${Date.now()}`,
        integrationId: status.integrationId,
        type: 'error',
        severity: 'high',
        message: `High error rate detected for ${status.provider}`,
        timestamp: new Date(),
        metadata: {
          errorCount: status.metrics.errorCount,
          threshold: this.config.errorThreshold,
        },
      });
    }

    // Check sync time
    if (status.metrics.averageSyncTime > this.config.syncTimeThreshold) {
      alerts.push({
        id: `${status.integrationId}-performance-${Date.now()}`,
        integrationId: status.integrationId,
        type: 'performance',
        severity: 'medium',
        message: `Slow sync performance detected for ${status.provider}`,
        timestamp: new Date(),
        metadata: {
          averageSyncTime: status.metrics.averageSyncTime,
          threshold: this.config.syncTimeThreshold,
        },
      });
    }

    // Check integration status
    if (status.status === 'error') {
      alerts.push({
        id: `${status.integrationId}-status-${Date.now()}`,
        integrationId: status.integrationId,
        type: 'status',
        severity: 'high',
        message: `Integration error detected for ${status.provider}`,
        timestamp: new Date(),
        metadata: {
          error: status.error,
          lastSync: status.lastSync,
        },
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  private async processAlert(alert: Alert): Promise<void> {
    // Store alert
    this.alerts.push(alert);
    logger.warn(`Integration alert: ${alert.message}`, alert);

    // Send notifications
    for (const channel of this.config.notificationChannels) {
      try {
        await channel.send(alert);
      } catch (error) {
        logger.error(`Failed to send alert through ${channel.type}:`, error);
      }
    }
  }

  startStatusChecks(integrationId: string, checkFn: () => Promise<IntegrationStatus>): void {
    const interval = setInterval(async () => {
      try {
        const status = await checkFn();
        await this.checkIntegrationStatus(status);
      } catch (error) {
        logger.error(`Error checking integration status for ${integrationId}:`, error);
      }
    }, this.config.statusCheckInterval);

    this.statusChecks.set(integrationId, interval);
  }

  stopStatusChecks(integrationId: string): void {
    const interval = this.statusChecks.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.statusChecks.delete(integrationId);
    }
  }

  getAlerts(
    integrationId?: string,
    type?: Alert['type'],
    severity?: Alert['severity'],
    startDate?: Date,
    endDate?: Date
  ): Alert[] {
    return this.alerts.filter(alert => {
      if (integrationId && alert.integrationId !== integrationId) return false;
      if (type && alert.type !== type) return false;
      if (severity && alert.severity !== severity) return false;
      if (startDate && alert.timestamp < startDate) return false;
      if (endDate && alert.timestamp > endDate) return false;
      return true;
    });
  }

  clearAlerts(integrationId?: string): void {
    if (integrationId) {
      this.alerts = this.alerts.filter(alert => alert.integrationId !== integrationId);
    } else {
      this.alerts = [];
    }
  }
} 