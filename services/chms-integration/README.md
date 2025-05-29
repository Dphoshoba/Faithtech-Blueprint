# ChMS Integration Service

## Overview
This service provides seamless integration with popular Church Management Systems (ChMS), enabling data synchronization and unified church management capabilities.

## Supported ChMS Platforms
- Planning Church Community Builder (CCB)
- Planning Planning Center Online (PCO)
- Planning Elvanto
- Planning Breeze
- Planning Rock RMS
- Planning Ministry Platform

## Features

### Data Synchronization
- Member profiles and demographics
- Small groups and ministries
- Attendance tracking
- Event management
- Giving records
- Volunteer management

### Integration Capabilities
- Real-time data sync
- Batch processing for large datasets
- Conflict resolution
- Error handling and retry mechanisms
- Audit logging
- Data mapping and transformation

### API Endpoints
- `/api/chms/connect` - Initialize ChMS connection
- `/api/chms/sync` - Trigger data synchronization
- `/api/chms/status` - Check integration status
- `/api/chms/mapping` - Configure data field mapping
- `/api/chms/webhooks` - Handle ChMS webhooks

### Security
- OAuth2 authentication
- API key management
- Data encryption
- Rate limiting
- Access control

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Set up service architecture
- [ ] Implement authentication system
- [ ] Create database schemas
- [ ] Build basic API endpoints

### Phase 2: ChMS Connectors
- [ ] Develop CCB connector
- [ ] Develop PCO connector
- [ ] Implement data mapping system
- [ ] Create webhook handlers

### Phase 3: Data Sync Engine
- [ ] Build sync orchestrator
- [ ] Implement conflict resolution
- [ ] Add retry mechanisms
- [ ] Create audit logging

### Phase 4: Admin Interface
- [ ] Integration dashboard
- [ ] Mapping configuration UI
- [ ] Sync status monitoring
- [ ] Error management interface

## Getting Started

### Prerequisites
- Node.js >= 14
- MongoDB >= 4.4
- Redis (for caching)

### Environment Variables
```env
CHMS_SERVICE_PORT=3000
MONGODB_URI=mongodb://localhost:27017/chms
REDIS_URL=redis://localhost:6379

# ChMS API Keys
CCB_API_KEY=
PCO_API_KEY=
ELVANTO_API_KEY=
BREEZE_API_KEY=
ROCK_API_KEY=
MP_API_KEY=

# Security
JWT_SECRET=
ENCRYPTION_KEY=
```

### Installation
```bash
npm install
npm run build
npm start
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Documentation
Detailed API documentation is available at `/docs` endpoint when running the service.

## Monitoring
- Integration status dashboard
- Error tracking and alerts
- Sync performance metrics
- API usage statistics 