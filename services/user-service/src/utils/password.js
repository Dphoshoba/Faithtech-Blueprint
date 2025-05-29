const bcrypt = require('bcryptjs');

// Extended list of common passwords
const commonPasswords = [
  'password123', 'qwerty123', '12345678', 'letmein123', 'admin123',
  'welcome123', 'monkey123', 'football123', 'abc123', 'password1',
  'Password123', 'Password123!', 'Admin123!', 'Welcome123!', 'Qwerty123!',
  'Test123!', 'Hello123!', 'Password1!', 'Password1234', 'Passw0rd'
];

// Constants for password validation
const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72, // bcrypt's maximum input length
  MIN_LOWERCASE: 1,
  MIN_UPPERCASE: 1,
  MIN_NUMBERS: 1,
  MIN_SPECIAL: 1
};

/**
 * Validates password complexity
 * Requirements:
 * - Minimum 8 characters, maximum 72 characters (bcrypt limit)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not a common password
 * - No excessive repeating characters
 */
const validatePasswordComplexity = (password, username = '') => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required and must be a string']
    };
  }

  // Trim whitespace from password
  const trimmedPassword = password.trim();
  const errors = [];

  // Check length constraints
  if (trimmedPassword.length < PASSWORD_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters long`);
  }
  if (trimmedPassword.length > PASSWORD_CONSTRAINTS.MAX_LENGTH) {
    errors.push('Password exceeds maximum length');
  }

  // Regular expressions for validation (now supporting Unicode)
  const hasUpperCase = /[\p{Lu}]/u.test(trimmedPassword);
  const hasLowerCase = /[\p{Ll}]/u.test(trimmedPassword);
  const hasNumbers = /\d/.test(trimmedPassword);
  const hasSpecialChar = /[^\p{L}\p{N}\s]/u.test(trimmedPassword);
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords (case-insensitive)
  if (commonPasswords.some(common => 
    trimmedPassword.toLowerCase() === common.toLowerCase()
  )) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  // Check for repeating characters (more than 3 times in a row)
  if (/(.)\1{3,}/u.test(trimmedPassword)) {
    errors.push('Password cannot contain repeating characters more than 3 times');
  }

  // Check for keyboard patterns
  if (/qwerty|asdfgh|zxcvbn/i.test(trimmedPassword)) {
    errors.push('Password cannot contain common keyboard patterns');
  }

  // Check if password contains username (case-insensitive)
  if (username && trimmedPassword.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Password cannot contain your username');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates bcrypt hash format
 * @param {string} hash - The hash to validate
 * @returns {boolean} Whether the hash is valid
 */
const isValidBcryptHash = (hash) => {
  if (typeof hash !== 'string') return false;
  
  // BCrypt hash format: $2[aby]$[rounds]$[22 characters]
  const parts = hash.split('$');
  if (parts.length !== 4) return false;
  
  // Check algorithm identifier
  if (!parts[1].match(/^2[aby]$/)) return false;
  
  // Check rounds (between 4 and 31)
  const rounds = parseInt(parts[2]);
  if (isNaN(rounds) || rounds < 4 || rounds > 31) return false;
  
  // Check hash length (22 characters)
  if (parts[3].length !== 53) return false;
  
  return true;
};

/**
 * Hashes a password using bcrypt
 * @param {string} password - The plain text password
 * @param {number} rounds - The number of salt rounds (default: 12)
 * @returns {Promise<string>} The hashed password
 * @throws {Error} If password is empty, invalid, or exceeds maximum length
 */
const hashPassword = async (password, rounds = 12) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Error hashing password: Invalid password provided');
  }

  const trimmedPassword = password.trim();

  if (trimmedPassword.length > PASSWORD_CONSTRAINTS.MAX_LENGTH) {
    throw new Error('Error hashing password: Password exceeds maximum length');
  }

  try {
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(trimmedPassword, salt);
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} plainPassword - The plain text password
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} Whether the passwords match
 * @throws {Error} If either password is invalid
 */
const comparePasswords = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword || 
      typeof plainPassword !== 'string' || 
      typeof hashedPassword !== 'string') {
    throw new Error('Error comparing passwords: Invalid password(s) provided');
  }

  // Validate hash format before comparison
  if (!isValidBcryptHash(hashedPassword)) {
    throw new Error('Error comparing passwords: Invalid hash format');
  }

  try {
    // Trim the plain password before comparison
    return await bcrypt.compare(plainPassword.trim(), hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

module.exports = {
  validatePasswordComplexity,
  hashPassword,
  comparePasswords,
  PASSWORD_CONSTRAINTS // Exported for testing
}; 