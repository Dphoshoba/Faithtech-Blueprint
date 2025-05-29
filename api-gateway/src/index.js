const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const requestId = require('./middleware/requestId');
const auth = require('./middleware/auth');
const rbac = require('./middleware/rbac');
const permissions = require('./middleware/permissions');
const axios = require('axios');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Add request ID to each request
app.use(requestId);

// Log all incoming requests
app.use((req, res, next) => {
  logger.info({ message: 'Incoming request', method: req.method, url: req.url, requestId: req.requestId });
  next();
});

// Health check aggregation
app.get('/health', async (req, res) => {
  try {
    const userService = await axios.get('http://user-service:3000/health');
    res.json({
      apiGateway: 'healthy',
      userService: userService.data.status
    });
  } catch (err) {
    logger.error({ message: 'Health check failed', error: err.message });
    res.status(500).json({ error: 'One or more services unhealthy', details: err.message });
  }
});

// JWT-protected route example
app.get('/api/secure', auth, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

// Admin-only route
app.get('/api/admin', auth, rbac(['admin']), (req, res) => {
  res.json({ message: 'Welcome, admin!', user: req.user });
});

// Manager or Admin route
app.get('/api/manager-or-admin', auth, rbac(['admin', 'manager']), (req, res) => {
  res.json({ message: 'Welcome, privileged user!', user: req.user });
});

// Permission-based route: can_view_reports
app.get('/api/reports', auth, permissions(['can_view_reports']), (req, res) => {
  res.json({ message: 'You can view reports!', user: req.user });
});

// Permission-based route: can_edit_user and can_create_user
app.post('/api/users', auth, permissions(['can_edit_user', 'can_create_user']), (req, res) => {
  res.json({ message: 'You can edit and create users!', user: req.user });
});

// Combined RBAC and permissions route
app.get('/api/special', auth, rbac(['admin', 'manager']), permissions(['can_access_special']), (req, res) => {
  res.json({ message: 'You have special access!', user: req.user });
});

// Add root route handler
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Gateway is running',
    services: {
      user: `${services.user.url}${services.user.path}`,
      template: `${services.template.url}${services.template.path}`
    }
  });
});

// Service routes
const services = {
  user: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3005',
    path: '/api/users'
  },
  template: {
    url: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:3006',
    path: '/api/templates'
  }
};

// Proxy middleware options
const proxyOptions = {
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users', // keep /api/users prefix when forwarding
    '^/health': '/health' // add health check proxy
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log proxy requests
    console.log(`Proxying ${req.method} request to ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Service temporarily unavailable'
    });
  }
};

// Set up proxy routes for each service
Object.entries(services).forEach(([service, config]) => {
  app.use(
    config.path,
    createProxyMiddleware({
      ...proxyOptions,
      target: config.url
    })
  );
});

// Add health check proxy
app.use('/health', createProxyMiddleware({
  ...proxyOptions,
  target: services.user.url
}));

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ message: 'Unhandled error', error: err.message, requestId: req.requestId });
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start server
const PORT = process.env.PORT || 3020;
app.listen(PORT, () => {
  logger.info({ message: 'API Gateway running on port', port: PORT });
});
