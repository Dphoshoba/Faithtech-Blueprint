const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { sanitizeInput } = require('../utils/security');

// Rate limiting for authentication attempts
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiting
exports.apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Enhanced security headers
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// CORS configuration
exports.corsOptions = cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// Request sanitization middleware
exports.sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitizeInput(req.body[key]);
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeInput(req.query[key]);
    });
  }

  // Sanitize URL parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      req.params[key] = sanitizeInput(req.params[key]);
    });
  }

  next();
};

// Request size limiter
exports.requestSizeLimiter = (req, res, next) => {
  const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB
  
  if (req.headers['content-length'] > MAX_CONTENT_LENGTH) {
    return res.status(413).json({ message: 'Request entity too large' });
  }
  
  next();
};

// API version check middleware
exports.apiVersionCheck = (req, res, next) => {
  const version = req.path.split('/')[2]; // Assuming path format: /api/v1/...
  
  if (version === 'v1') {
    return res.status(410).json({ 
      message: 'API v1 is deprecated. Please upgrade to v2',
      documentation: 'https://api.faithtech.com/docs/migration-guide'
    });
  }
  
  if (version && !['v2'].includes(version)) {
    return res.status(404).json({ 
      message: 'API version not found',
      supportedVersions: ['v2']
    });
  }
  
  next();
};

// Session management middleware
exports.sessionManager = (req, res, next) => {
  // Set secure session cookie options
  res.cookie('session', req.sessionID, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  next();
};

// IP-based blocking middleware
exports.ipBlocker = (() => {
  const blockedIPs = new Set();
  const suspiciousAttempts = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (blockedIPs.has(ip)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Track suspicious attempts
    if (!suspiciousAttempts.has(ip)) {
      suspiciousAttempts.set(ip, { count: 0, timestamp: Date.now() });
    }
    
    const attempt = suspiciousAttempts.get(ip);
    
    // Reset counter if more than an hour has passed
    if (Date.now() - attempt.timestamp > 3600000) {
      attempt.count = 0;
      attempt.timestamp = Date.now();
    }
    
    attempt.count++;
    
    // Block IP if too many suspicious attempts
    if (attempt.count > 100) {
      blockedIPs.add(ip);
      return res.status(403).json({ message: 'Access denied due to suspicious activity' });
    }
    
    next();
  };
})();

// Request validation middleware
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
}; 