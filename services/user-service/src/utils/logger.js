const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logging
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports for different environments
const transports = [
  // Always write to console
  new winston.transports.Console(),
  
  // Write errors to file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error'
  }),
  
  // Write all logs to file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/all.log')
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on uncaught errors
  exitOnError: false
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Add request context logging
logger.logRequest = (req, message) => {
  const context = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous'
  };
  
  logger.info(`${message} | ${JSON.stringify(context)}`);
};

// Add error context logging
logger.logError = (err, req = null) => {
  const context = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    method: req ? req.method : null,
    url: req ? req.url : null,
    ip: req ? req.ip : null,
    userId: req && req.user ? req.user.id : null
  };
  
  logger.error(`Error occurred | ${JSON.stringify(context)}`);
};

// Add performance logging
logger.logPerformance = (operation, duration) => {
  logger.debug(`Performance | ${operation} took ${duration}ms`);
};

// Add security event logging
logger.logSecurityEvent = (event, details) => {
  const context = {
    event,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  logger.warn(`Security Event | ${JSON.stringify(context)}`);
};

module.exports = logger; 