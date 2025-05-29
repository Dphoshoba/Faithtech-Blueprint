// Common weak passwords list (example - in production, use a more comprehensive list)
const commonPasswords = [
  'password',
  '123456',
  'qwerty',
  'letmein',
  'admin',
  'welcome',
  'monkey',
  'password1',
  'abc123',
  'football'
];

/**
 * Validates password complexity requirements
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets requirements, false otherwise
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Check minimum length
  if (password.length < 8) {
    return false;
  }

  // Check for common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    return false;
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }

  return true;
};

module.exports = {
  validatePassword,
  commonPasswords
}; 