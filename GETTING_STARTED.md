# FaithTech Blueprint - Getting Started Guide

## 🏗️ Architecture Overview

FaithTech Blueprint is a **microservices-based SaaS platform** for church management. Here's what you have:

### **System Components:**

```
faithtech-blueprint/
├── client/                    # React/TypeScript Frontend (Vite + MUI + React Router)
├── services/                  # Backend Microservices
│   ├── user-service/         # User management & authentication
│   ├── assessment-service/   # Assessments & evaluations
│   ├── template-service/     # Document templates
│   ├── analytics-service/    # Analytics & reporting
│   ├── marketing/            # Marketing campaigns
│   ├── beta-program/         # Beta testing features
│   ├── recommendation-engine/# AI recommendations
│   ├── feedback-service/     # User feedback
│   ├── chms-integration/     # Church Management System integrations
│   └── api-gateway/          # API Gateway (routes to services)
├── infrastructure/           # AWS/Cloud deployment configs
└── marketing-website/        # Public marketing site (Next.js)
```

---

## 🚀 How to Run the Application

### **Prerequisites:**
- Node.js (v16 or higher)
- MongoDB (running locally or remote)
- Redis (optional, for caching)

### **Quick Start:**

#### **1. Start the Backend Services**

You need to run multiple services. Open separate terminal windows:

**Terminal 1 - User Service (Port 3005):**
```bash
cd services/user-service
npm install
npm run dev
```

**Terminal 2 - Assessment Service (Port 3002):**
```bash
cd services/assessment-service
npm install
npm run dev
```

**Terminal 3 - Template Service (Port 3003):**
```bash
cd services/template-service
npm install
npm run dev
```

**Terminal 4 - API Gateway (Port 3000):**
```bash
cd services/api-gateway
npm install
npm run dev
```

#### **2. Start the Frontend Client**

**Terminal 5 - React App (Port 3001):**
```bash
cd client
npm install
PORT=3001 npm run dev
```

The client will automatically open at `http://localhost:3001`

---

## 📋 What Each Service Does

### **1. Client (Frontend)**
- **Port:** 3001
- **Tech:** React, TypeScript, Material-UI, React Query
- **Features:**
  - User authentication & registration
  - Dashboard for assessments and templates
  - Template library and customization
  - Subscription management
  - Analytics dashboards
  - Beta program onboarding

### **2. User Service**
- **Port:** 3005
- **Database:** MongoDB
- **Features:**
  - User registration/login
  - JWT authentication
  - Profile management
  - Password reset
  - Email verification
  - Multi-factor authentication (2FA)

### **3. Assessment Service**
- **Port:** 3002
- **Database:** MongoDB
- **Features:**
  - Create/manage assessments
  - Question types (multiple choice, text, scale, true/false)
  - Assessment responses and scoring
  - Progress tracking
  - Results analytics

### **4. Template Service**
- **Port:** 3003
- **Database:** MongoDB
- **Features:**
  - Document template management
  - Template customization
  - Template categories and tags
  - Template sharing
  - Usage statistics

### **5. API Gateway**
- **Port:** 8000
- **Purpose:** Routes requests to appropriate microservices
- **Features:**
  - Request routing
  - Load balancing
  - Rate limiting
  - Authentication middleware

### **6. Marketing Service**
- **Database:** PostgreSQL (Prisma)
- **Features:**
  - Campaign management
  - Email marketing
  - Social media integration
  - Press releases
  - Affiliate programs

### **7. Analytics Service**
- **Features:**
  - User behavior tracking
  - ML-based predictions (churn, engagement)
  - Custom analytics dashboards
  - Real-time metrics

### **8. Beta Program Service**
- **Features:**
  - Beta user applications
  - Feedback collection
  - A/B testing
  - User surveys
  - Feature request tracking

---

## 🔐 Environment Setup

### **Create `.env` files for each service:**

**client/.env:**
```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_GA_MEASUREMENT_ID=your-ga-id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

**services/user-service/.env:**
```bash
PORT=3005
MONGODB_URI=mongodb://localhost:27017/faithtech-users
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**services/assessment-service/.env:**
```bash
PORT=3002
MONGODB_URI=mongodb://localhost:27017/faithtech-assessments
JWT_SECRET=your-secret-key-change-this
```

