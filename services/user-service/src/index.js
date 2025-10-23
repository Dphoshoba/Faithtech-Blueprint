require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { errorHandler, AppError } = require('./middleware/error');
const session = require('express-session');
const cookieParser = require('cookie-parser');
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

// Import routes
const authRoutes = require('./routes/authRoutes');
const simpleAuthRoutes = require('./routes/simple-auth');
const userRoutes = require('./routes/userRoutes');
const plansRouter = require('./routes/plans');
const subscriptionsRouter = require('./routes/subscriptions');
const assessmentsRouter = require('./routes/assessments');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(requestSizeLimiter);
app.use(sessionManager);
app.use(ipBlocker);

// Rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/simple-auth', simpleAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', plansRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/assessments', assessmentsRouter);

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
      assessments: '/api/assessments',
      health: '/health'
    }
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    // Skip database connection in test environment as it's handled by the test setup
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user-service', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3005;
let server;

const startServer = async () => {
  try {
    // Skip database connection in test environment
    if (process.env.NODE_ENV !== 'test') {
      await connectDB();
    }
    
    const tryPort = async (port) => {
      try {
        server = app.listen(port, () => {
          console.log(`Server running on port ${port}`);
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            if (port >= 3010) {
              console.error('Could not find an available port between 3005 and 3010');
              process.exit(1);
            }
            console.log(`Port ${port} is in use, trying ${port + 1}`);
            server.close();
            tryPort(port + 1);
          } else {
            console.error('Server error:', error);
            process.exit(1);
          }
        });

      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          if (port >= 3010) {
            console.error('Could not find an available port between 3005 and 3010');
            process.exit(1);
          }
          console.log(`Port ${port} is in use, trying ${port + 1}`);
          tryPort(port + 1);
        } else {
          throw error;
        }
      }
    };

    await tryPort(PORT);

    // Handle process termination
    const gracefulShutdown = async () => {
      console.log('Received shutdown signal. Shutting down gracefully...');
      if (server) {
        server.close(async () => {
          console.log('Server closed');
          try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
            process.exit(0);
          } catch (error) {
            console.error('Error closing MongoDB connection:', error);
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown();
    });
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
      gracefulShutdown();
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app; 