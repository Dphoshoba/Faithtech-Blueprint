import logger from './logger';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: Array<string | RegExp>;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
    /^5\d{2}$/,  // 5XX errors
    'rate limit',
    'timeout'
  ],
  onRetry: () => {}
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let attempt = 1;

  const isRetryableError = (error: Error): boolean => {
    const errorString = error.message.toLowerCase();
    return opts.retryableErrors.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(errorString);
      }
      return errorString.includes(pattern.toLowerCase());
    });
  };

  const calculateDelay = (attemptNumber: number): number => {
    const delay = opts.initialDelay * Math.pow(opts.backoffFactor, attemptNumber - 1);
    return Math.min(delay, opts.maxDelay);
  };

  while (attempt <= opts.maxAttempts) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === opts.maxAttempts) {
        break;
      }

      const delay = calculateDelay(attempt);
      logger.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`
      );
      
      opts.onRetry(error, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new RetryError(
    `Operation failed after ${attempt} attempts`,
    attempt,
    lastError!
  );
}

export async function retryWithFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await retry(operation, options);
  } catch (error) {
    logger.warn('Primary operation failed, attempting fallback:', error);
    return fallback();
  }
}

export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return retry(() => fn(...args), options);
  }) as T;
}

// Helper to create a retry-wrapped API client
export function createRetryableClient<T extends object>(
  client: T,
  options: RetryOptions = {}
): T {
  const handler: ProxyHandler<T> = {
    get: (target: any, prop: string) => {
      if (typeof target[prop] === 'function') {
        return withRetry(target[prop].bind(target), options);
      }
      return target[prop];
    }
  };

  return new Proxy(client, handler);
} 