**services/template-service/.env:**
```bash
PORT=3003
MONGODB_URI=mongodb://localhost:27017/faithtech-templates
JWT_SECRET=your-secret-key-change-this
```

**api-gateway/.env:**
```bash
PORT=8000
USER_SERVICE_URL=http://localhost:3005
ASSESSMENT_SERVICE_URL=http://localhost:3002
TEMPLATE_SERVICE_URL=http://localhost:3003
```

---

## 📱 Using the Application

### **1. User Registration & Login**

1. Navigate to `http://localhost:3001/register`
2. Fill in registration form (email, password, name)
3. Check your email for verification (if SMTP is configured)
4. Login at `http://localhost:3001/login`

### **2. Dashboard**

After login, you'll see:
- **Overview:** Quick stats and recent activity
- **Assessments:** Available assessments to take
- **Templates:** Browse and customize templates
- **Analytics:** Usage statistics and insights

### **3. Taking Assessments**

1. Go to "Assessments" page
2. Click "Start Assessment" on any assessment card
3. Answer questions (auto-saves progress)
4. Submit when complete
5. View detailed results and analytics

### **4. Using Templates**

1. Navigate to "Templates"
2. Browse template library
3. Click on a template to view details
4. Customize template variables
5. Download or share templates

### **5. Subscription Management**

1. Go to "Subscription" from settings
2. View current plan and usage
3. Upgrade/downgrade plans
4. Manage payment methods
5. View billing history

### **6. Beta Program** (if enabled)

1. Access beta features from dashboard
2. Submit feedback via feedback widget
3. Participate in surveys
4. Track your beta engagement metrics

---

## 🔨 Development Commands

### **Root Level Commands:**
```bash
# Start client in development mode
npm run client:dev

# Build client for production
npm run client:build

# Start user service
npm run services:user

# Start assessment service
npm run services:assessment

# Start template service
npm run services:template

# Install all dependencies (root + client)
npm run install:all

# Format all code
npm run format

# Clean build artifacts
npm run clean
```

### **Client-Specific Commands:**
```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint (uses build output for type checking)
```

### **Service-Specific Commands:**
```bash
cd services/user-service

# Start in development mode (with auto-reload)
npm run dev

# Start in production mode
npm run dev

# Run tests
npm test
```

---

## 📊 Key Features

### **For Church Administrators:**
- Member assessments and evaluations
- Customizable document templates
- Analytics and insights
- Integration with existing church management systems
- Subscription-based pricing (Free, Basic, Pro, Enterprise)

### **For Developers:**
- RESTful APIs for all services
- JWT-based authentication
- Real-time updates (WebSockets)
- Comprehensive analytics
- Extensible microservices architecture

---

## 🐛 Troubleshooting

### **Build fails with errors:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Service won't start:**
- Check if MongoDB is running: `mongosh`
- Check if port is already in use: `lsof -i :3005`
- Check environment variables in `.env` file

### **SMTP errors (Email service):**
- The app works without SMTP, but emails won't send
- For Gmail: Enable "App Passwords" in Google Account settings
- Update `SMTP_USER` and `SMTP_PASS` in `.env`

### **API requests failing:**
- Make sure API Gateway is running (port 8000)
- Check that backend services are running
- Verify `REACT_APP_API_URL` in client/.env

---

## 🎯 Next Steps

1. **Set up MongoDB:** Install and start MongoDB locally
2. **Configure environment:** Create all `.env` files
3. **Start services:** Run user-service, assessment-service, template-service
4. **Start gateway:** Run api-gateway
5. **Start client:** Run the React app
6. **Register account:** Create your first user account
7. **Explore features:** Try assessments, templates, and analytics

---

## 📚 Additional Resources

- **API Documentation:** See `/docs/api/README.md`
- **Deployment Guide:** See `/docs/deployment/README.md`
- **Feature Docs:** See `/docs/features/`
- **Architecture:** Microservices with API Gateway pattern
- **Database:** MongoDB for most services, PostgreSQL for marketing

---

## 🎉 Current Status

✅ **Client builds successfully** (production-ready)
✅ **User service running** (port 3005)
✅ **All TypeScript errors fixed**
✅ **Dependencies installed**
⚠️ **SMTP not configured** (optional for development)

The application is ready to use! Start with the user service and client, then add other services as needed.

