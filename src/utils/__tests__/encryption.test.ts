import { encrypt, decrypt } from '../encryption';

describe('Encryption Utilities', () => {
  const testData = [
    'Simple test string',
    'Complex string with special chars: !@#$%^&*()',
    'Unicode characters: 你好世界',
    'Very long string ' + 'a'.repeat(1000),
    JSON.stringify({ test: 'object', nested: { data: [1, 2, 3] } })
  ];

  describe('encrypt', () => {
    it('should encrypt strings successfully', () => {
      testData.forEach(text => {
        const encrypted = encrypt(text);
        expect(typeof encrypted).toBe('string');
        expect(encrypted).not.toBe(text);
        
        // Verify JSON structure
        const parsed = JSON.parse(encrypted);
        expect(parsed).toHaveProperty('iv');
        expect(parsed).toHaveProperty('salt');
        expect(parsed).toHaveProperty('tag');
        expect(parsed).toHaveProperty('encryptedData');
      });
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const text = 'test string';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      expect(typeof encrypted).toBe('string');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should throw error for invalid input', () => {
      expect(() => encrypt(null as any)).toThrow();
      expect(() => encrypt(undefined as any)).toThrow();
      expect(() => encrypt({} as any)).toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted strings correctly', () => {
      testData.forEach(text => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('should throw error for invalid encrypted data', () => {
      const invalidData = [
        '',
        'not json',
        '{}',
        JSON.stringify({ iv: 'invalid' }),
        JSON.stringify({
          iv: 'invalid',
          salt: 'invalid',
          tag: 'invalid',
          encryptedData: 'invalid'
        })
      ];

      invalidData.forEach(data => {
        expect(() => decrypt(data)).toThrow();
      });
    });

    it('should throw error for tampered data', () => {
      const text = 'test string';
      const encrypted = encrypt(text);
      const parsed = JSON.parse(encrypted);

      // Tamper with encrypted data
      parsed.encryptedData = parsed.encryptedData.replace(/[a-f]/g, '0');
      
      expect(() => decrypt(JSON.stringify(parsed))).toThrow();
    });
  });

  describe('encryption key handling', () => {
    const originalKey = process.env.ENCRYPTION_KEY;

    afterEach(() => {
      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should use different keys for encryption', () => {
      // Encrypt with default key
      const text = 'test string';
      const encrypted1 = encrypt(text);

      // Change key and try to decrypt
      process.env.ENCRYPTION_KEY = 'different-key';
      expect(() => decrypt(encrypted1)).toThrow();

      // Encrypt with new key
      const encrypted2 = encrypt(text);
      expect(encrypted2).not.toBe(encrypted1);
      
      // Should decrypt successfully with new key
      const decrypted = decrypt(encrypted2);
      expect(decrypted).toBe(text);
    });
  });
}); 