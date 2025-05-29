import { Cache } from '../cache';

describe('Cache', () => {
  let cache: Cache<string>;
  
  beforeEach(() => {
    jest.useFakeTimers();
    cache = new Cache({ maxSize: 3, ttl: 1000 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should correctly check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('TTL behavior', () => {
    it('should expire items after TTL', () => {
      cache.set('key1', 'value1');
      
      jest.advanceTimersByTime(500);
      expect(cache.get('key1')).toBe('value1');
      
      jest.advanceTimersByTime(501);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should update lastAccessed on get', () => {
      cache.set('key1', 'value1');
      
      jest.advanceTimersByTime(500);
      cache.get('key1'); // This should update lastAccessed
      
      jest.advanceTimersByTime(500);
      expect(cache.get('key1')).toBe('value1'); // Should still be valid
      
      jest.advanceTimersByTime(501);
      expect(cache.get('key1')).toBeUndefined(); // Now it should expire
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when cache is full', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add new item, should evict key2 (least recently used)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('cache statistics', () => {
    it('should return correct statistics', () => {
      const stats = cache.getStats();
      expect(stats).toEqual({
        size: 0,
        maxSize: 3,
        ttl: 1000
      });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const updatedStats = cache.getStats();
      expect(updatedStats).toEqual({
        size: 2,
        maxSize: 3,
        ttl: 1000
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values', () => {
      cache.set('key1', undefined as any);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should handle setting same key multiple times', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should handle deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });
}); 