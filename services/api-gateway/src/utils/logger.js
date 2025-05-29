const winston = require('winston');
const { format } = winston;

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'api-gateway' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info'
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    })
  ]
});

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    // Add user info if available
    if (req.user) {
      logData.userId = req.user.id;
      logData.organization = req.user.organization;
    }

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Add error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: {
      message: err.message,
      stack: err.stack,
      ...err
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      query: req.query,
      body: req.body
    },
    user: req.user
  });

  next(err);
};

// Add performance monitoring
const performanceLogger = {
  startTimer: () => {
    const start = process.hrtime();
    return {
      end: (operation) => {
        const diff = process.hrtime(start);
        const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
        logger.info('Performance metric', {
          operation,
          duration: `${duration.toFixed(2)}ms`
        });
        return duration;
      }
    };
  }
};

// Add service status logging
const serviceStatus = {
  up: (service) => {
    logger.info('Service status change', {
      service,
      status: 'up',
      timestamp: new Date()
    });
  },
  down: (service, error) => {
    logger.error('Service status change', {
      service,
      status: 'down',
      error: error.message,
      timestamp: new Date()
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  performanceLogger,
  serviceStatus
}; 