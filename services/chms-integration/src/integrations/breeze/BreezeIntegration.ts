import axios from 'axios';
import { ChmsIntegration, IntegrationConfig, SyncResult } from '../../types';
import { IntegrationError, AuthenticationError, RateLimitError } from '../../errors';
import { retryWithBackoff } from '../../utils/retry';
import { logger } from '../../../../utils/logger';
import { validatePerson, validateGroup, validateEvent, validateContribution } from '../../utils/validation';
import { transformPerson, transformGroup, transformEvent, transformContribution } from '../../utils/validation';

export class BreezeIntegration implements ChmsIntegration {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: IntegrationConfig) {
    this.apiUrl = config.apiUrl || 'https://api.breezechms.com/api';
    this.apiKey = config.options?.apiKey || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    return retryWithBackoff(
      async () => {
        try {
          const response = await axios({
            method,
            url: `${this.apiUrl}${endpoint}`,
            headers: {
              'Api-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            data,
          });
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
              throw new AuthenticationError('Invalid Breeze API key');
            }
            if (error.response?.status === 429) {
              throw new RateLimitError('Breeze API rate limit exceeded');
            }
            throw new IntegrationError(
              `Breeze API error: ${error.response?.data?.message || error.message}`,
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
      const people = await this.makeRequest<any[]>('/people');
      const processed = people.map(person => transformPerson({
        id: person.id,
        first_name: person.first_name,
        last_name: person.last_name,
        email: person.email,
        phone: person.phone,
        address: {
          street: person.address,
          city: person.city,
          state: person.state,
          zip: person.zip,
        },
        groups: person.groups,
        tags: person.tags,
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
      logger.error('Error syncing people from Breeze:', error);
      throw new IntegrationError('Failed to sync people from Breeze', 500);
    }
  }

  async syncGroups(): Promise<SyncResult> {
    try {
      const groups = await this.makeRequest<any[]>('/groups');
      const processed = groups.map(group => transformGroup({
        id: group.id,
        name: group.name,
        description: group.description,
        members: group.members,
        leaders: group.leaders,
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
      logger.error('Error syncing groups from Breeze:', error);
      throw new IntegrationError('Failed to sync groups from Breeze', 500);
    }
  }

  async syncEvents(): Promise<SyncResult> {
    try {
      const events = await this.makeRequest<any[]>('/events');
      const processed = events.map(event => transformEvent({
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        attendees: event.attendees,
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
      logger.error('Error syncing events from Breeze:', error);
      throw new IntegrationError('Failed to sync events from Breeze', 500);
    }
  }

  async syncContributions(): Promise<SyncResult> {
    try {
      const contributions = await this.makeRequest<any[]>('/contributions');
      const processed = contributions.map(contribution => transformContribution({
        id: contribution.id,
        person_id: contribution.person_id,
        amount: contribution.amount,
        date: contribution.date,
        fund: contribution.fund,
        payment_method: contribution.payment_method,
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
      logger.error('Error syncing contributions from Breeze:', error);
      throw new IntegrationError('Failed to sync contributions from Breeze', 500);
    }
  }

  async getIntegrationStatus(): Promise<{
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    error?: string;
  }> {
    try {
      // Test API connection
      await this.makeRequest('/people?limit=1');
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