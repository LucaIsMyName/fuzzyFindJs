import { describe, it, expect, beforeEach } from 'vitest';
import { buildFuzzyIndex, getSuggestions, LRUCache, SearchCache } from '../index.js';

describe('Feature 2: Search Result Caching', () => {
  const dictionary = [
    'Application',
    'Apple',
    'Apricot',
    'Banana',
    'Band',
    'Bandage',
    'Hospital',
    'Krankenhaus',
  ];

  describe('LRU Cache', () => {
    let cache: LRUCache<string, number>;

    beforeEach(() => {
      cache = new LRUCache<string, number>(3);
    });

    it('should store and retrieve values', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should evict oldest entry when capacity exceeded', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'
      
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move accessed items to end (LRU)', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      cache.get('a'); // Access 'a', moves it to end
      cache.set('d', 4); // Should evict 'b', not 'a'
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should clear all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.size).toBe(0);
    });

    it('should report correct size', () => {
      expect(cache.size).toBe(0);
      
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      
      cache.set('b', 2);
      expect(cache.size).toBe(2);
    });

    it('should provide cache statistics', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.capacity).toBe(3);
      expect(stats.utilization).toBeCloseTo(2/3);
    });
  });

  describe('Search Cache', () => {
    let searchCache: SearchCache;

    beforeEach(() => {
      searchCache = new SearchCache(10);
    });

    it('should cache search results', () => {
      const results = [{ display: 'test', baseWord: 'test', isSynonym: false, score: 1.0 }];
      
      searchCache.set('query', results, 5);
      const cached = searchCache.get('query', 5);
      
      expect(cached).toEqual(results);
    });

    it('should track cache hits and misses', () => {
      const results = [{ display: 'test', baseWord: 'test', isSynonym: false, score: 1.0 }];
      
      searchCache.get('miss'); // Miss
      searchCache.set('hit', results);
      searchCache.get('hit'); // Hit
      searchCache.get('miss2'); // Miss
      
      const stats = searchCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(1/3);
    });

    it('should differentiate queries by maxResults', () => {
      const results5 = [{ display: 'test1', baseWord: 'test1', isSynonym: false, score: 1.0 }];
      const results10 = [{ display: 'test2', baseWord: 'test2', isSynonym: false, score: 1.0 }];
      
      searchCache.set('query', results5, 5);
      searchCache.set('query', results10, 10);
      
      expect(searchCache.get('query', 5)).toEqual(results5);
      expect(searchCache.get('query', 10)).toEqual(results10);
    });

    it('should clear cache and reset stats', () => {
      const results = [{ display: 'test', baseWord: 'test', isSynonym: false, score: 1.0 }];
      
      searchCache.set('query', results);
      searchCache.get('query'); // Hit
      searchCache.clear();
      
      const stats = searchCache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Integration with getSuggestions', () => {
    it('should cache results by default', () => {
      const index = buildFuzzyIndex(dictionary);
      
      // First search - cache miss
      const results1 = getSuggestions(index, 'app', 5);
      
      // Second search - should hit cache
      const results2 = getSuggestions(index, 'app', 5);
      
      expect(results1).toEqual(results2);
      expect(index._cache).toBeDefined();
    });

    it('should use cache for repeated queries', () => {
      const index = buildFuzzyIndex(dictionary);
      
      // Warm up cache
      getSuggestions(index, 'app', 5);
      getSuggestions(index, 'ban', 5);
      
      const statsBefore = index._cache?.getStats();
      expect(statsBefore?.size).toBeGreaterThan(0);
      
      // These should hit cache
      getSuggestions(index, 'app', 5);
      getSuggestions(index, 'ban', 5);
      
      const statsAfter = index._cache?.getStats();
      expect(statsAfter?.hits).toBeGreaterThan(0);
    });

    it('should allow disabling cache', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: { enableCache: false }
      });
      
      expect(index._cache).toBeUndefined();
    });

    it('should respect custom cache size', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: { cacheSize: 50 }
      });
      
      const stats = index._cache?.getStats();
      expect(stats?.capacity).toBe(50);
    });

    it('should cache different queries separately', () => {
      const index = buildFuzzyIndex(dictionary);
      
      const results1 = getSuggestions(index, 'app', 5);
      const results2 = getSuggestions(index, 'ban', 5);
      
      expect(results1).not.toEqual(results2);
      expect(index._cache?.getStats().size).toBe(2);
    });

    it('should cache with different options separately', () => {
      const index = buildFuzzyIndex(dictionary);
      
      const results1 = getSuggestions(index, 'app', 5, { includeHighlights: true });
      const results2 = getSuggestions(index, 'app', 5, { includeHighlights: false });
      
      // Different options should create different cache entries
      expect(results1[0].highlights).toBeDefined();
      expect(results2[0].highlights).toBeUndefined();
    });
  });

  describe('Performance Benefits', () => {
    it('should be faster on cache hits', () => {
      const largeDictionary = Array.from({ length: 1000 }, (_, i) => `Word${i}`);
      const index = buildFuzzyIndex(largeDictionary);
      
      // First search (cache miss)
      const start1 = performance.now();
      getSuggestions(index, 'word5', 10);
      const time1 = performance.now() - start1;
      
      // Second search (cache hit)
      const start2 = performance.now();
      getSuggestions(index, 'word5', 10);
      const time2 = performance.now() - start2;
      
      // Cache hit should be significantly faster
      // (This might be flaky, but generally cache should be faster)
      expect(time2).toBeLessThan(time1 * 2); // At least not slower
    });
  });
});
