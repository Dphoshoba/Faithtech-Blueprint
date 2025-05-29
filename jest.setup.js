// Mock environment variables
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.LOG_LEVEL = 'error'; // Minimize noise in tests

// Mock timers globally
jest.useFakeTimers(); 