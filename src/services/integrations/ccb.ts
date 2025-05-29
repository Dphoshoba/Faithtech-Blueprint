import axios from 'axios';
import { format } from 'date-fns';
import { encrypt, decrypt } from '../utils/encryption';
import logger from '../utils/logger';
import { createProviderRateLimiter } from '../utils/rateLimiter';
import { Person, Group, Donation, PaginatedResponse, SyncResult } from '../../types/integration';

interface CCBAuth {
  churchCode: string;
  username: string;
  password: string;
}

export class CCBProvider {
  private baseUrl: string;
  private auth: CCBAuth;
  private rateLimiter;
  
  constructor(auth: CCBAuth) {
    this.auth = auth;
    this.baseUrl = `https://${auth.churchCode}.ccbchurch.com/api.php`;
    this.rateLimiter = createProviderRateLimiter('ccb');
  }
  
  private async getHeaders() {
    const encoded = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
    return {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
  
  // Get all individuals from CCB
  async getPeople(params: any = {}): Promise<PaginatedResponse<Person>> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = await this.getHeaders();
        const response = await axios.get(`${this.baseUrl}`, {
          headers,
          params: {
            ...params,
            srv: 'individual_profiles',
            modified_since: params.modifiedSince || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          }
        });
        
        // Transform CCB response to standard format
        const people = response.data.response.individuals.map((individual: any) => ({
          externalId: individual.id,
          firstName: individual.first_name,
          lastName: individual.last_name,
          email: individual.email,
          phone: individual.mobile_phone || individual.home_phone,
          address: individual.street_address ? {
            street: individual.street_address,
            city: individual.city,
            state: individual.state,
            zip: individual.zip
          } : undefined,
          status: individual.membership_status,
          campus: individual.campus,
          groups: individual.groups?.group?.map((g: any) => g.id) || [],
          customFields: {
            maritalStatus: individual.marital_status,
            joinDate: individual.membership_date,
            birthDate: individual.birth_date
          }
        }));
        
        return {
          data: people,
          count: people.length,
          hasMore: false // CCB returns all results in one call
        };
      } catch (error: any) {
        logger.error('Error fetching people from CCB:', error);
        if (error.response?.status === 401) {
          throw new Error('Invalid CCB credentials');
        }
        throw new Error('Failed to fetch people from CCB');
      }
    }, 'getPeople');
  }
  
  // Get all groups from CCB
  async getGroups(params: any = {}): Promise<PaginatedResponse<Group>> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = await this.getHeaders();
        const response = await axios.get(`${this.baseUrl}`, {
          headers,
          params: {
            ...params,
            srv: 'group_profiles',
            modified_since: params.modifiedSince || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          }
        });
        
        // Transform CCB response to standard format
        const groups = response.data.response.groups.map((group: any) => ({
          externalId: group.id,
          name: group.name,
          description: group.description,
          type: group.group_type,
          status: group.status,
          meetingDay: group.meeting_day,
          meetingTime: group.meeting_time,
          location: group.meeting_location,
          leaders: group.leaders?.leader?.map((l: any) => l.id) || [],
          members: group.members?.member?.map((m: any) => m.id) || [],
          customFields: {
            department: group.department,
            campus: group.campus,
            capacity: group.capacity
          }
        }));
        
        return {
          data: groups,
          count: groups.length,
          hasMore: false
        };
      } catch (error: any) {
        logger.error('Error fetching groups from CCB:', error);
        if (error.response?.status === 401) {
          throw new Error('Invalid CCB credentials');
        }
        throw new Error('Failed to fetch groups from CCB');
      }
    }, 'getGroups');
  }
  
  // Get donations from CCB
  async getDonations(params: any = {}): Promise<PaginatedResponse<Donation>> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = await this.getHeaders();
        const response = await axios.get(`${this.baseUrl}`, {
          headers,
          params: {
            ...params,
            srv: 'transaction_detail_search',
            start_date: params.startDate || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            end_date: params.endDate || format(new Date(), 'yyyy-MM-dd')
          }
        });
        
        // Transform CCB response to standard format
        const donations = response.data.response.transactions.map((transaction: any) => ({
          externalId: transaction.id,
          date: transaction.date,
          amount: parseFloat(transaction.amount),
          method: transaction.payment_method,
          fund: transaction.fund_name,
          donor: {
            id: transaction.individual_id,
            name: `${transaction.first_name} ${transaction.last_name}`
          },
          status: transaction.status,
          customFields: {
            campus: transaction.campus,
            batchId: transaction.batch_id,
            taxDeductible: transaction.tax_deductible === 'true'
          }
        }));
        
        return {
          data: donations,
          count: donations.length,
          hasMore: false
        };
      } catch (error: any) {
        logger.error('Error fetching donations from CCB:', error);
        if (error.response?.status === 401) {
          throw new Error('Invalid CCB credentials');
        }
        throw new Error('Failed to fetch donations from CCB');
      }
    }, 'getDonations');
  }
  
  // Validate credentials
  async validateCredentials(): Promise<boolean> {
    return this.rateLimiter.execute(async () => {
      try {
        const headers = await this.getHeaders();
        await axios.get(`${this.baseUrl}`, {
          headers,
          params: { srv: 'church_info' }
        });
        return true;
      } catch (error) {
        throw new Error('Invalid CCB credentials');
      }
    }, 'validateCredentials');
  }
  
  // Sync data from CCB
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
          const peopleData = await this.getPeople();
          result.stats.people.synced = peopleData.count;
        } catch (error) {
          result.stats.people.errors = 1;
          logger.error('Error syncing people from CCB:', error);
        }
      }
      
      // Sync groups if requested
      if (capabilities.includes('groups')) {
        try {
          const groupsData = await this.getGroups();
          result.stats.groups.synced = groupsData.count;
        } catch (error) {
          result.stats.groups.errors = 1;
          logger.error('Error syncing groups from CCB:', error);
        }
      }
      
      // Sync giving if requested
      if (capabilities.includes('giving')) {
        try {
          const givingData = await this.getDonations();
          result.stats.giving.synced = givingData.count;
        } catch (error) {
          result.stats.giving.errors = 1;
          logger.error('Error syncing donations from CCB:', error);
        }
      }
    } catch (error: any) {
      result.error = error.message;
      logger.error('Error during CCB sync:', error);
    }
    
    return result;
  }
} 