interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor?: number;
  jitter?: boolean;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  factor: 2,
  jitter: true,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...defaultOptions, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries) {
        break;
      }

      const delay = calculateDelay(attempt, config);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const factor = options.factor || 2;
  const baseDelay = options.initialDelay * Math.pow(factor, attempt);
  
  if (options.jitter) {
    // Add random jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * baseDelay;
    return Math.min(baseDelay + jitter, options.maxDelay);
  }
  
  return Math.min(baseDelay, options.maxDelay);
}

export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableError) {
    return true;
  }
  if (error instanceof NonRetryableError) {
    return false;
  }
  if (error instanceof Error) {
    // Default retryable error patterns
    const retryablePatterns = [
      /network error/i,
      /timeout/i,
      /connection refused/i,
      /service unavailable/i,
      /too many requests/i,
      /rate limit/i,
    ];
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }
  return false;
} 