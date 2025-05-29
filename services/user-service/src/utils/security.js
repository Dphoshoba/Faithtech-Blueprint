const xss = require('xss');

// Sanitize user input to prevent XSS attacks
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
};

// Validate password complexity
exports.validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  
  const minLength = 8;
  const maxLength = 128;
  
  // Check length
  if (password.length < minLength || password.length > maxLength) {
    return false;
  }
  
  // Check complexity requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
};

// List of common passwords to prevent
const commonPasswords = [
  'Password123!',
  'Admin123!',
  'Welcome123!',
  'Letmein123!',
  // Add more common passwords as needed
];

exports.isCommonPassword = (password) => {
  return commonPasswords.includes(password);
};

// Sanitize MongoDB query to prevent NoSQL injection
exports.sanitizeMongoQuery = (query) => {
  const sanitized = {};
  for (const key in query) {
    if (typeof query[key] === 'object') {
      sanitized[key] = this.sanitizeMongoQuery(query[key]);
    } else {
      sanitized[key] = this.sanitizeInput(query[key]);
    }
  }
  return sanitized;
};

// Validate file upload
exports.validateFileUpload = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!file || !file.mimetype) {
    return { valid: false, message: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, message: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'File too large' };
  }
  
  // Check for valid file name
  const validFilename = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif)$/.test(file.originalname);
  if (!validFilename) {
    return { valid: false, message: 'Invalid filename' };
  }
  
  return { valid: true };
};

// Generate secure random token
exports.generateSecureToken = (length = 32) => {
  return require('crypto')
    .randomBytes(length)
    .toString('hex');
};

// Hash sensitive data
exports.hashData = (data) => {
  return require('crypto')
    .createHash('sha256')
    .update(data)
    .digest('hex');
}; 