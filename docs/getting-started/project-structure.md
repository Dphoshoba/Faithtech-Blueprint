# Project Structure Guide

This guide explains the organization of the FaithTech Blueprint project.

## Root Directory Structure

```
faithtech-blueprint/
├── client/                 # Frontend React application
├── api-gateway/           # API Gateway service
├── services/              # Microservices
├── infrastructure/        # Infrastructure as Code
├── docs/                  # Documentation
├── scripts/              # Utility scripts
└── config/               # Configuration files
```

## Frontend (client/)

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── services/        # API services
│   ├── store/           # State management
│   └── styles/          # Global styles
├── public/              # Static assets
└── tests/               # Frontend tests
```

## Backend Services

### API Gateway
```
api-gateway/
├── src/
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── services/        # Service integrations
└── tests/               # API Gateway tests
```

### Microservices
```
services/
├── auth-service/        # Authentication service
├── user-service/        # User management
├── project-service/     # Project management
└── notification-service/# Notifications
```

## Infrastructure

```
infrastructure/
├── terraform/           # Terraform configurations
├── kubernetes/          # K8s manifests
└── docker/             # Docker configurations
```

## Documentation

```
docs/
├── getting-started/     # Getting started guides
├── features/           # Feature documentation
├── deployment/         # Deployment guides
├── video-tutorials/    # Video tutorials
└── faq/               # Frequently asked questions
```

## Key Files

- `package.json` - Project dependencies and scripts
- `docker-compose.yml` - Development environment setup
- `docker-compose.prod.yml` - Production environment setup
- `.env.example` - Environment variable templates
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration

## Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Implement changes
   - Write tests
   - Create pull request

2. **Code Review**
   - Review code changes
   - Run tests
   - Check linting
   - Approve and merge

3. **Deployment**
   - Automated testing
   - Build artifacts
   - Deploy to staging
   - Deploy to production

## Best Practices

1. **Code Organization**
   - Keep components small and focused
   - Use consistent naming conventions
   - Follow the established directory structure

2. **Testing**
   - Write unit tests for utilities
   - Write integration tests for components
   - Write E2E tests for critical flows

3. **Documentation**
   - Keep README files updated
   - Document new features
   - Update API documentation

## Next Steps

- [Development Workflow](development-workflow.md)
- [Testing](testing.md)
- [Deployment](deployment.md) 