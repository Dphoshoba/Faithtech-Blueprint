import axios from 'axios';
import { ChmsIntegration, IntegrationConfig, SyncResult } from '../types';
import { IntegrationError, AuthenticationError, RateLimitError } from '../../errors';
import { retryWithBackoff } from '../../utils/retry';
import { logger } from '../../../../utils/logger';
import { validatePerson, validateGroup, validateEvent, validateContribution } from '../../utils/validation';

export class PlanningCenterIntegration implements ChmsIntegration {
  private appId: string;
  private secret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: IntegrationConfig) {
    this.appId = config.options?.appId || '';
    this.secret = config.options?.secret || '';
    this.baseUrl = 'https://api.planningcenteronline.com';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.planningcenteronline.com/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.appId,
        client_secret: this.secret,
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      throw new AuthenticationError('Failed to obtain Planning Center access token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    return retryWithBackoff(
      async () => {
        try {
          const token = await this.getAccessToken();
          const response = await axios({
            method,
            url: `${this.baseUrl}${endpoint}`,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            data,
          });
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              throw new AuthenticationError('Invalid Planning Center credentials');
            }
            if (error.response?.status === 429) {
              throw new RateLimitError('Planning Center API rate limit exceeded');
            }
            throw new IntegrationError(
              `Planning Center API error: ${error.response?.data?.message || error.message}`,
              error.response?.status || 500
            );
          }
          throw error;
        }
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    );
  }

  async syncPeople(): Promise<SyncResult> {
    try {
      const people = await this.makeRequest<any[]>('/people/v2/people');
      const processed = people.map(person => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.email,
        phone: person.phone,
        address: {
          street: person.address,
          city: person.city,
          state: person.state,
          zip: person.zip,
        },
        groups: person.groups || [],
        tags: person.tags || [],
      }));

      // Validate each person
      const validated = processed.map(person => {
        const validation = validatePerson(person);
        if (!validation.isValid) {
          logger.warn(`Invalid person data: ${validation.errors.join(', ')}`);
        }
        return person;
      });

      return {
        success: true,
        count: validated.length,
        data: validated,
      };
    } catch (error) {
      logger.error('Error syncing people from Planning Center:', error);
      throw new IntegrationError('Failed to sync people from Planning Center', 500);
    }
  }

  async syncGroups(): Promise<SyncResult> {
    try {
      const groups = await this.makeRequest<any[]>('/groups/v2/groups');
      const processed = groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        members: group.members || [],
        leaders: group.leaders || [],
      }));

      // Validate each group
      const validated = processed.map(group => {
        const validation = validateGroup(group);
        if (!validation.isValid) {
          logger.warn(`Invalid group data: ${validation.errors.join(', ')}`);
        }
        return group;
      });

      return {
        success: true,
        count: validated.length,
        data: validated,
      };
    } catch (error) {
      logger.error('Error syncing groups from Planning Center:', error);
      throw new IntegrationError('Failed to sync groups from Planning Center', 500);
    }
  }

  async syncEvents(): Promise<SyncResult> {
    try {
      const events = await this.makeRequest<any[]>('/calendar/v2/events');
      const processed = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: new Date(event.starts_at),
        endDate: new Date(event.ends_at),
        location: event.location,
        attendees: event.attendees || [],
      }));

      // Validate each event
      const validated = processed.map(event => {
        const validation = validateEvent(event);
        if (!validation.isValid) {
          logger.warn(`Invalid event data: ${validation.errors.join(', ')}`);
        }
        return event;
      });

      return {
        success: true,
        count: validated.length,
        data: validated,
      };
    } catch (error) {
      logger.error('Error syncing events from Planning Center:', error);
      throw new IntegrationError('Failed to sync events from Planning Center', 500);
    }
  }

  async syncContributions(): Promise<SyncResult> {
    try {
      const contributions = await this.makeRequest<any[]>('/giving/v2/contributions');
      const processed = contributions.map(contribution => ({
        id: contribution.id,
        personId: contribution.person_id,
        amount: contribution.amount,
        date: new Date(contribution.received_at),
        fund: contribution.fund,
        paymentMethod: contribution.payment_method,
      }));

      // Validate each contribution
      const validated = processed.map(contribution => {
        const validation = validateContribution(contribution);
        if (!validation.isValid) {
          logger.warn(`Invalid contribution data: ${validation.errors.join(', ')}`);
        }
        return contribution;
      });

      return {
        success: true,
        count: validated.length,
        data: validated,
      };
    } catch (error) {
      logger.error('Error syncing contributions from Planning Center:', error);
      throw new IntegrationError('Failed to sync contributions from Planning Center', 500);
    }
  }

  async getIntegrationStatus(): Promise<{
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    error?: string;
  }> {
    try {
      // Test API connection
      await this.makeRequest('/people/v2/people?limit=1');
      return {
        status: 'active',
        lastSync: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        lastSync: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
} 