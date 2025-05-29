import Integration from '../models/integration.model';
import { PlanningCenterProvider } from './integrations/planningCenter';
import { CCBProvider } from './integrations/ccb';
import { TithelyProvider } from './integrations/tithely';
import { BreezeProvider } from './integrations/breeze';
import { encryptData, decryptData } from '../utils/encryption';
import logger from '../utils/logger';

export class IntegrationService {
  static getProviderInstance(integration: any) {
    const { providerId, authData } = integration;
    
    // Decrypt auth data
    const decryptedAuth = this.decryptAuthData(authData);
    
    switch(providerId) {
      case 'planning_center':
        return new PlanningCenterProvider(decryptedAuth);
      case 'ccb':
        return new CCBProvider(decryptedAuth);
      case 'elvanto':
        return new TithelyProvider(decryptedAuth);
      case 'breeze':
        return new BreezeProvider(decryptedAuth);
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }
  
  static async getIntegration(organizationId: string, providerId: string) {
    return Integration.findOne({ organizationId, providerId });
  }
  
  static async listIntegrations(organizationId: string) {
    return Integration.find({ organizationId });
  }
  
  static encryptAuthData(authData: any) {
    return encryptData(JSON.stringify(authData));
  }
  
  static decryptAuthData(encryptedData: string) {
    const decrypted = decryptData(encryptedData);
    return JSON.parse(decrypted);
  }
  
  static async connectIntegration(organizationId: string, providerId: string, authData: any) {
    try {
      // Check if integration already exists
      const existingIntegration = await this.getIntegration(organizationId, providerId);
      if (existingIntegration) {
        throw new Error('Integration already exists for this organization');
      }
      
      // Create provider instance to validate credentials
      const provider = this.getProviderInstance({
        providerId,
        authData: this.encryptAuthData(authData)
      });
      
      // Validate credentials
      await provider.validateCredentials();
      
      // Create new integration
      const integration = await Integration.create({
        organizationId,
        providerId,
        authData: this.encryptAuthData(authData),
        status: 'connected'
      });
      
      return integration;
    } catch (error) {
      logger.error('Error connecting integration:', error);
      throw error;
    }
  }
  
  static async disconnectIntegration(integrationId: string) {
    try {
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      integration.status = 'disconnected';
      await integration.save();
      
      return integration;
    } catch (error) {
      logger.error('Error disconnecting integration:', error);
      throw error;
    }
  }
  
  static async triggerSync(integration: any, capabilities = ['people', 'groups']) {
    try {
      // Update status to syncing
      await Integration.updateOne(
        { _id: integration._id },
        { status: 'syncing' }
      );
      
      // Get provider instance
      const provider = this.getProviderInstance(integration);
      
      // Run sync
      const result = await provider.sync(capabilities);
      
      // Update integration with sync results
      await Integration.updateOne(
        { _id: integration._id },
        { 
          status: 'connected',
          lastSyncDate: new Date(),
          syncStats: result.stats,
          syncError: result.error || null
        }
      );
      
      return result;
    } catch (error) {
      // Update integration with error
      await Integration.updateOne(
        { _id: integration._id },
        { 
          status: 'error',
          syncError: error.message
        }
      );
      
      logger.error('Error syncing integration:', error);
      throw error;
    }
  }
  
  static async scheduleSyncJobs() {
    try {
      // Get all active integrations
      const integrations = await Integration.find({
        status: 'connected',
        'settings.syncSchedule': { $ne: 'manual' }
      });
      
      // Schedule sync jobs based on integration settings
      for (const integration of integrations) {
        const schedule = integration.settings.syncSchedule;
        const capabilities = integration.settings.syncCapabilities;
        
        // TODO: Implement job scheduling based on schedule type
        switch (schedule) {
          case 'daily':
            // Schedule daily job
            break;
          case 'weekly':
            // Schedule weekly job
            break;
          case 'monthly':
            // Schedule monthly job
            break;
        }
      }
    } catch (error) {
      logger.error('Error scheduling sync jobs:', error);
      throw error;
    }
  }
} 