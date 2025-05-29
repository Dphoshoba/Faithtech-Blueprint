# Deployment Guide

## Production Environment Setup

### System Requirements

- Node.js 18.x or higher
- Docker 24.x or higher
- Docker Compose v2.x
- 4GB RAM minimum (8GB recommended)
- 20GB storage minimum
- Linux-based OS (Ubuntu 22.04 LTS recommended)

### Infrastructure Components

1. **Application Servers**
   - Load Balancer (NGINX)
   - API Gateway
   - Microservices
   - Static File Server

2. **Database Servers**
   - Primary Database (PostgreSQL)
   - Redis Cache
   - MongoDB (Assessment Data)

3. **Supporting Services**
   - Message Queue (RabbitMQ)
   - Search Engine (Elasticsearch)
   - File Storage (S3/MinIO)
   - Monitoring Stack

## Environment Variables Configuration

### Core Application Variables

```env
# Application
NODE_ENV=production
APP_NAME=faithtech-blueprint
APP_VERSION=1.0.0
API_VERSION=v1
PORT=3000

# Security
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRY=24h
COOKIE_SECRET=your-secure-cookie-secret
CORS_ORIGINS=https://faithtech-blueprint.com,https://api.faithtech-blueprint.com

# Database
POSTGRES_HOST=db.faithtech-blueprint.com
POSTGRES_PORT=5432
POSTGRES_DB=faithtech_prod
POSTGRES_USER=faithtech_user
POSTGRES_PASSWORD=secure-db-password

# Redis Cache
REDIS_HOST=cache.faithtech-blueprint.com
REDIS_PORT=6379
REDIS_PASSWORD=secure-redis-password

# MongoDB
MONGO_URI=mongodb://user:pass@mongo.faithtech-blueprint.com:27017/faithtech_prod

# Message Queue
RABBITMQ_HOST=mq.faithtech-blueprint.com
RABBITMQ_PORT=5672
RABBITMQ_USER=faithtech_mq
RABBITMQ_PASS=secure-mq-password

# Storage
S3_BUCKET=faithtech-prod
S3_REGION=us-east-1
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key

# External Services
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

### Environment-Specific Configuration

Create separate `.env` files for different environments:
- `.env.production`
- `.env.staging`
- `.env.development`

## Docker Production Builds

### Base Docker Configuration

```dockerfile
# Base image
FROM node:18-alpine as builder

# Build arguments
ARG NODE_ENV=production
ARG APP_VERSION=1.0.0

# Environment variables
ENV NODE_ENV=${NODE_ENV}
ENV APP_VERSION=${APP_VERSION}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine

# Copy built files from builder
COPY --from=builder /app/dist /app
COPY --from=builder /app/node_modules /app/node_modules

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
```

### Docker Compose Production Setup

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - api-gateway

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    depends_on:
      - user-service
      - subscription-service

  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  subscription-service:
    build:
      context: ./services/subscription-service
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
      - rabbitmq

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --requirepass ${REDIS_PASSWORD}

  rabbitmq:
    image: rabbitmq:3-management-alpine
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    environment:
      - RABBITMQ_DEFAULT_USER=${RABBITMQ_USER}
      - RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASS}

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

## CI/CD Pipeline Setup

### GitHub Actions Workflow

```yaml
name: Production Deployment

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Run linting
        run: npm run lint
      - name: Check types
        run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: docker-compose -f docker-compose.prod.yml build
      - name: Login to Docker Hub
        run: docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
      - name: Push Docker images
        run: docker-compose -f docker-compose.prod.yml push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/faithtech-blueprint
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

## Production Deployment Checklist

1. **Pre-deployment**
   - [ ] Run full test suite
   - [ ] Check security vulnerabilities
   - [ ] Update environment variables
   - [ ] Backup database
   - [ ] Update documentation

2. **Deployment**
   - [ ] Scale down services
   - [ ] Deploy database migrations
   - [ ] Deploy new containers
   - [ ] Scale up services
   - [ ] Verify health checks

3. **Post-deployment**
   - [ ] Monitor error rates
   - [ ] Check performance metrics
   - [ ] Verify integrations
   - [ ] Test critical flows
   - [ ] Update status page

## Monitoring and Maintenance

### Health Checks

```javascript
// health-check.js
const healthCheck = {
  uptime: process.uptime(),
  message: 'OK',
  timestamp: Date.now(),
  services: {
    database: 'OK',
    redis: 'OK',
    rabbitmq: 'OK'
  }
};

app.get('/health', (req, res) => {
  res.json(healthCheck);
});
```

### Logging Configuration

```javascript
// logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'faithtech-blueprint' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Rollback Procedures

1. **Quick Rollback**
   ```bash
   # Revert to previous version
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml pull
   docker tag faithtech/app:latest faithtech/app:rollback
   docker tag faithtech/app:previous faithtech/app:latest
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME backup.sql
   ```

## Security Considerations

1. **SSL/TLS Configuration**
   - Use Let's Encrypt for SSL certificates
   - Configure HTTPS redirects
   - Set up HSTS headers
   - Enable HTTP/2

2. **Firewall Rules**
   - Restrict access to admin panels
   - Configure rate limiting
   - Set up IP whitelisting
   - Enable DDoS protection

3. **Secrets Management**
   - Use environment variables
   - Implement vault service
   - Rotate credentials regularly
   - Monitor access logs

## Support and Troubleshooting

### Common Issues

1. **Container Issues**
   ```bash
   # Check container logs
   docker logs container_name
   
   # Check container status
   docker ps -a
   ```

2. **Database Issues**
   ```bash
   # Check database connections
   pg_isready -h $DB_HOST -p $DB_PORT
   
   # Monitor active connections
   SELECT * FROM pg_stat_activity;
   ```

### Contact Information

- DevOps Team: devops@faithtech-blueprint.com
- Emergency Support: +1-800-FAITH-TECH
- Status Page: status.faithtech-blueprint.com 