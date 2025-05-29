const { validatePasswordComplexity, hashPassword, comparePasswords } = require('../utils/password');

describe('Password Utilities', () => {
  describe('validatePasswordComplexity', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'TestPass123!',
        'Complex1Password!',
        'SuperSecure123#',
        'MyP@ssw0rd'
      ];

      validPasswords.forEach(password => {
        const { isValid, errors } = validatePasswordComplexity(password);
        expect(isValid).toBe(true);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject passwords without uppercase letters', () => {
      const { isValid, errors } = validatePasswordComplexity('password123!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const { isValid, errors } = validatePasswordComplexity('PASSWORD123!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const { isValid, errors } = validatePasswordComplexity('PasswordTest!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const { isValid, errors } = validatePasswordComplexity('Password123');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const { isValid, errors } = validatePasswordComplexity('Password123!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password is too common. Please choose a more unique password');
    });

    it('should reject short passwords', () => {
      const { isValid, errors } = validatePasswordComplexity('Pass1!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject null or undefined passwords', () => {
      const nullResult = validatePasswordComplexity(null);
      const undefinedResult = validatePasswordComplexity(undefined);
      
      expect(nullResult.isValid).toBe(false);
      expect(undefinedResult.isValid).toBe(false);
      expect(nullResult.errors).toContain('Password is required and must be a string');
      expect(undefinedResult.errors).toContain('Password is required and must be a string');
    });

    it('should reject non-string passwords', () => {
      const numberResult = validatePasswordComplexity(12345);
      const objectResult = validatePasswordComplexity({});
      
      expect(numberResult.isValid).toBe(false);
      expect(objectResult.isValid).toBe(false);
      expect(numberResult.errors).toContain('Password is required and must be a string');
      expect(objectResult.errors).toContain('Password is required and must be a string');
    });

    it('should accumulate multiple validation errors', () => {
      const { isValid, errors } = validatePasswordComplexity('pass');
      
      expect(isValid).toBe(false);
      expect(errors).toContain('Password must be at least 8 characters long');
      expect(errors).toContain('Password must contain at least one uppercase letter');
      expect(errors).toContain('Password must contain at least one number');
      expect(errors).toContain('Password must contain at least one special character');
      expect(errors.length).toBe(4);
    });

    it('should reject passwords with repeating characters', () => {
      const { isValid, errors } = validatePasswordComplexity('Passssword123!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password cannot contain repeating characters more than 3 times');
    });

    it('should reject passwords with common keyboard patterns', () => {
      const { isValid, errors } = validatePasswordComplexity('QWERty123!');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password cannot contain common keyboard patterns');
    });

    it('should reject passwords containing username', () => {
      const { isValid, errors } = validatePasswordComplexity('JohnDoe123!', 'johndoe');
      expect(isValid).toBe(false);
      expect(errors).toContain('Password cannot contain your username');
    });

    it('should handle passwords with leading/trailing whitespace', () => {
      const { isValid: withSpaces } = validatePasswordComplexity('  TestPass123!  ');
      const { isValid: noSpaces } = validatePasswordComplexity('TestPass123!');
      
      expect(withSpaces).toBe(true);
      expect(noSpaces).toBe(true);
    });

    it('should accept passwords with Unicode special characters', () => {
      const { isValid, errors } = validatePasswordComplexity('TestPass123¥');
      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should handle extremely long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'a1!' + 'B'.repeat(100);
      const { isValid, errors } = validatePasswordComplexity(longPassword);
      expect(isValid).toBe(false);
      expect(errors).toContain('Password exceeds maximum length');
    });
  });

  describe('hashPassword and comparePasswords', () => {
    it('should hash password and verify correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      // Hash should be in correct format
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{1,2}\$[A-Za-z0-9./]{53}$/);

      // Should verify correctly
      const isMatch = await comparePasswords(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should not verify incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePasswords(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle errors gracefully', async () => {
      await expect(hashPassword('')).rejects.toThrow('Error hashing password');
      await expect(comparePasswords('', 'invalid-hash')).rejects.toThrow('Error comparing passwords');
    });

    it('should handle invalid input types for hashPassword', async () => {
      await expect(hashPassword(null)).rejects.toThrow('Error hashing password');
      await expect(hashPassword(undefined)).rejects.toThrow('Error hashing password');
      await expect(hashPassword(123)).rejects.toThrow('Error hashing password');
      await expect(hashPassword({})).rejects.toThrow('Error hashing password');
    });

    it('should handle invalid input types for comparePasswords', async () => {
      await expect(comparePasswords(null, 'hash')).rejects.toThrow('Error comparing passwords');
      await expect(comparePasswords('pass', null)).rejects.toThrow('Error comparing passwords');
      await expect(comparePasswords(123, 'hash')).rejects.toThrow('Error comparing passwords');
      await expect(comparePasswords('pass', 123)).rejects.toThrow('Error comparing passwords');
    });

    it('should use default salt rounds when not specified', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      // BCrypt hash format: $2[aby]$[rounds]$[22 characters]
      const rounds = hashedPassword.split('$')[2];
      expect(Number(rounds)).toBe(12); // Default rounds
    });

    it('should handle unicode passwords correctly', async () => {
      const password = '密码Test123!';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePasswords(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should handle maximum length passwords', async () => {
      // Use a password that's exactly at the maximum length (72 bytes)
      const password = 'A'.repeat(68) + '1aB!'; // 68 + 4 = 72 chars
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePasswords(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject passwords exceeding maximum length', async () => {
      const password = 'V'.repeat(100) + 'eryLong123!';
      await expect(hashPassword(password)).rejects.toThrow('Password exceeds maximum length');
    });

    it('should maintain consistent timing for password comparison', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const startCorrect = Date.now();
      await comparePasswords(password, hashedPassword);
      const timeCorrect = Date.now() - startCorrect;
      
      const startIncorrect = Date.now();
      await comparePasswords('WrongPassword123!', hashedPassword);
      const timeIncorrect = Date.now() - startIncorrect;
      
      // Timing difference should be minimal to prevent timing attacks
      expect(Math.abs(timeCorrect - timeIncorrect)).toBeLessThan(100);
    });

    it('should use custom salt rounds when specified', async () => {
      const password = 'TestPassword123!';
      const customRounds = 10;
      const hashedPassword = await hashPassword(password, customRounds);
      
      // BCrypt hash format: $2[aby]$[rounds]$[22 characters]
      const rounds = hashedPassword.split('$')[2];
      expect(Number(rounds)).toBe(customRounds);
      
      // Verify it still works
      const isMatch = await comparePasswords(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject invalid bcrypt hash formats', async () => {
      const password = 'TestPassword123!';
      const invalidHashes = [
        'not-a-hash',
        '$2a$10$', // Incomplete hash
        '$2x$10$invalidprefix', // Invalid algorithm identifier
        '$2a$99$toolmanyrounds', // Invalid rounds
      ];

      for (const invalidHash of invalidHashes) {
        await expect(comparePasswords(password, invalidHash))
          .rejects
          .toThrow('Error comparing passwords');
      }
    });

    it('should handle passwords with special UTF-8 characters', async () => {
      const passwords = [
        '密码Test123!',
        'TestПароль123!',
        'Test123!🔒',
        'Test123!£€¥'
      ];

      for (const password of passwords) {
        const hashedPassword = await hashPassword(password);
        const isMatch = await comparePasswords(password, hashedPassword);
        expect(isMatch).toBe(true);
      }
    });

    it('should maintain consistent timing even with invalid hash formats', async () => {
      const password = 'TestPassword123!';
      const validHash = await hashPassword(password);
      const invalidHash = 'invalid-hash-format';
      
      const timings = [];
      
      // Test multiple times to account for system variations
      for (let i = 0; i < 10; i++) {
        const startValid = Date.now();
        try {
          await comparePasswords(password, validHash);
        } catch (e) {}
        timings.push(Date.now() - startValid);
        
        const startInvalid = Date.now();
        try {
          await comparePasswords(password, invalidHash);
        } catch (e) {}
        timings.push(Date.now() - startInvalid);
      }
      
      // Calculate standard deviation of timings
      const avg = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      
      // Standard deviation should be relatively small to indicate consistent timing
      expect(stdDev).toBeLessThan(150);
    });
  });
}); 