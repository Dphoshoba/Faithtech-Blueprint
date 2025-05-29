export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  capabilities: string[];
  minimumTier: 'basic' | 'pro' | 'enterprise';
  authType: 'oauth' | 'apikey' | 'credentials';
  documentationUrl: string;
}

export const integrationProviders: IntegrationProvider[] = [
  {
    id: 'planning_center',
    name: 'Planning Center',
    description: 'Connect with Planning Center People, Groups, and Giving',
    logoUrl: '/assets/integrations/planning-center.png',
    capabilities: ['people', 'groups', 'giving', 'events'],
    minimumTier: 'basic',
    authType: 'oauth',
    documentationUrl: 'https://developer.planning.center/'
  },
  {
    id: 'ccb',
    name: 'Church Community Builder',
    description: 'Sync with CCB for comprehensive church management',
    logoUrl: '/assets/integrations/ccb.png',
    capabilities: ['people', 'groups', 'giving', 'attendance'],
    minimumTier: 'pro',
    authType: 'credentials',
    documentationUrl: 'https://churchcommunitybuilder.com/api-docs'
  },
  {
    id: 'elvanto',
    name: 'Elvanto / Tithe.ly ChMS',
    description: 'Connect your Tithe.ly ChMS account',
    logoUrl: '/assets/integrations/tithely.png',
    capabilities: ['people', 'groups', 'giving'],
    minimumTier: 'basic',
    authType: 'apikey',
    documentationUrl: 'https://tithelydev.docs.apiary.io/'
  },
  {
    id: 'breeze',
    name: 'Breeze ChMS',
    description: 'Integrate with Breeze ChMS for people and giving data',
    logoUrl: '/assets/integrations/breeze.png',
    capabilities: ['people', 'giving'],
    minimumTier: 'basic',
    authType: 'apikey',
    documentationUrl: 'https://app.breezechms.com/api'
  }
]; 