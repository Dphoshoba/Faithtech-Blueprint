const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const plansRouter = require('./routes/plans');
const subscriptionsRouter = require('./routes/subscriptions');

// Import middleware
const { errorHandler } = require('./middleware/error');
const { 
  securityHeaders, 
  corsOptions, 
  apiLimiter, 
  sanitizeRequest,
  requestSizeLimiter,
  apiVersionCheck,
  sessionManager,
  ipBlocker
} = require('./middleware/security.middleware');
const { csrfProtection, handleCSRFError } = require('./middleware/csrf.middleware');

const app = express();

// Basic middleware
app.use(helmet());
app.use(corsOptions);
app.use(morgan('combined'));
app.use(compression());
app.use(cookieParser()); // Required for CSRF
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(securityHeaders);
app.use('/api', apiLimiter);
app.use(sanitizeRequest);
app.use(requestSizeLimiter);
app.use(apiVersionCheck);
app.use(sessionManager);
app.use(ipBlocker);

// CSRF Protection - Apply to all routes except those that need to be public
app.use((req, res, next) => {
  // Skip CSRF for authentication routes and public endpoints
  if (req.path.startsWith('/api/auth/') || req.path === '/api/health') {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// CSRF Error Handler
app.use(handleCSRFError);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', plansRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    service: 'User Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      plans: '/api/plans',
      subscriptions: '/api/subscriptions',
      health: '/health'
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

module.exports = app; 