import crypto from 'crypto';
import logger from './logger';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-please-change-in-production';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ENCODING = 'hex';

interface EncryptedData {
  iv: string;
  salt: string;
  tag: string;
  encryptedData: string;
}

function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    100000, // iterations
    32, // key length
    'sha512'
  );
}

export function encrypt(text: string): string {
  try {
    // Generate salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key using salt
    const key = deriveKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(text, 'utf8')),
      cipher.final()
    ]);
    
    // Get auth tag
    const tag = cipher.getAuthTag();
    
    // Create encrypted data object
    const encryptedData: EncryptedData = {
      iv: iv.toString(ENCODING),
      salt: salt.toString(ENCODING),
      tag: tag.toString(ENCODING),
      encryptedData: encrypted.toString(ENCODING)
    };
    
    // Return JSON string of encrypted data
    return JSON.stringify(encryptedData);
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    // Parse encrypted data
    const encryptedData: EncryptedData = JSON.parse(encryptedText);
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(encryptedData.iv, ENCODING);
    const salt = Buffer.from(encryptedData.salt, ENCODING);
    const tag = Buffer.from(encryptedData.tag, ENCODING);
    const encrypted = Buffer.from(encryptedData.encryptedData, ENCODING);
    
    // Derive key using salt
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the text
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Test if encryption is working
function testEncryption() {
  try {
    const testString = 'test-encryption-123';
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    
    if (testString !== decrypted) {
      throw new Error('Encryption test failed: decrypted text does not match original');
    }
    
    logger.info('Encryption test passed successfully');
  } catch (error) {
    logger.error('Encryption test failed:', error);
    throw error;
  }
}

// Run test on module load
testEncryption(); 