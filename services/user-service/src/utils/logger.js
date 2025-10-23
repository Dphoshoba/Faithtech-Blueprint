/**
 * Production Logger
 * Winston-based logging with file and console transports
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which transports to use
const transports = [
  // Console logging
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  const logDir = process.env.LOG_DIR || 'logs';
  
  transports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Create stream for Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods
logger.logRequest = (req, res, responseTime) => {
  logger.http(`${req.method} ${req.path} ${res.statusCode} - ${responseTime}ms`);
};

logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

logger.logAuth = (event, userId, details = {}) => {
  logger.info({
    event: `auth:${event}`,
    userId,
    ...details
  });
};

logger.logDatabase = (operation, collection, details = {}) => {
  logger.debug({
    event: `db:${operation}`,
    collection,
    ...details
  });
};

module.exports = logger;
