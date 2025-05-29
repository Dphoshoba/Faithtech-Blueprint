import logger from './logger';

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  lastAccessed: number;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
  }

  set(key: string, value: T): void {
    this.evictExpired();
    
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
    
    logger.debug(`Cache entry set: ${key}`);
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      logger.debug(`Cache entry expired: ${key}`);
      return undefined;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    logger.debug(`Cache hit: ${key}`);
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    logger.debug(`Cache entry deleted: ${key}`);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  size(): number {
    this.evictExpired();
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  private evictExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        logger.debug(`Expired cache entry evicted: ${key}`);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`LRU cache entry evicted: ${oldestKey}`);
    }
  }

  // Helper method to get cache statistics
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
} 