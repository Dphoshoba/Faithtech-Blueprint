# FaithTech Blueprint API Documentation

## Overview

The FaithTech Blueprint API provides a comprehensive set of endpoints for managing church operations, member engagement, and administrative tasks. This documentation will guide you through the integration process and provide examples for common use cases.

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Obtaining a Token

```bash
curl -X POST https://api.faithtechblueprint.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

## API Endpoints

### Church Management

#### Create Church

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grace Community Church",
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "phone": "555-0123",
    "email": "info@gracechurch.org",
    "website": "https://gracechurch.org"
  }'
```

#### Update Church

```bash
curl -X PUT https://api.faithtechblueprint.com/api/churches/{churchId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grace Community Church Updated",
    "phone": "555-0124"
  }'
```

### Member Management

#### Add Member

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches/{churchId}/members \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-0125",
    "address": "456 Oak St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "birthDate": "1980-01-01",
    "joinDate": "2023-01-01"
  }'
```

#### Update Member

```bash
curl -X PUT https://api.faithtechblueprint.com/api/churches/{churchId}/members/{memberId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "555-0126",
    "address": "789 Pine St"
  }'
```

### Event Management

#### Create Event

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches/{churchId}/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sunday Service",
    "description": "Weekly Sunday worship service",
    "startTime": "2023-01-01T10:00:00Z",
    "endTime": "2023-01-01T12:00:00Z",
    "location": "Main Sanctuary",
    "capacity": 200,
    "registrationRequired": false
  }'
```

#### Register for Event

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches/{churchId}/events/{eventId}/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "member123",
    "guests": 2,
    "notes": "Will bring children"
  }'
```

### Giving Management

#### Record Donation

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches/{churchId}/donations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "member123",
    "amount": 100.00,
    "type": "tithe",
    "paymentMethod": "credit_card",
    "notes": "Monthly tithe"
  }'
```

#### Get Donation Report

```bash
curl -X GET https://api.faithtechblueprint.com/api/churches/{churchId}/donations/report \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "type": "tithe"
  }'
```

### Communication

#### Send Announcement

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches/{churchId}/announcements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Special Service",
    "content": "Join us this Sunday for a special service",
    "channels": ["email", "sms"],
    "targetAudience": "all"
  }'
```

#### Send Prayer Request

```bash
curl -X POST https://api.faithtechblueprint.com/api/churches/{churchId}/prayer-requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Family in Need",
    "content": "Please pray for the Smith family",
    "isPrivate": false,
    "categories": ["family", "health"]
  }'
```

## Integration Examples

### React Integration

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://api.faithtechblueprint.com';

const useChurchAPI = (token: string) => {
  const [church, setChurch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChurch = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/churches/current`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setChurch(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChurch();
  }, [token]);

  const updateChurch = async (data: any) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/churches/${church.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChurch(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return { church, loading, error, updateChurch };
};

export default useChurchAPI;
```

### Node.js Integration

```javascript
const axios = require('axios');

class FaithTechAPI {
  constructor(token) {
    this.token = token;
    this.api = axios.create({
      baseURL: 'https://api.faithtechblueprint.com',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getChurch(churchId) {
    try {
      const response = await this.api.get(`/api/churches/${churchId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createMember(churchId, memberData) {
    try {
      const response = await this.api.post(
        `/api/churches/${churchId}/members`,
        memberData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createEvent(churchId, eventData) {
    try {
      const response = await this.api.post(
        `/api/churches/${churchId}/events`,
        eventData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(
        `API Error: ${error.response.status} - ${error.response.data.message}`
      );
    }
    return error;
  }
}

module.exports = FaithTechAPI;
```

## Best Practices

1. **Error Handling**
   - Always implement proper error handling
   - Use try-catch blocks
   - Handle rate limiting
   - Implement retry logic for failed requests

2. **Security**
   - Never store tokens in client-side code
   - Use HTTPS for all requests
   - Implement token refresh logic
   - Validate all input data

3. **Performance**
   - Implement caching where appropriate
   - Use pagination for large data sets
   - Optimize request payloads
   - Monitor API usage

4. **Testing**
   - Write unit tests for API integration
   - Test error scenarios
   - Implement integration tests
   - Use mock data for development

## Rate Limits

- 100 requests per minute per IP
- 1000 requests per hour per user
- 10000 requests per day per church

## Support

For API support, please contact:
- Email: api-support@faithtechblueprint.com
- Documentation: https://docs.faithtechblueprint.com
- Status Page: https://status.faithtechblueprint.com 