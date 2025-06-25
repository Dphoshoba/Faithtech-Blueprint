export interface IntegrationConfig {
  apiKey: string;
  apiUrl?: string;
  options?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  count: number;
  data: any[];
  error?: string;
}

export interface ChmsIntegration {
  syncPeople(): Promise<SyncResult>;
  syncGroups(): Promise<SyncResult>;
  syncEvents(): Promise<SyncResult>;
  syncContributions(): Promise<SyncResult>;
  getIntegrationStatus(): Promise<{
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    error?: string;
  }>;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  groups?: string[];
  tags?: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members?: string[];
  leaders?: string[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
}

export interface Contribution {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  fund?: string;
  paymentMethod?: string;
}

export interface IntegrationMetrics {
  syncCount: number;
  errorCount: number;
  lastError?: string;
  averageSyncTime: number;
}

export interface IntegrationStatus {
  integrationId: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  error?: string;
  metrics: IntegrationMetrics;
} 