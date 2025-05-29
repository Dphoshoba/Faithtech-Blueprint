import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';
import logger from './logger';

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score?: number; // Password strength score (0-4)
  feedback?: {
    warning?: string;
    suggestions: string[];
  };
}

interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
  maxRepeatingChars?: number;
  checkCommonPasswords?: boolean;
  checkKeyboardPatterns?: boolean;
  username?: string;
}

const DEFAULT_OPTIONS: PasswordValidationOptions = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  maxRepeatingChars: 3,
  checkCommonPasswords: true,
  checkKeyboardPatterns: true
};

const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', '123456', 'qwertz', 'azerty'
];

export function validatePasswordComplexity(
  password: string | null | undefined,
  username?: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const result: PasswordValidationResult = {
    isValid: true,
    errors: []
  };

  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if password is provided and is string
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required and must be a string']
    };
  }

  // Check length
  if (password.length < opts.minLength!) {
    result.errors.push(`Password must be at least ${opts.minLength} characters long`);
  }

  if (password.length > opts.maxLength!) {
    result.errors.push('Password exceeds maximum length');
  }

  // Check character types
  if (opts.requireUppercase && !/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  }

  if (opts.requireLowercase && !/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
  }

  if (opts.requireNumbers && !/\d/.test(password)) {
    result.errors.push('Password must contain at least one number');
  }

  if (opts.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
  }

  // Check for repeating characters
  if (opts.maxRepeatingChars) {
    const repeatingPattern = new RegExp(`(.)\\1{${opts.maxRepeatingChars},}`);
    if (repeatingPattern.test(password)) {
      result.errors.push(`Password cannot contain repeating characters more than ${opts.maxRepeatingChars} times`);
    }
  }

  // Check for keyboard patterns
  if (opts.checkKeyboardPatterns) {
    const lowerPassword = password.toLowerCase();
    if (KEYBOARD_PATTERNS.some(pattern => lowerPassword.includes(pattern))) {
      result.errors.push('Password cannot contain common keyboard patterns');
    }
  }

  // Check if password contains username
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    result.errors.push('Password cannot contain your username');
  }

  // Use zxcvbn for additional password strength analysis
  const analysis = zxcvbn(password);
  result.score = analysis.score;
  result.feedback = {
    warning: analysis.feedback.warning || undefined,
    suggestions: analysis.feedback.suggestions
  };

  // Check if password is too common based on zxcvbn score
  if (opts.checkCommonPasswords && analysis.score <= 2) {
    result.errors.push('Password is too common. Please choose a more unique password');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

export async function hashPassword(
  password: string,
  saltRounds: number = 12
): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password input');
    }

    if (password.length > 72) {
      throw new Error('Password exceeds maximum length');
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing password');
  }
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
      throw new Error('Invalid input');
    }

    // Validate hash format
    if (!/^\$2[aby]\$\d{1,2}\$[A-Za-z0-9./]{53}$/.test(hash)) {
      throw new Error('Invalid hash format');
    }

    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing passwords:', error);
    throw new Error('Error comparing passwords');
  }
} 