import { ChmsIntegration } from '../types';
import { logger } from '../../../utils/logger';
import { IntegrationError } from '../errors';

interface IntegrationStatus {
  integrationId: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  error?: string;
  metrics: {
    syncCount: number;
    errorCount: number;
    lastError?: string;
    averageSyncTime: number;
  };
}

export class IntegrationMonitor {
  private integrations: Map<string, ChmsIntegration>;
  private statuses: Map<string, IntegrationStatus>;
  private syncHistory: Map<string, any[]>;

  constructor() {
    this.integrations = new Map();
    this.statuses = new Map();
    this.syncHistory = new Map();
  }

  registerIntegration(id: string, integration: ChmsIntegration): void {
    this.integrations.set(id, integration);
    this.statuses.set(id, {
      integrationId: id,
      provider: integration.constructor.name,
      status: 'inactive',
      lastSync: new Date(),
      metrics: {
        syncCount: 0,
        errorCount: 0,
        averageSyncTime: 0,
      },
    });
    this.syncHistory.set(id, []);
  }

  async checkIntegrationStatus(id: string): Promise<IntegrationStatus> {
    const integration = this.integrations.get(id);
    if (!integration) {
      throw new Error(`Integration ${id} not found`);
    }

    try {
      const status = await integration.getIntegrationStatus();
      const currentStatus = this.statuses.get(id)!;

      this.statuses.set(id, {
        ...currentStatus,
        status: status.status,
        lastSync: status.lastSync,
        error: status.error,
      });

      return this.statuses.get(id)!;
    } catch (error) {
      logger.error(`Error checking status for integration ${id}:`, error);
      throw new IntegrationError(
        `Failed to check integration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async monitorSync(id: string, syncFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    const currentStatus = this.statuses.get(id)!;

    try {
      const result = await syncFn();
      const endTime = Date.now();
      const syncTime = endTime - startTime;

      // Update metrics
      const newSyncCount = currentStatus.metrics.syncCount + 1;
      const newAverageSyncTime =
        (currentStatus.metrics.averageSyncTime * currentStatus.metrics.syncCount + syncTime) / newSyncCount;

      this.statuses.set(id, {
        ...currentStatus,
        lastSync: new Date(),
        status: 'active',
        metrics: {
          ...currentStatus.metrics,
          syncCount: newSyncCount,
          averageSyncTime: newAverageSyncTime,
        },
      });

      // Record sync history
      this.syncHistory.get(id)!.push({
        timestamp: new Date(),
        duration: syncTime,
        success: true,
      });

      return result;
    } catch (error) {
      // Update error metrics
      this.statuses.set(id, {
        ...currentStatus,
        status: 'error',
        lastSync: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          ...currentStatus.metrics,
          errorCount: currentStatus.metrics.errorCount + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Record sync history
      this.syncHistory.get(id)!.push({
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  getIntegrationMetrics(id: string): IntegrationStatus {
    const status = this.statuses.get(id);
    if (!status) {
      throw new Error(`Integration ${id} not found`);
    }
    return status;
  }

  getSyncHistory(id: string, limit: number = 10): any[] {
    const history = this.syncHistory.get(id);
    if (!history) {
      throw new Error(`Integration ${id} not found`);
    }
    return history.slice(-limit);
  }

  async checkAllIntegrations(): Promise<IntegrationStatus[]> {
    const statuses: IntegrationStatus[] = [];
    for (const [id] of this.integrations) {
      try {
        const status = await this.checkIntegrationStatus(id);
        statuses.push(status);
      } catch (error) {
        logger.error(`Error checking status for integration ${id}:`, error);
        statuses.push({
          integrationId: id,
          provider: 'Unknown',
          status: 'error',
          lastSync: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          metrics: {
            syncCount: 0,
            errorCount: 0,
            averageSyncTime: 0,
          },
        });
      }
    }
    return statuses;
  }
} 