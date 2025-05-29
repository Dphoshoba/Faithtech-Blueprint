const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
  // Generate a unique request ID
  req.requestId = uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

module.exports = requestId; 