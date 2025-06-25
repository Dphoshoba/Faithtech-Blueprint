# Deployment Guides

This guide provides comprehensive instructions for deploying the FaithTech platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Infrastructure Deployment](#infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Database Migration](#database-migration)
6. [Monitoring Setup](#monitoring-setup)
7. [Security Configuration](#security-configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- AWS CLI (v2.0.0 or later)
- Terraform (v1.0.0 or later)
- Docker (v20.10.0 or later)
- Node.js (v16.0.0 or later)
- PostgreSQL (v13.0 or later)
- Redis (v6.0 or later)

### AWS Account Setup
1. Create an AWS account if you don't have one
2. Configure AWS CLI with your credentials:
   ```bash
   aws configure
   ```
3. Create an IAM user with appropriate permissions
4. Set up AWS Organizations for multi-account management

### Required AWS Services
- Amazon ECS
- Amazon RDS
- Amazon ElastiCache
- Amazon S3
- Amazon CloudFront
- Amazon Route 53
- AWS Certificate Manager
- AWS Secrets Manager

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/faithtech/blueprint.git
cd blueprint
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Terraform providers
terraform init
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=faithtech
DB_USER=admin
DB_PASSWORD=your-password

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Application Configuration
NODE_ENV=production
PORT=3000
API_URL=https://api.faithtech.com
FRONTEND_URL=https://faithtech.com
```

### 4. Set Up Secrets
```bash
# Store database credentials in AWS Secrets Manager
aws secretsmanager create-secret \
  --name faithtech/db-credentials \
  --secret-string '{"username":"admin","password":"your-password"}'

# Store Redis credentials
aws secretsmanager create-secret \
  --name faithtech/redis-credentials \
  --secret-string '{"password":"your-password"}'
```

## Infrastructure Deployment

### 1. Initialize Terraform
```bash
cd infrastructure/aws
terraform init
```

### 2. Create Terraform Workspace
```bash
terraform workspace new production
```

### 3. Plan Infrastructure Changes
```bash
terraform plan -var-file=production.tfvars
```

### 4. Apply Infrastructure Changes
```bash
terraform apply -var-file=production.tfvars
```

### 5. Verify Infrastructure
```bash
# Check ECS cluster status
aws ecs describe-clusters --clusters faithtech-cluster

# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier faithtech-db

# Check ElastiCache cluster status
aws elasticache describe-replication-groups --replication-group-id faithtech-cache
```

## Application Deployment

### 1. Build Docker Images
```bash
# Build API image
docker build -t faithtech/api:latest -f services/api/Dockerfile .

# Build Frontend image
docker build -t faithtech/frontend:latest -f services/frontend/Dockerfile .
```

### 2. Push Images to ECR
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push images
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/faithtech/api:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/faithtech/frontend:latest
```

### 3. Deploy to ECS
```bash
# Update ECS service
aws ecs update-service \
  --cluster faithtech-cluster \
  --service api-service \
  --force-new-deployment

# Check deployment status
aws ecs describe-services \
  --cluster faithtech-cluster \
  --services api-service
```

### 4. Verify Application
```bash
# Check API health
curl https://api.faithtech.com/health

# Check frontend deployment
curl -I https://faithtech.com
```

## Database Migration

### 1. Backup Existing Database
```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-snapshot-identifier faithtech-snapshot \
  --db-instance-identifier faithtech-db
```

### 2. Run Migrations
```bash
# Run database migrations
npm run migrate:up

# Verify migrations
npm run migrate:status
```

### 3. Seed Initial Data
```bash
# Run seeders
npm run seed:production
```

## Monitoring Setup

### 1. Configure CloudWatch
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name faithtech-dashboard \
  --dashboard-body file://monitoring/dashboard.json
```

### 2. Set Up Alarms
```bash
# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name faithtech-high-cpu \
  --alarm-description "High CPU utilization" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=faithtech-cluster \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:$AWS_ACCOUNT_ID:faithtech-alerts
```

### 3. Configure Logging
```bash
# Create log groups
aws logs create-log-group --log-group-name /faithtech/api
aws logs create-log-group --log-group-name /faithtech/frontend

# Set retention period
aws logs put-retention-policy \
  --log-group-name /faithtech/api \
  --retention-in-days 30
```

## Security Configuration

### 1. Set Up WAF
```bash
# Create WAF rules
aws wafv2 create-web-acl \
  --name faithtech-waf \
  --scope REGIONAL \
  --default-action Allow \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true \
  --rules file://security/waf-rules.json
```

### 2. Configure SSL/TLS
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name faithtech.com \
  --validation-method DNS \
  --subject-alternative-names *.faithtech.com
```

### 3. Set Up Security Groups
```bash
# Create security group for API
aws ec2 create-security-group \
  --group-name faithtech-api-sg \
  --description "Security group for FaithTech API"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-name faithtech-api-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

## Troubleshooting

### Common Issues

#### 1. ECS Service Deployment Fails
```bash
# Check service events
aws ecs describe-services \
  --cluster faithtech-cluster \
  --services api-service

# Check container logs
aws logs get-log-events \
  --log-group-name /faithtech/api \
  --log-stream-name api-service/container-name
```

#### 2. Database Connection Issues
```bash
# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier faithtech-db

# Test database connection
psql -h your-db-host -U admin -d faithtech
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:$AWS_ACCOUNT_ID:certificate/xxx

# Verify DNS validation
dig _acm-validation.faithtech.com
```

### Monitoring and Debugging

#### 1. Check Application Logs
```bash
# View API logs
aws logs tail /faithtech/api

# View frontend logs
aws logs tail /faithtech/frontend
```

#### 2. Monitor Metrics
```bash
# Get CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=faithtech-cluster \
  --start-time $(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "-1 hour") \
  --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --period 300 \
  --statistics Average
```

#### 3. Check Security Groups
```bash
# Describe security groups
aws ec2 describe-security-groups \
  --group-ids sg-xxx

# Check network ACLs
aws ec2 describe-network-acls
```

### Recovery Procedures

#### 1. Database Recovery
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier faithtech-db-restore \
  --db-snapshot-identifier faithtech-snapshot
```

#### 2. Application Rollback
```bash
# Rollback ECS service
aws ecs update-service \
  --cluster faithtech-cluster \
  --service api-service \
  --task-definition arn:aws:ecs:us-east-1:$AWS_ACCOUNT_ID:task-definition/api:1
```

#### 3. Infrastructure Rollback
```bash
# Rollback Terraform changes
terraform apply -var-file=production.tfvars -target=module.previous_version
```

## Support

For additional support:
1. Check the [Documentation](https://docs.faithtech.com)
2. Join our [Community Forum](https://community.faithtech.com)
3. Contact [Support](https://faithtech.com/support)
4. Submit [Issues](https://github.com/faithtech/blueprint/issues) 