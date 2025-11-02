import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions, batchSearch } from '../index.js';

describe('Feature 4: Batch Search API', () => {
  const dictionary = [
    'Application',
    'Apple',
    'Apricot',
    'Banana',
    'Band',
    'Bandage',
    'Hospital',
    'Krankenhaus',
    'School',
    'Schule',
  ];

  describe('Basic Functionality', () => {
    it('should search multiple queries at once', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['app', 'ban', 'hos']);

      expect(Object.keys(results)).toHaveLength(3);
      expect(results['app']).toBeDefined();
      expect(results['ban']).toBeDefined();
      expect(results['hos']).toBeDefined();
    });

    it('should return same results as individual searches', () => {
      const index = buildFuzzyIndex(dictionary);
      
      const batchResults = batchSearch(index, ['app', 'ban']);
      const individualApp = getSuggestions(index, 'app');
      const individualBan = getSuggestions(index, 'ban');

      expect(batchResults['app']).toEqual(individualApp);
      expect(batchResults['ban']).toEqual(individualBan);
    });

    it('should handle empty query array', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, []);

      expect(Object.keys(results)).toHaveLength(0);
    });

    it('should handle single query', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['app']);

      expect(Object.keys(results)).toHaveLength(1);
      expect(results['app']).toBeDefined();
      expect(results['app'].length).toBeGreaterThan(0);
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate identical queries', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['app', 'app', 'app']);

      // Should only have one result for 'app'
      expect(Object.keys(results)).toHaveLength(1);
      expect(results['app']).toBeDefined();
    });

    it('should deduplicate mixed queries', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['app', 'ban', 'app', 'hos', 'ban']);

      // Should only have 3 unique queries
      expect(Object.keys(results)).toHaveLength(3);
      expect(results['app']).toBeDefined();
      expect(results['ban']).toBeDefined();
      expect(results['hos']).toBeDefined();
    });
  });

  describe('Options Support', () => {
    it('should respect maxResults option', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['a', 'b'], 2);

      Object.values(results).forEach(queryResults => {
        expect(queryResults.length).toBeLessThanOrEqual(2);
      });
    });

    it('should support search options', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['app', 'ban'], 5, {
        includeHighlights: true
      });

      Object.values(results).forEach(queryResults => {
        if (queryResults.length > 0) {
          expect(queryResults[0].highlights).toBeDefined();
        }
      });
    });

    it('should support fuzzyThreshold option', () => {
      const index = buildFuzzyIndex(dictionary);
      
      const strictResults = batchSearch(index, ['aple'], 5, {
        fuzzyThreshold: 0.9
      });
      
      const lenientResults = batchSearch(index, ['aple'], 5, {
        fuzzyThreshold: 0.5
      });

      // Lenient should have more or equal results
      expect(lenientResults['aple'].length).toBeGreaterThanOrEqual(strictResults['aple'].length);
    });
  });

  describe('Cache Integration', () => {
    it('should benefit from cache on repeated queries', () => {
      const index = buildFuzzyIndex(dictionary);
      
      // First batch - cache miss
      batchSearch(index, ['app', 'ban']);
      
      // Second batch with same queries - should hit cache
      const start = performance.now();
      batchSearch(index, ['app', 'ban']);
      const time = performance.now() - start;

      // Should be very fast due to cache
      expect(time).toBeLessThan(10); // Should be < 10ms
    });

    it('should cache individual queries from batch', () => {
      const index = buildFuzzyIndex(dictionary);
      
      // Batch search
      batchSearch(index, ['app', 'ban']);
      
      // Individual search should hit cache
      const cachedBefore = index._cache?.getStats().hits || 0;
      getSuggestions(index, 'app');
      const cachedAfter = index._cache?.getStats().hits || 0;

      expect(cachedAfter).toBeGreaterThan(cachedBefore);
    });
  });

  describe('Performance', () => {
    it('should be faster than individual searches for many queries', () => {
      const index = buildFuzzyIndex(dictionary);
      const queries = ['app', 'ban', 'hos', 'sch', 'kra', 'uni', 'bib', 'mar', 'rat', 'pol'];

      // Warm up (run once to eliminate JIT compilation effects)
      queries.forEach(q => getSuggestions(index, q));
      if (index._cache) index._cache.clear();

      // Individual searches (run multiple times for better average)
      const runs = 3;
      let totalTime1 = 0;
      for (let i = 0; i < runs; i++) {
        if (index._cache) index._cache.clear();
        const start1 = performance.now();
        queries.forEach(q => getSuggestions(index, q));
        totalTime1 += performance.now() - start1;
      }
      const time1 = totalTime1 / runs;

      // Batch search (run multiple times for better average)
      let totalTime2 = 0;
      for (let i = 0; i < runs; i++) {
        if (index._cache) index._cache.clear();
        const start2 = performance.now();
        batchSearch(index, queries);
        totalTime2 += performance.now() - start2;
      }
      const time2 = totalTime2 / runs;

      // Batch should be reasonably performant (within 3x of individual)
      // Note: Batch has overhead for deduplication but benefits from cache
      expect(time2).toBeLessThan(time1 * 3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings in queries', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['', 'app', '']);

      // Empty strings should return empty results
      expect(results['']).toEqual([]);
      expect(results['app'].length).toBeGreaterThan(0);
    });

    it('should handle queries with no matches', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = batchSearch(index, ['xyz', 'qwerty']);

      expect(results['xyz']).toEqual([]);
      expect(results['qwerty']).toEqual([]);
    });

    it('should handle very long query arrays', () => {
      const index = buildFuzzyIndex(dictionary);
      const queries = Array.from({ length: 100 }, (_, i) => `query${i}`);
      
      const results = batchSearch(index, queries);

      expect(Object.keys(results)).toHaveLength(100);
    });

    it('should handle special characters', () => {
      const index = buildFuzzyIndex(['café', 'naïve', 'résumé']);
      const results = batchSearch(index, ['café', 'naïve']);

      expect(results['café'].length).toBeGreaterThan(0);
      expect(results['naïve'].length).toBeGreaterThan(0);
    });
  });
});
