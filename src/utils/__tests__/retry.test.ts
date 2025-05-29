import { retry, retryWithFallback, withRetry, createRetryableClient, RetryError } from '../retry';

describe('Retry Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('retry', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await retry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed eventually', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success');

      const result = retry(operation);
      
      // Fast-forward through retries
      for (let i = 0; i < 2; i++) {
        jest.advanceTimersByTime(1000 * Math.pow(2, i));
        await Promise.resolve();
      }

      expect(await result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect maxAttempts option', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      const maxAttempts = 2;

      const promise = retry(operation, { maxAttempts });
      
      // Fast-forward through retries
      for (let i = 0; i < maxAttempts - 1; i++) {
        jest.advanceTimersByTime(1000 * Math.pow(2, i));
        await Promise.resolve();
      }

      await expect(promise).rejects.toThrow(RetryError);
      expect(operation).toHaveBeenCalledTimes(maxAttempts);
    });

    it('should not retry on non-retryable errors', async () => {
      const error = new Error('Non-retryable error');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(retry(operation)).rejects.toThrow(RetryError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback for each retry', async () => {
      const onRetry = jest.fn();
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');

      const result = retry(operation, { onRetry });
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(await result).toBe('success');
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryWithFallback', () => {
    it('should use fallback when primary operation fails', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await retryWithFallback(primary, fallback);
      
      expect(result).toBe('fallback');
      expect(primary).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it('should not use fallback when primary succeeds', async () => {
      const primary = jest.fn().mockResolvedValue('success');
      const fallback = jest.fn();

      const result = await retryWithFallback(primary, fallback);
      
      expect(result).toBe('success');
      expect(fallback).not.toHaveBeenCalled();
    });
  });

  describe('withRetry', () => {
    it('should create retry-wrapped function', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');
      
      const wrapped = withRetry(fn);
      const result = wrapped('arg1', 'arg2');
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(await result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('createRetryableClient', () => {
    it('should wrap client methods with retry', async () => {
      const client = {
        method: jest.fn()
          .mockRejectedValueOnce(new Error('ECONNRESET'))
          .mockResolvedValue('success'),
        property: 'value'
      };

      const retryableClient = createRetryableClient(client);
      
      // Properties should remain unchanged
      expect(retryableClient.property).toBe('value');
      
      // Methods should be wrapped
      const result = retryableClient.method();
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(await result).toBe('success');
      expect(client.method).toHaveBeenCalledTimes(2);
    });
  });

  describe('exponential backoff', () => {
    it('should use exponential delays between retries', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new Error('ECONNRESET'));
      
      const promise = retry(operation, { maxAttempts: 4 });
      
      // First retry should be after 1000ms
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(2);

      // Second retry should be after 2000ms
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(3);

      // Third retry should be after 4000ms
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(4);

      await expect(promise).rejects.toThrow(RetryError);
    });

    it('should respect maxDelay option', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
      
      const promise = retry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 2000
      });
      
      // First retry should be after 1000ms
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Second retry should be capped at 2000ms
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow(RetryError);
    });
  });
}); 