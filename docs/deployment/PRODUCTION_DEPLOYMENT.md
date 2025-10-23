# FaithTech Blueprint - Production Deployment Guide

## 📋 Prerequisites

### Required Accounts
- ✅ AWS Account (for hosting)
- ✅ MongoDB Atlas Account (or self-hosted MongoDB)
- ✅ SendGrid Account (for email)
- ✅ Stripe Account (for payments)
- ✅ Sentry Account (for error tracking)
- ✅ GitHub Account (for CI/CD)

### Required Tools
```bash
- Docker & Docker Compose
- AWS CLI
- Node.js 18+
- Git
```

---

## 🚀 Deployment Steps

### 1. Environment Configuration

Copy the example environment file:
```bash
cp config/production.env.example .env.production
```

Update all values in `.env.production` with your actual credentials.

**Critical Variables to Change:**
- `MONGODB_URI` - Your production MongoDB connection string
- `JWT_SECRET` - Generate with `openssl rand -base64 32`
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`
- `SMTP_PASSWORD` - Your SendGrid API key
- `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY`

### 2. AWS Setup

#### a. Create ECR Repositories
```bash
aws ecr create-repository --repository-name faithtech-user-service
aws ecr create-repository --repository-name faithtech-frontend
```

#### b. Create RDS (MongoDB) or use MongoDB Atlas
```bash
# Option 1: MongoDB Atlas (recommended)
# Create a cluster at https://cloud.mongodb.com
# Copy connection string to MONGODB_URI

# Option 2: Self-hosted on EC2
# See docs/deployment/mongodb-setup.md
```

#### c. Create S3 Bucket
```bash
aws s3 mb s3://faithtech-uploads-prod --region us-east-1
aws s3api put-bucket-versioning \
  --bucket faithtech-uploads-prod \
  --versioning-configuration Status=Enabled
```

#### d. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name faithtech-production
```

### 3. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push User Service
cd services/user-service
docker build -f Dockerfile.prod -t $ECR_REGISTRY/faithtech-user-service:latest .
docker push $ECR_REGISTRY/faithtech-user-service:latest

# Build and push Frontend
cd ../../client
docker build -f Dockerfile.prod -t $ECR_REGISTRY/faithtech-frontend:latest \
  --build-arg REACT_APP_API_URL=https://api.yourdomain.com/api \
  .
docker push $ECR_REGISTRY/faithtech-frontend:latest
```

### 4. Deploy with Docker Compose (Simple)

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 5. Deploy to AWS ECS (Production)

```bash
# Create task definitions (see infrastructure/aws/task-definitions/)
# Create services
# Configure load balancer
# Set up auto-scaling

# Detailed steps in docs/deployment/aws-ecs-setup.md
```

### 6. Set Up GitHub Actions Secrets

In your GitHub repository, add these secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ECR_REGISTRY`
- `JWT_SECRET`
- `MONGODB_URI`
- `SMTP_PASSWORD`
- `STRIPE_SECRET_KEY`
- `REACT_APP_API_URL`

### 7. Configure Domain & SSL

```bash
# Get SSL certificate from AWS Certificate Manager
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com api.yourdomain.com \
  --validation-method DNS

# Configure Route 53 or your DNS provider
# Point your domain to the load balancer
```

---

## 📊 Monitoring Setup

### 1. CloudWatch Logs
```bash
# Create log groups
aws logs create-log-group --log-group-name /faithtech/user-service
aws logs create-log-group --log-group-name /faithtech/frontend
```

### 2. CloudWatch Alarms
```bash
# CPU Utilization
aws cloudwatch put-metric-alarm \
  --alarm-name faithtech-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 3. Sentry Error Tracking
```javascript
// Already configured in the codebase
// Just add SENTRY_DSN to environment variables
```

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up WAF rules
- [ ] Enable database encryption
- [ ] Configure backup strategy
- [ ] Set up security groups
- [ ] Enable CloudWatch monitoring
- [ ] Configure log retention policies

---

## 🧪 Testing Production

```bash
# Health check
curl https://api.yourdomain.com/health

# Test login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"YourPassword"}'

# Test assessment endpoint
curl https://api.yourdomain.com/api/assessments
```

---

## 📈 Scaling

### Horizontal Scaling
```bash
# Update ECS service desired count
aws ecs update-service \
  --cluster faithtech-production \
  --service user-service \
  --desired-count 3
```

### Auto-Scaling
See `infrastructure/aws/auto-scaling.tf` for Terraform configuration.

---

## 🔄 Rollback Procedure

```bash
# Rollback to previous version
aws ecs update-service \
  --cluster faithtech-production \
  --service user-service \
  --task-definition faithtech-user-service:PREVIOUS_VERSION \
  --force-new-deployment
```

---

## 📞 Support

For deployment issues:
- Check CloudWatch Logs
- Review Sentry errors
- Contact: devops@faithtech.com

---

## 🎯 Post-Deployment

1. ✅ Verify all endpoints are accessible
2. ✅ Test user registration and login
3. ✅ Take a sample assessment
4. ✅ Generate a template
5. ✅ Check analytics dashboard
6. ✅ Test CHMS integrations
7. ✅ Verify email sending
8. ✅ Test subscription upgrades
9. ✅ Monitor logs for errors
10. ✅ Set up automated backups

**Congratulations! Your FaithTech Blueprint platform is now in production!** 🎉

