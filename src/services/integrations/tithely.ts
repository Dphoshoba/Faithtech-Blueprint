import axios from 'axios';
import { format } from 'date-fns';
import logger from '../utils/logger';
import { createProviderRateLimiter } from '../utils/rateLimiter';
import { Person, Group, Donation, PaginatedResponse, SyncResult } from '../../types/integration';

interface TithelyAuth {
  apiKey: string;
  organizationId: string;
}

export class TithelyProvider {
  private baseUrl = 'https://api.tithe.ly/v1';
  private auth: TithelyAuth;
  private rateLimiter;
  
  constructor(auth: TithelyAuth) {
    this.auth = auth;
    this.rateLimiter = createProviderRateLimiter('tithely');
  }
  
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.auth.apiKey}`,
      'Content-Type': 'application/json',
      'X-Organization-Id': this.auth.organizationId
    };
  }
  
  // Get all people from Tithe.ly
  async getPeople(params: any = {}): Promise<PaginatedResponse<Person>> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = this.getHeaders();
        const response = await axios.get(`${this.baseUrl}/people`, {
          headers,
          params: {
            ...params,
            page: params.page || 1,
            per_page: params.perPage || 100,
            modified_since: params.modifiedSince || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
          }
        });
        
        // Transform Tithe.ly response to standard format
        const people = response.data.data.map((person: any) => ({
          externalId: person.id,
          firstName: person.first_name,
          lastName: person.last_name,
          email: person.email,
          phone: person.phone,
          address: person.address_line_1 ? {
            street: person.address_line_1,
            street2: person.address_line_2,
            city: person.city,
            state: person.state,
            zip: person.postal_code,
            country: person.country
          } : undefined,
          status: person.status,
          groups: person.groups || [],
          customFields: {
            membershipStatus: person.membership_status,
            joinDate: person.joined_at,
            lastAttendance: person.last_attendance_at,
            notes: person.notes
          }
        }));
        
        return {
          data: people,
          count: people.length,
          hasMore: response.data.meta.total_pages > response.data.meta.current_page,
          nextPage: response.data.meta.current_page + 1
        };
      } catch (error: any) {
        logger.error('Error fetching people from Tithe.ly:', error);
        if (error.response?.status === 401) {
          throw new Error('Invalid Tithe.ly credentials');
        }
        throw new Error('Failed to fetch people from Tithe.ly');
      }
    }, 'getPeople');
  }
  
  // Get all groups from Tithe.ly
  async getGroups(params: any = {}): Promise<PaginatedResponse<Group>> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = this.getHeaders();
        const response = await axios.get(`${this.baseUrl}/groups`, {
          headers,
          params: {
            ...params,
            page: params.page || 1,
            per_page: params.perPage || 100
          }
        });
        
        // Transform Tithe.ly response to standard format
        const groups = response.data.data.map((group: any) => ({
          externalId: group.id,
          name: group.name,
          description: group.description,
          type: group.type,
          status: group.status,
          meetingDay: group.meeting_day,
          meetingTime: group.meeting_time,
          location: group.location,
          leaders: group.leaders || [],
          members: group.members || [],
          customFields: {
            category: group.category,
            maxCapacity: group.max_capacity,
            isPublic: group.is_public,
            tags: group.tags
          }
        }));
        
        return {
          data: groups,
          count: groups.length,
          hasMore: response.data.meta.total_pages > response.data.meta.current_page,
          nextPage: response.data.meta.current_page + 1
        };
      } catch (error: any) {
        logger.error('Error fetching groups from Tithe.ly:', error);
        if (error.response?.status === 401) {
          throw new Error('Invalid Tithe.ly credentials');
        }
        throw new Error('Failed to fetch groups from Tithe.ly');
      }
    }, 'getGroups');
  }
  
  // Get donations from Tithe.ly
  async getDonations(params: any = {}): Promise<PaginatedResponse<Donation>> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = this.getHeaders();
        const response = await axios.get(`${this.baseUrl}/giving/transactions`, {
          headers,
          params: {
            ...params,
            page: params.page || 1,
            per_page: params.perPage || 100,
            start_date: params.startDate || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            end_date: params.endDate || format(new Date(), 'yyyy-MM-dd')
          }
        });
        
        // Transform Tithe.ly response to standard format
        const donations = response.data.data.map((transaction: any) => ({
          externalId: transaction.id,
          date: transaction.created_at,
          amount: transaction.amount,
          method: transaction.payment_method,
          fund: transaction.fund_name,
          donor: {
            id: transaction.person_id,
            name: transaction.person_name,
            email: transaction.person_email
          },
          status: transaction.status,
          customFields: {
            frequency: transaction.frequency,
            isRecurring: transaction.is_recurring,
            coverFees: transaction.cover_fees,
            notes: transaction.notes
          }
        }));
        
        return {
          data: donations,
          count: donations.length,
          hasMore: response.data.meta.total_pages > response.data.meta.current_page,
          nextPage: response.data.meta.current_page + 1
        };
      } catch (error: any) {
        logger.error('Error fetching donations from Tithe.ly:', error);
        if (error.response?.status === 401) {
          throw new Error('Invalid Tithe.ly credentials');
        }
        throw new Error('Failed to fetch donations from Tithe.ly');
      }
    }, 'getDonations');
  }
  
  // Validate credentials
  async validateCredentials(): Promise<boolean> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = this.getHeaders();
        await axios.get(`${this.baseUrl}/organization`, {
          headers
        });
        return true;
      } catch (error) {
        throw new Error('Invalid Tithe.ly credentials');
      }
    }, 'validateCredentials');
  }
  
  // Sync data from Tithe.ly
  async sync(capabilities = ['people']): Promise<SyncResult> {
    const result: SyncResult = {
      stats: {
        people: { synced: 0, errors: 0 },
        groups: { synced: 0, errors: 0 },
        giving: { synced: 0, errors: 0 }
      },
      error: null
    };
    
    try {
      // Sync people if requested
      if (capabilities.includes('people')) {
        try {
          let hasMore = true;
          let page = 1;
          let totalSynced = 0;
          
          while (hasMore) {
            const peopleData = await this.getPeople({ page });
            totalSynced += peopleData.count;
            hasMore = peopleData.hasMore;
            page = peopleData.nextPage || page + 1;
          }
          
          result.stats.people.synced = totalSynced;
        } catch (error) {
          result.stats.people.errors = 1;
          logger.error('Error syncing people from Tithe.ly:', error);
        }
      }
      
      // Sync groups if requested
      if (capabilities.includes('groups')) {
        try {
          let hasMore = true;
          let page = 1;
          let totalSynced = 0;
          
          while (hasMore) {
            const groupsData = await this.getGroups({ page });
            totalSynced += groupsData.count;
            hasMore = groupsData.hasMore;
            page = groupsData.nextPage || page + 1;
          }
          
          result.stats.groups.synced = totalSynced;
        } catch (error) {
          result.stats.groups.errors = 1;
          logger.error('Error syncing groups from Tithe.ly:', error);
        }
      }
      
      // Sync giving if requested
      if (capabilities.includes('giving')) {
        try {
          let hasMore = true;
          let page = 1;
          let totalSynced = 0;
          
          while (hasMore) {
            const givingData = await this.getDonations({ page });
            totalSynced += givingData.count;
            hasMore = givingData.hasMore;
            page = givingData.nextPage || page + 1;
          }
          
          result.stats.giving.synced = totalSynced;
        } catch (error) {
          result.stats.giving.errors = 1;
          logger.error('Error syncing donations from Tithe.ly:', error);
        }
      }
    } catch (error: any) {
      result.error = error.message;
      logger.error('Error during Tithe.ly sync:', error);
    }
    
    return result;
  }
} 