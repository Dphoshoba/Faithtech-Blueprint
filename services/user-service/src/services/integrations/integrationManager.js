/**
 * Integration Manager
 * Coordinates all CHMS integrations and data sync
 */

const Integration = require('../../models/Integration');
const { PlanningCenterService } = require('./planningCenterService');
const BreezeService = require('./breezeService');
const CCBService = require('./ccbService');

/**
 * Get appropriate service based on provider
 */
const getService = (integration) => {
  switch (integration.provider) {
    case 'planning-center':
      return new PlanningCenterService(integration.credentials);
    case 'breeze':
      return new BreezeService({
        apiKey: integration.apiKey,
        subdomain: integration.subdomain
      });
    case 'ccb':
      return new CCBService({
        apiKey: integration.apiKey,
        apiSecret: integration.apiSecret,
        subdomain: integration.subdomain
      });
    default:
      throw new Error(`Unsupported provider: ${integration.provider}`);
  }
};

/**
 * Test integration connection
 */
const testIntegration = async (integrationId) => {
  try {
    const integration = await Integration.findById(integrationId);
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    const service = getService(integration);
    const result = await service.testConnection();

    if (result.success) {
      integration.status = 'active';
    } else {
      integration.status = 'error';
      integration.stats.errors.push({
        message: result.error || 'Connection test failed',
        timestamp: new Date()
      });
    }

    await integration.save();
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Sync integration data
 */
const syncIntegration = async (integrationId) => {
  try {
    const integration = await Integration.findById(integrationId);
    
    if (!integration) {
      throw new Error('Integration not found');
    }

    if (!integration.syncConfig.enabled) {
      return {
        success: false,
        message: 'Sync is not enabled for this integration'
      };
    }

    const service = getService(integration);
    const result = await service.syncData(integration.syncConfig);

    // Update integration stats
    integration.syncConfig.lastSyncAt = new Date();
    integration.stats.totalSyncs += 1;

    if (result.success) {
      integration.stats.lastSyncStatus = 'success';
      integration.stats.recordsSynced = 
        (result.results.people || 0) +
        (result.results.groups || 0) +
        (result.results.events || 0);
    } else {
      integration.stats.lastSyncStatus = result.results.errors.length > 0 ? 'partial' : 'failed';
      result.results.errors.forEach(err => {
        integration.stats.errors.push({
          message: `${err.type}: ${err.message}`,
          timestamp: new Date()
        });
      });
    }

    // Calculate next sync time
    const now = new Date();
    switch (integration.syncConfig.frequency) {
      case 'hourly':
        integration.syncConfig.nextSyncAt = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'daily':
        integration.syncConfig.nextSyncAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        integration.syncConfig.nextSyncAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        integration.syncConfig.nextSyncAt = null;
    }

    await integration.save();
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Run automatic sync for all due integrations
 */
const runScheduledSyncs = async () => {
  try {
    const dueIntegrations = await Integration.findDueForSync();
    
    console.log(`🔄 Found ${dueIntegrations.length} integrations due for sync`);
    
    const results = [];
    
    for (const integration of dueIntegrations) {
      try {
        const result = await syncIntegration(integration._id);
        results.push({
          integrationId: integration._id,
          provider: integration.provider,
          success: result.success,
          recordsSynced: integration.stats.recordsSynced
        });
      } catch (error) {
        console.error(`Error syncing integration ${integration._id}:`, error);
        results.push({
          integrationId: integration._id,
          provider: integration.provider,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      totalProcessed: results.length,
      results
    };
  } catch (error) {
    console.error('Error running scheduled syncs:', error);
    throw error;
  }
};

/**
 * Get integration statistics
 */
const getIntegrationStats = async (userId) => {
  try {
    const integrations = await Integration.find({ user: userId, active: true });
    
    const stats = {
      total: integrations.length,
      active: integrations.filter(i => i.status === 'active').length,
      byProvider: {},
      totalSyncs: 0,
      totalRecordsSynced: 0,
      lastSyncAt: null,
      errors: []
    };

    integrations.forEach(integration => {
      const provider = integration.provider;
      
      if (!stats.byProvider[provider]) {
        stats.byProvider[provider] = {
          count: 0,
          status: integration.status,
          lastSync: integration.syncConfig.lastSyncAt
        };
      }
      
      stats.byProvider[provider].count += 1;
      stats.totalSyncs += integration.stats.totalSyncs;
      stats.totalRecordsSynced += integration.stats.recordsSynced || 0;
      
      if (integration.syncConfig.lastSyncAt && 
          (!stats.lastSyncAt || integration.syncConfig.lastSyncAt > stats.lastSyncAt)) {
        stats.lastSyncAt = integration.syncConfig.lastSyncAt;
      }
      
      // Collect recent errors
      const recentErrors = integration.stats.errors
        .filter(e => !e.resolved)
        .slice(-3);
      stats.errors.push(...recentErrors);
    });

    return stats;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getService,
  testIntegration,
  syncIntegration,
  runScheduledSyncs,
  getIntegrationStats
};

