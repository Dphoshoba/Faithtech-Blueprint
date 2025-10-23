# 🚀 FaithTech Blueprint Deployment Guide

## 📋 **Prerequisites**

### System Requirements
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher
- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher
- **Git**: 2.30 or higher

### Cloud Requirements
- **AWS Account** (for production)
- **Domain name** (optional)
- **SSL Certificate** (Let's Encrypt or AWS Certificate Manager)

---

## 🏗️ **Development Deployment**

### 1. Clone Repository
```bash
git clone https://github.com/yourorg/faithtech-blueprint.git
cd faithtech-blueprint
```

### 2. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp client/.env.example client/.env

# Edit environment variables
nano .env
nano client/.env
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install service dependencies
cd services/user-service && npm install && cd ../..
cd services/assessment-service && npm install && cd ../..
cd services/template-service && npm install && cd ../..
```

### 4. Database Setup
```bash
# Start MongoDB (if using Docker)
docker-compose up -d mongodb

# Or start local MongoDB
brew services start mongodb-community

# Run database seeds
cd services/user-service
node src/seeds/index.js
cd ../..
```

### 5. Start Services
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start services individually
npm run services:user &
npm run services:assessment &
npm run services:template &
npm run client:dev &
```

### 6. Verify Deployment
```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3005/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Check frontend
open http://localhost:3000
```

---

## 🐳 **Docker Deployment**

### 1. Build Images
```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build user-service
```

### 2. Production Configuration
```bash
# Copy production environment
cp .env.production.example .env.production

# Edit production variables
nano .env.production
```

### 3. Deploy with Docker Compose
```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 4. Database Migration
```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec user-service node src/scripts/migrate.js

# Seed initial data
docker-compose -f docker-compose.prod.yml exec user-service node src/seeds/index.js
```

---

## ☁️ **AWS Production Deployment**

### 1. Infrastructure Setup

#### Create ECS Cluster
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name faithtech-blueprint

# Create task definitions
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/user-service.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/assessment-service.json
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/template-service.json
```

#### Create RDS Instance
```bash
# Create MongoDB Atlas cluster or RDS instance
aws rds create-db-instance \
  --db-instance-identifier faithtech-blueprint-db \
  --db-instance-class db.t3.micro \
  --engine mongodb \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20
```

### 2. Application Load Balancer
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name faithtech-blueprint-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create target groups
aws elbv2 create-target-group \
  --name faithtech-blueprint-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345
```

### 3. ECS Service Deployment
```bash
# Create ECS services
aws ecs create-service \
  --cluster faithtech-blueprint \
  --service-name user-service \
  --task-definition user-service:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/faithtech-blueprint-tg/1234567890123456,containerName=user-service,containerPort=3005

# Repeat for other services
```

### 4. Auto Scaling
```bash
# Create auto scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name faithtech-blueprint-asg \
  --launch-template LaunchTemplateName=faithtech-blueprint-lt,Version=1 \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/faithtech-blueprint-tg/1234567890123456
```

---

## 🔐 **Security Configuration**

### 1. SSL/TLS Setup
```bash
# Using Let's Encrypt
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Using AWS Certificate Manager
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS
```

### 2. Security Groups
```bash
# Create security group for web tier
aws ec2 create-security-group \
  --group-name faithtech-blueprint-web \
  --description "Web tier security group"

# Allow HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### 3. Environment Variables
```bash
# Set production environment variables
export NODE_ENV=production
export JWT_SECRET=your-super-secure-jwt-secret
export MONGODB_URI=mongodb://username:password@your-cluster.mongodb.net/faithtech-blueprint
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

---

## 📊 **Monitoring Setup**

### 1. CloudWatch Configuration
```bash
# Create CloudWatch log groups
aws logs create-log-group --log-group-name /ecs/faithtech-blueprint/user-service
aws logs create-log-group --log-group-name /ecs/faithtech-blueprint/assessment-service
aws logs create-log-group --log-group-name /ecs/faithtech-blueprint/template-service
```

### 2. Application Monitoring
```bash
# Install New Relic (optional)
npm install newrelic

# Configure New Relic
cp newrelic.js.example newrelic.js
# Edit newrelic.js with your license key
```

### 3. Health Checks
```bash
# Create health check endpoint
curl -f http://yourdomain.com/health || exit 1

# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "High CPU Usage" \
  --alarm-description "Alert when CPU usage is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔄 **CI/CD Pipeline**

### 1. GitHub Actions Setup
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster faithtech-blueprint \
            --service user-service \
            --force-new-deployment
```

### 2. Environment Secrets
```bash
# Set GitHub secrets
gh secret set AWS_ACCESS_KEY_ID --body "your-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret-key"
gh secret set MONGODB_URI --body "your-mongodb-uri"
gh secret set JWT_SECRET --body "your-jwt-secret"
```

---

## 📈 **Performance Optimization**

### 1. CDN Setup
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### 2. Database Optimization
```bash
# Create database indexes
mongo your-database
db.users.createIndex({ "email": 1 })
db.assessments.createIndex({ "organization": 1, "status": 1 })
db.templates.createIndex({ "category": 1, "status": 1 })
```

### 3. Caching Setup
```bash
# Install Redis for caching
docker run -d --name redis -p 6379:6379 redis:alpine

# Configure Redis in application
export REDIS_URL=redis://localhost:6379
```

---

## 🔧 **Maintenance**

### 1. Database Backups
```bash
# Create backup script
#!/bin/bash
mongodump --uri="mongodb://username:password@your-cluster.mongodb.net/faithtech-blueprint" \
  --out /backups/$(date +%Y%m%d_%H%M%S)

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### 2. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/faithtech-blueprint

# Add configuration
/var/log/faithtech-blueprint/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 3. Updates and Patches
```bash
# Update dependencies
npm audit fix
npm update

# Rebuild and redeploy
docker-compose build
docker-compose up -d
```

---

## 🚨 **Troubleshooting**

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check environment variables
docker-compose exec service-name env

# Restart service
docker-compose restart service-name
```

#### 2. Database Connection Issues
```bash
# Test database connection
docker-compose exec user-service node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Connection failed:', err));
"
```

#### 3. Performance Issues
```bash
# Check resource usage
docker stats

# Check database performance
mongo your-database
db.users.explain().find({}).limit(1)
```

### Health Check Endpoints
- **API Gateway**: `GET /health`
- **User Service**: `GET /health`
- **Assessment Service**: `GET /health`
- **Template Service**: `GET /health`

### Monitoring Commands
```bash
# Check service status
curl http://localhost:3000/health

# Check database status
mongo your-database --eval "db.stats()"

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## 📞 **Support**

### Emergency Contacts
- **Technical Lead**: tech-lead@faithtech-blueprint.com
- **DevOps Engineer**: devops@faithtech-blueprint.com
- **Database Admin**: dba@faithtech-blueprint.com

### Documentation
- **API Documentation**: https://docs.faithtech-blueprint.com
- **Troubleshooting Guide**: https://help.faithtech-blueprint.com
- **Status Page**: https://status.faithtech-blueprint.com

---

**Last Updated**: January 15, 2024  
**Version**: 1.0.0
