export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Person {
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  status: string;
  campus?: string;
  groups: string[];
  customFields: Record<string, any>;
}

export interface Group {
  externalId: string;
  name: string;
  description: string;
  type: string;
  status: string;
  meetingDay?: string;
  meetingTime?: string;
  location?: string;
  leaders: string[];
  members: string[];
  customFields: Record<string, any>;
}

export interface Donor {
  id: string;
  name: string;
  email?: string;
}

export interface Donation {
  externalId: string;
  date: string;
  amount: number;
  method: string;
  fund: string;
  donor: Donor;
  status: string;
  customFields: Record<string, any>;
}

export interface SyncStats {
  synced: number;
  errors: number;
}

export interface SyncResult {
  stats: {
    people: SyncStats;
    groups: SyncStats;
    giving: SyncStats;
  };
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextPage?: number;
}

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

export interface IntegrationAuth {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  churchCode?: string;
  username?: string;
  password?: string;
  organizationId?: string;
}

export interface Integration {
  _id: string;
  organizationId: string;
  providerId: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  authData: IntegrationAuth;
  lastSyncDate?: Date;
  syncError?: string;
  syncStats?: {
    people: SyncStats;
    groups: SyncStats;
    giving: SyncStats;
  };
  settings: {
    syncSchedule: 'daily' | 'weekly' | 'monthly' | 'manual';
    syncCapabilities: string[];
  };
  createdAt: Date;
  updatedAt: Date;
} 