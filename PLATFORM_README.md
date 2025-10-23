# 🙏 FaithTech Blueprint - Complete Church Technology Platform

> A comprehensive, production-ready platform for church health assessments, ministry planning, and data-driven insights.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)

---

## 🌟 Features

### Core Functionality
- ✅ **Assessment Engine** - 5 question types, automatic scoring, personalized feedback
- ✅ **Template System** - Document generation with PDF export and custom branding
- ✅ **Analytics Dashboard** - Comprehensive metrics and insights
- ✅ **CHMS Integrations** - Connect with Planning Center, Breeze, and CCB
- ✅ **Subscription Management** - 4-tier pricing (Free, Basic, Premium, Enterprise)
- ✅ **User Authentication** - Secure JWT-based auth with email verification

### Technical Excellence
- ✅ **TypeScript** for type safety
- ✅ **MongoDB** for scalable data storage
- ✅ **Docker** ready for deployment
- ✅ **CI/CD** pipeline with GitHub Actions
- ✅ **Production** deployment guide
- ✅ **Security** best practices built-in

---

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 18+
- MongoDB 6.0+
- Docker (optional)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourorg/faithtech-blueprint.git
cd faithtech-blueprint
```

2. **Start MongoDB**
```bash
# Option 1: Using Docker
docker-compose up -d mongodb

# Option 2: Local MongoDB
# Make sure MongoDB is running on localhost:27017
```

3. **Start the Backend**
```bash
cd services/user-service
npm install

# Set environment variables
export JWT_SECRET=dev-secret
export MONGODB_URI="mongodb://localhost:27017/faithtech-blueprint"
export FRONTEND_URL=http://localhost:3001
export NODE_ENV=development
export ADMIN_PROMOTE_KEY=dev-promote

# Start server
node src/server.js
```

4. **Start the Frontend**
```bash
cd ../../client
npm install
npm start
```

5. **Access the Application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3005
- Health Check: http://localhost:3005/health

---

## 👤 Default Admin Account

Create your first admin account:

```bash
# Register a new user
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@church.com","password":"AdminP@ssw0rd!123","firstName":"Admin","lastName":"User"}'

# Promote to admin
curl -X POST http://localhost:3005/api/auth/promote \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@church.com","key":"dev-promote"}'
```

**Or use the pre-created admin:**
- Email: `superadmin@faithtech.com`
- Password: `SuperAdmin123!@#`

---

## 📊 What's Included

### Seeded Data
- **4 Subscription Plans** (Free, Basic, Premium, Enterprise)
- **5 Assessments** (Church Health, Leadership, Youth Ministry, Finance, Worship)
- **3 Templates** (Strategic Plan, Budget, Event Planning)

### MongoDB Collections
- `users` - User accounts and authentication
- `assessments` - Assessment definitions with questions
- `assessmentresponses` - User responses and scores
- `subscriptionplans` - Pricing tiers and features
- `usersubscriptions` - User subscription tracking
- `templates` - Document templates
- `templateinstances` - User-generated documents
- `integrations` - CHMS integration configurations

### API Endpoints (50+)
- `/api/auth` - Authentication (register, login, profile)
- `/api/assessments` - Assessment CRUD and taking
- `/api/templates` - Template management and generation
- `/api/subscriptions` - Subscription management
- `/api/analytics` - Metrics and insights
- `/api/integrations` - CHMS connections

---

## 🏗️ Architecture

```
faithtech-blueprint/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   ├── hooks/            # Custom hooks
│   │   └── types/            # TypeScript types
│   ├── Dockerfile.prod       # Production Docker
│   └── nginx.conf            # Nginx configuration
│
├── services/
│   └── user-service/         # Backend API
│       ├── src/
│       │   ├── models/       # Mongoose models (8)
│       │   ├── routes/       # Express routes (6)
│       │   ├── services/     # Business logic (7)
│       │   ├── middleware/   # Express middleware
│       │   ├── seeds/        # Database seeding
│       │   └── server.js     # Application entry
│       └── Dockerfile.prod   # Production Docker
│
├── infrastructure/           # AWS/Terraform configs
├── docs/                     # Documentation
├── .github/workflows/        # CI/CD pipelines
└── docker-compose.prod.yml   # Production orchestration
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd services/user-service
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

---

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started/README.md)
- [API Documentation](./docs/api/README.md)
- [Production Deployment](./docs/deployment/PRODUCTION_DEPLOYMENT.md)
- [Platform Summary](./docs/PLATFORM_SUMMARY.md)
- [Features Overview](./docs/features/README.md)

---

## 🔧 Environment Variables

See `config/production.env.example` for all available environment variables.

**Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend application URL

**Optional:**
- `AWS_*` - AWS credentials for S3
- `SMTP_*` - Email sending configuration
- `STRIPE_*` - Payment processing
- `SENTRY_DSN` - Error tracking

---

## 🛡️ Security

- JWT authentication with secure token storage
- Password hashing with bcrypt
- Rate limiting on all API endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers
- MongoDB injection prevention
- XSS protection
- Role-based access control (RBAC)

---

## 📈 Scaling

### Horizontal Scaling
- Load balancer ready
- Stateless architecture
- Redis session storage (optional)
- Database replication support

### Performance
- MongoDB indexing
- Query optimization
- Caching with React Query
- Lazy loading components
- Code splitting
- Asset optimization

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

- **Documentation**: [./docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/yourorg/faithtech-blueprint/issues)
- **Email**: support@faithtech.com
- **Community**: [Discord](https://discord.gg/faithtech)

---

## 🙏 Acknowledgments

Built with love for churches and ministries worldwide.

Special thanks to the FaithTech community for inspiration and support.

---

## 📊 Platform Stats

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + TypeScript + Material-UI
- **Deployment**: Docker + AWS + CI/CD
- **Features**: 5 major phases completed
- **API Endpoints**: 50+
- **Components**: 40+
- **Models**: 8 database schemas
- **Services**: 7 business logic modules

---

**🎉 Ready to transform church technology!** 🚀

For questions or support, reach out to the team or check the documentation.

Happy building! 🛠️

