import { setTimeout } from 'timers/promises';
import logger from './logger';

interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
}

interface RateLimitState {
  requests: number;
  windowStart: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private state: RateLimitState;

  constructor(config: RateLimitConfig) {
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    this.state = {
      requests: 0,
      windowStart: Date.now()
    };
  }

  private async waitForNextWindow(): Promise<void> {
    const now = Date.now();
    const windowElapsed = now - this.state.windowStart;
    
    if (windowElapsed < this.config.timeWindow) {
      const waitTime = this.config.timeWindow - windowElapsed;
      await setTimeout(waitTime);
      this.state.requests = 0;
      this.state.windowStart = Date.now();
    }
  }

  private shouldResetWindow(): boolean {
    const now = Date.now();
    return now - this.state.windowStart >= this.config.timeWindow;
  }

  private resetWindowIfNeeded(): void {
    if (this.shouldResetWindow()) {
      this.state.requests = 0;
      this.state.windowStart = Date.now();
    }
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'API call'
  ): Promise<T> {
    this.resetWindowIfNeeded();

    if (this.state.requests >= this.config.maxRequests) {
      logger.info(`Rate limit reached for ${context}, waiting for next window`);
      await this.waitForNextWindow();
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        this.state.requests++;
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if error is rate limit related
        if (error.response?.status === 429 || error.message.includes('rate limit')) {
          logger.warn(`Rate limit exceeded for ${context} on attempt ${attempt}`);
          
          if (attempt < this.config.retryAttempts!) {
            const delay = this.config.retryDelay! * attempt;
            logger.info(`Waiting ${delay}ms before retry`);
            await setTimeout(delay);
            continue;
          }
        }
        
        // If error is not rate limit related or we're out of retries, throw it
        throw error;
      }
    }

    throw lastError || new Error(`Failed to execute operation after ${this.config.retryAttempts} attempts`);
  }

  // Helper method to wrap an API client with rate limiting
  wrapClient<T extends object>(client: T): T {
    const handler: ProxyHandler<T> = {
      get: (target: any, prop: string) => {
        if (typeof target[prop] === 'function') {
          return async (...args: any[]) => {
            return this.execute(
              () => target[prop].apply(target, args),
              `${prop} operation`
            );
          };
        }
        return target[prop];
      }
    };

    return new Proxy(client, handler);
  }
}

// Create rate limiters for different providers
export const createProviderRateLimiter = (provider: string): RateLimiter => {
  const configs: Record<string, RateLimitConfig> = {
    ccb: {
      maxRequests: 100,
      timeWindow: 60 * 1000, // 1 minute
      retryAttempts: 3,
      retryDelay: 1000
    },
    tithely: {
      maxRequests: 120,
      timeWindow: 60 * 1000, // 1 minute
      retryAttempts: 3,
      retryDelay: 1000
    },
    planningcenter: {
      maxRequests: 100,
      timeWindow: 20 * 1000, // 20 seconds
      retryAttempts: 3,
      retryDelay: 1000
    },
    breeze: {
      maxRequests: 150,
      timeWindow: 60 * 1000, // 1 minute
      retryAttempts: 3,
      retryDelay: 1000
    }
  };

  const config = configs[provider.toLowerCase()] || {
    maxRequests: 60,
    timeWindow: 60 * 1000,
    retryAttempts: 3,
    retryDelay: 1000
  };

  return new RateLimiter(config);
}; 