/**
 * Planning Center Online Integration Service
 * Handles OAuth, data sync, and API calls to Planning Center
 */

const axios = require('axios');

const PLANNING_CENTER_API = 'https://api.planningcenteronline.com';

class PlanningCenterService {
  constructor(credentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: PLANNING_CENTER_API,
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.client.get('/people/v2/me');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get people from Planning Center
   */
  async getPeople(params = {}) {
    try {
      const { limit = 100, offset = 0 } = params;
      const response = await this.client.get('/people/v2/people', {
        params: {
          per_page: limit,
          offset
        }
      });
      
      return {
        success: true,
        data: response.data.data.map(person => ({
          externalId: person.id,
          firstName: person.attributes.first_name,
          lastName: person.attributes.last_name,
          email: person.attributes.email,
          phoneNumber: person.attributes.phone_number,
          source: 'planning-center'
        })),
        meta: response.data.meta
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get groups/small groups
   */
  async getGroups(params = {}) {
    try {
      const response = await this.client.get('/groups/v2/groups', { params });
      
      return {
        success: true,
        data: response.data.data.map(group => ({
          externalId: group.id,
          name: group.attributes.name,
          description: group.attributes.description,
          memberCount: group.attributes.members_count,
          source: 'planning-center'
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get events/check-ins
   */
  async getEvents(params = {}) {
    try {
      const response = await this.client.get('/check-ins/v2/events', { params });
      
      return {
        success: true,
        data: response.data.data.map(event => ({
          externalId: event.id,
          name: event.attributes.name,
          startsAt: event.attributes.starts_at,
          endsAt: event.attributes.ends_at,
          source: 'planning-center'
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync data from Planning Center to our system
   */
  async syncData(config = {}) {
    const results = {
      people: 0,
      groups: 0,
      events: 0,
      errors: []
    };

    try {
      if (config.syncPeople) {
        const peopleResult = await this.getPeople();
        if (peopleResult.success) {
          results.people = peopleResult.data.length;
          // In production, this would save to database
        } else {
          results.errors.push({ type: 'people', message: peopleResult.error });
        }
      }

      if (config.syncGroups) {
        const groupsResult = await this.getGroups();
        if (groupsResult.success) {
          results.groups = groupsResult.data.length;
        } else {
          results.errors.push({ type: 'groups', message: groupsResult.error });
        }
      }

      if (config.syncEvents) {
        const eventsResult = await this.getEvents();
        if (eventsResult.success) {
          results.events = eventsResult.data.length;
        } else {
          results.errors.push({ type: 'events', message: eventsResult.error });
        }
      }

      return {
        success: results.errors.length === 0,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }
}

/**
 * Get OAuth authorization URL
 */
const getAuthorizationURL = (clientId, redirectUri, state) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'people groups check-ins',
    state: state
  });
  
  return `${PLANNING_CENTER_API}/oauth/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
const exchangeCodeForToken = async (code, clientId, clientSecret, redirectUri) => {
  try {
    const response = await axios.post(`${PLANNING_CENTER_API}/oauth/token`, {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });
    
    return {
      success: true,
      credentials: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        scope: response.data.scope
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken, clientId, clientSecret) => {
  try {
    const response = await axios.post(`${PLANNING_CENTER_API}/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    });
    
    return {
      success: true,
      credentials: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  PlanningCenterService,
  getAuthorizationURL,
  exchangeCodeForToken,
  refreshAccessToken
};

