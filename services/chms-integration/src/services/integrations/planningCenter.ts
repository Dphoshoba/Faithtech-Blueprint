import axios from 'axios';

interface PlanningCenterAuth {
  accessToken?: string;
  applicationId?: string;
  secret?: string;
}

export class PlanningCenterProvider {
  private baseUrl = 'https://api.planningcenteronline.com';
  private auth: PlanningCenterAuth;
  
  constructor(auth: PlanningCenterAuth) {
    this.auth = auth;
  }
  
  private async getHeaders() {
    if (this.auth.accessToken) {
      return {
        'Authorization': `Bearer ${this.auth.accessToken}`
      };
    } else if (this.auth.applicationId && this.auth.secret) {
      const encoded = Buffer.from(`${this.auth.applicationId}:${this.auth.secret}`).toString('base64');
      return {
        'Authorization': `Basic ${encoded}`
      };
    } else {
      throw new Error('Invalid authentication credentials');
    }
  }
  
  // Get all people from Planning Center People
  async getPeople(params: any = {}) {
    const headers = await this.getHeaders();
    const response = await axios.get(`${this.baseUrl}/people/v2/people`, {
      headers,
      params: { ...params, per_page: 100 }
    });
    
    return response.data;
  }
  
  // Get all groups from Planning Center Groups
  async getGroups(params: any = {}) {
    const headers = await this.getHeaders();
    const response = await axios.get(`${this.baseUrl}/groups/v2/groups`, {
      headers,
      params: { ...params, per_page: 100 }
    });
    
    return response.data;
  }
  
  // Get donations from Planning Center Giving
  async getDonations(params: any = {}) {
    const headers = await this.getHeaders();
    const response = await axios.get(`${this.baseUrl}/giving/v2/donations`, {
      headers,
      params: { ...params, per_page: 100 }
    });
    
    return response.data;
  }
  
  // Validate credentials
  async validateCredentials() {
    try {
      const headers = await this.getHeaders();
      await axios.get(`${this.baseUrl}/people/v2/me`, { headers });
      return true;
    } catch (error) {
      throw new Error('Invalid Planning Center credentials');
    }
  }
  
  // Sync data from Planning Center
  async sync(capabilities = ['people']) {
    const result = {
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
          
          // Process people data here (save to database, etc.)
          // For each person, create or update in local database
          
          result.stats.people.synced = peopleData.data.length;
        } catch (error) {
          result.stats.people.errors = 1;
          throw error;
        }
      }
      
      // Sync groups if requested
      if (capabilities.includes('groups')) {
        try {
          const groupsData = await this.getGroups();
          
          // Process groups data here
          
          result.stats.groups.synced = groupsData.data.length;
        } catch (error) {
          result.stats.groups.errors = 1;
          throw error;
        }
      }
      
      // Sync giving if requested
      if (capabilities.includes('giving')) {
        try {
          const givingData = await this.getDonations();
          
          // Process giving data here
          
          result.stats.giving.synced = givingData.data.length;
        } catch (error) {
          result.stats.giving.errors = 1;
          throw error;
        }
      }
    } catch (error) {
      result.error = error.message;
    }
    
    return result;
  }
} 