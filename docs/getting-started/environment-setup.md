# Environment Setup Guide

This guide will help you set up your development environment for FaithTech Blueprint.

## Prerequisites

### Required Software
- Node.js (v18 or later)
- Docker and Docker Compose
- Git
- VS Code (recommended) or your preferred IDE

### Node.js Installation
1. Visit [nodejs.org](https://nodejs.org)
2. Download and install the LTS version
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Docker Installation
1. Visit [docker.com](https://docker.com)
2. Download and install Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

## Project Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/faithtech-blueprint.git
   cd faithtech-blueprint
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp .env.example.client client/.env
   ```

4. **Configure Environment Variables**
   Edit `.env` and set the following:
   ```
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/faithtech
   JWT_SECRET=your-secret-key
   ```

5. **Start Development Environment**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individual services
   npm run dev:client
   npm run dev:server
   ```

## Development Tools

### VS Code Extensions
- ESLint
- Prettier
- Docker
- GitLens
- TypeScript and JavaScript Language Features

### Browser Extensions
- React Developer Tools
- Redux DevTools
- Apollo Client DevTools

## Common Issues

### Port Conflicts
If port 3000 is already in use:
1. Find the process:
   ```bash
   lsof -i :3000
   ```
2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

### Database Connection Issues
1. Ensure Docker is running
2. Check database container:
   ```bash
   docker ps
   ```
3. View database logs:
   ```bash
   docker logs faithtech-db
   ```

## Next Steps

- [Project Structure](project-structure.md)
- [Development Workflow](development-workflow.md)
- [Testing](testing.md) 