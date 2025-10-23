/**
 * Breeze ChMS Integration Service
 * Handles API calls and data sync with Breeze Church Management System
 */

const axios = require('axios');

class BreezeService {
  constructor(credentials) {
    this.apiKey = credentials.apiKey;
    this.subdomain = credentials.subdomain;
    this.baseURL = `https://${this.subdomain}.breezechms.com/api`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.client.get('/people');
      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get people from Breeze
   */
  async getPeople(params = {}) {
    try {
      const response = await this.client.get('/people', { params });
      
      return {
        success: true,
        data: response.data.map(person => ({
          externalId: person.id,
          firstName: person.first_name,
          lastName: person.last_name,
          email: person.email_address,
          phoneNumber: person.mobile_phone,
          status: person.status,
          source: 'breeze'
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
   * Get tags (groups) from Breeze
   */
  async getTags() {
    try {
      const response = await this.client.get('/tags');
      
      return {
        success: true,
        data: response.data.map(tag => ({
          externalId: tag.id,
          name: tag.name,
          createdOn: tag.created_on,
          source: 'breeze'
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
   * Get events from Breeze
   */
  async getEvents(params = {}) {
    try {
      const response = await this.client.get('/events', { params });
      
      return {
        success: true,
        data: response.data.map(event => ({
          externalId: event.id,
          name: event.name,
          description: event.description,
          startsOn: event.starts_on,
          endsOn: event.ends_on,
          source: 'breeze'
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
   * Sync data from Breeze
   */
  async syncData(config = {}) {
    const results = {
      people: 0,
      tags: 0,
      events: 0,
      errors: []
    };

    try {
      if (config.syncPeople) {
        const peopleResult = await this.getPeople();
        if (peopleResult.success) {
          results.people = peopleResult.data.length;
        } else {
          results.errors.push({ type: 'people', message: peopleResult.error });
        }
      }

      if (config.syncGroups) {
        const tagsResult = await this.getTags();
        if (tagsResult.success) {
          results.tags = tagsResult.data.length;
        } else {
          results.errors.push({ type: 'tags', message: tagsResult.error });
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

module.exports = BreezeService;

