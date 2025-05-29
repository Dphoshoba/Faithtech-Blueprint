import { RateLimiter, createProviderRateLimiter } from '../rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rate limiting', () => {
    it('should allow requests within rate limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        timeWindow: 1000
      });

      const operation = jest.fn().mockResolvedValue('success');

      // First request should pass
      await limiter.execute(operation);
      expect(operation).toHaveBeenCalledTimes(1);

      // Second request should pass
      await limiter.execute(operation);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should delay requests that exceed rate limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        timeWindow: 1000
      });

      const operation = jest.fn().mockResolvedValue('success');

      // Make two requests that should pass immediately
      await limiter.execute(operation);
      await limiter.execute(operation);
      expect(operation).toHaveBeenCalledTimes(2);

      // Third request should be delayed
      const thirdRequest = limiter.execute(operation);
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      await thirdRequest;
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed operations', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        timeWindow: 1000,
        retryAttempts: 3,
        retryDelay: 1000
      });

      const error = new Error('Rate limit exceeded');
      error.message = 'rate limit';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await limiter.execute(operation);
      
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('should throw after max retries', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        timeWindow: 1000,
        retryAttempts: 2,
        retryDelay: 1000
      });

      const error = new Error('Rate limit exceeded');
      error.message = 'rate limit';
      
      const operation = jest.fn().mockRejectedValue(error);

      await expect(limiter.execute(operation)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('provider-specific rate limiters', () => {
    it('should create rate limiter with provider-specific config', () => {
      const providers = ['ccb', 'tithely', 'planningcenter', 'breeze'];
      
      providers.forEach(provider => {
        const limiter = createProviderRateLimiter(provider);
        expect(limiter).toBeInstanceOf(RateLimiter);
      });
    });

    it('should use default config for unknown provider', () => {
      const limiter = createProviderRateLimiter('unknown');
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('client wrapping', () => {
    it('should wrap client methods with rate limiting', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        timeWindow: 1000
      });

      const client = {
        method1: jest.fn().mockResolvedValue('result1'),
        method2: jest.fn().mockResolvedValue('result2'),
        property: 'value'
      };

      const wrappedClient = limiter.wrapClient(client);

      // Properties should remain unchanged
      expect(wrappedClient.property).toBe('value');

      // Methods should be rate limited
      await wrappedClient.method1();
      await wrappedClient.method2();
      
      expect(client.method1).toHaveBeenCalledTimes(1);
      expect(client.method2).toHaveBeenCalledTimes(1);

      // Third request should be delayed
      const thirdRequest = wrappedClient.method1();
      
      jest.advanceTimersByTime(1000);
      
      await thirdRequest;
      expect(client.method1).toHaveBeenCalledTimes(2);
    });
  });
}); 