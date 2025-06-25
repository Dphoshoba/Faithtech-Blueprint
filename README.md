# FaithTech Blueprint

A comprehensive church management platform designed to streamline operations, engage communities, and grow ministries.

## Project Overview

FaithTech Blueprint is a full-stack application that provides churches with tools for:

- Church management and administration
- Community engagement
- Volunteer coordination
- Event planning
- Growth analytics
- Resource management
- Secure admin authentication
- Lead management and tracking

## Project Structure

The project is organized into several key components:

- **Client**: React/TypeScript frontend application
- **API Gateway**: Express.js service that routes requests to microservices
- **Services**: Microservices for specific functionality domains
  - Authentication Service
  - User Service
  - Template Service
  - Assessment Service
  - Analytics Service
  - Email Service
  - Feedback Service
  - Calendar Service
  - CHMS Integration Service
- **Marketing Website**: Next.js website for product marketing
- **Infrastructure**: AWS CDK and Terraform configurations for cloud deployment

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Docker and Docker Compose (for running services locally)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/faithtech-blueprint.git
   cd faithtech-blueprint
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

### Development

#### Running the Client

```
cd client
npm run start
```

The client will be available at http://localhost:3000.

#### Running the API Gateway

```
cd api-gateway
npm run dev
```

The API Gateway will be available at http://localhost:3020.

#### Running the Marketing Website

```
cd marketing-website
npm run dev
```

The marketing website will be available at http://localhost:3000.

#### Running All Services with Docker

```
docker-compose up
```

### Testing

#### Client Tests

```
cd client
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
```

#### API Tests

```
cd api-gateway
npm run test
```

### Building for Production

#### Client Build

```
cd client
npm run build
```

#### Marketing Website Build

```
cd marketing-website
npm run build
```

## Documentation

Additional documentation is available in the `docs` directory:

- [Getting Started Guide](docs/getting-started/README.md)
- [Features Documentation](docs/features/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Code Review Process](docs/code-review/systematic-review.md)
- [FAQ](docs/faq/README.md)

## Recent Enhancements

The following enhancements have been added to the project:

### Authentication System
- JWT-based authentication for admin portal
- Secure middleware for protecting admin routes
- Login/logout functionality with token management
- HOC pattern for protected routes

### Admin Dashboard
- Secure admin login page
- Lead management interface with filtering and search
- Analytics dashboard with data visualization
- Mobile-responsive admin interface

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
