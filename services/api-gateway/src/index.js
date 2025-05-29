const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  assessment: process.env.ASSESSMENT_SERVICE_URL || 'http://localhost:3002',
  template: process.env.TEMPLATE_SERVICE_URL || 'http://localhost:3003'
};

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/',
    '^/api/assessments': '/',
    '^/api/templates': '/'
  },
  onProxyReq: (proxyReq, req) => {
    // Forward user info from verified token
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
      proxyReq.setHeader('X-User-Organization', req.user.organization);
    }
  }
};

// Auth service routes (no auth required)
app.use('/api/auth', createProxyMiddleware({
  ...proxyOptions,
  target: services.auth
}));

// Auth middleware for protected routes
app.use('/api', verifyToken);

// Assessment service routes
app.use('/api/assessments', createProxyMiddleware({
  ...proxyOptions,
  target: services.assessment
}));

// Template service routes
app.use('/api/templates', createProxyMiddleware({
  ...proxyOptions,
  target: services.template
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Service URLs:', services);
}); 