const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

// Cache keys
const CACHE_KEYS = {
  TRENDING: 'templates:trending',
  PERSONALIZED: (userId) => `templates:personalized:${userId}`,
  SIMILAR: (templateId) => `templates:similar:${templateId}`
};

// Cache durations (in seconds)
const CACHE_DURATION = {
  TRENDING: 3600, // 1 hour
  PERSONALIZED: 1800, // 30 minutes
  SIMILAR: 3600 // 1 hour
};

// Get cached data
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

// Set cache with expiry
const setCache = async (key, data, duration) => {
  try {
    await redis.setex(key, duration, JSON.stringify(data));
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

// Clear cache by pattern
const clearCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
};

module.exports = {
  redis,
  CACHE_KEYS,
  CACHE_DURATION,
  getCache,
  setCache,
  clearCache
}; 