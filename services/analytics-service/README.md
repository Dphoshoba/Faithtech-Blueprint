# Analytics Service

A comprehensive analytics service for tracking user behavior, engagement metrics, and application performance in the FaithTech Blueprint platform.

## Features

- Event tracking and analysis
- User journey tracking
- Conversion funnel analysis
- Engagement metrics
- Performance monitoring
- Error tracking
- API usage analytics
- Real-time dashboards

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12.0
- TypeScript >= 4.5

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=analytics
DB_USER=your_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret

# API Configuration
ANALYTICS_API_KEY=your_api_key

# Logging Configuration
LOG_LEVEL=info

# Environment
NODE_ENV=development
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Create the database:
```sql
CREATE DATABASE analytics;
```

4. Run database migrations:
```bash
npm run migrate
```

## Development

Start the development server:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

## API Endpoints

### Event Collection
- `POST /api/events` - Track an event
- `POST /api/identify` - Identify a user
- `POST /api/page` - Track a page view

### KPI Metrics
- `GET /api/kpi` - Get KPI metrics
- `GET /api/conversion-rates` - Get conversion rates
- `GET /api/user-journey` - Get user journey distribution
- `GET /api/engagement` - Get engagement metrics
- `GET /api/retention` - Get retention metrics

### Feature Analytics
- `GET /api/feature-usage` - Get feature usage metrics
- `GET /api/feature-satisfaction` - Get feature satisfaction scores

### User Behavior
- `GET /api/user-paths` - Get user navigation paths
- `GET /api/session-analysis` - Get session analysis
- `GET /api/user-segments` - Get user segments

### Performance Metrics
- `GET /api/performance` - Get performance metrics
- `GET /api/errors` - Get error metrics
- `GET /api/api-usage` - Get API usage metrics

## Authentication

The service uses JWT for authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

For API key authentication, include the API key in the X-API-Key header:

```
X-API-Key: your_api_key
```

## Data Models

### Event
```typescript
interface Event {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
}
```

### User Profile
```typescript
interface UserProfile {
  userId: string;
  traits: Record<string, any>;
  updatedAt: Date;
}
```

### Page View
```typescript
interface PageView {
  page: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 
Hello everyone Hello