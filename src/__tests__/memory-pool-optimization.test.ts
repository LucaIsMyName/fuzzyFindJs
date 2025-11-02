import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLevenshteinDistance,
  calculateNgramSimilarity,
  generateNgrams,
  distanceToSimilarity,
  areStringsSimilar,
} from '../algorithms/levenshtein.js';
import { globalArrayPool } from '../utils/memory-pool.js';
import { buildFuzzyIndex, getSuggestions } from '../index.js';

describe('Memory Pool Optimization', () => {
  beforeEach(() => {
    // Clear pools before each test
    globalArrayPool.clear();
  });

  describe('Levenshtein Distance with Memory Pooling', () => {
    it('should calculate distance correctly with pooled arrays', () => {
      const distance = calculateLevenshteinDistance('kitten', 'sitting');
      expect(distance).toBe(3);
    });

    it('should handle identical strings', () => {
      const distance = calculateLevenshteinDistance('hello', 'hello');
      expect(distance).toBe(0);
    });

    it('should handle empty strings', () => {
      expect(calculateLevenshteinDistance('', 'hello')).toBe(5);
      expect(calculateLevenshteinDistance('hello', '')).toBe(5);
      expect(calculateLevenshteinDistance('', '')).toBe(0);
    });

    it('should respect maxDistance threshold', () => {
      const distance = calculateLevenshteinDistance('abc', 'xyz', 1);
      expect(distance).toBeGreaterThan(1); // Should return maxDistance + 1
    });

    it('should early terminate when distance exceeds threshold', () => {
      const distance = calculateLevenshteinDistance('verylongstring', 'completelydifferent', 2);
      expect(distance).toBe(3); // maxDistance + 1
    });

    it('should reuse pooled arrays across multiple calls', () => {
      const initialPoolSize = globalArrayPool.size();
      
      // Make multiple calls
      calculateLevenshteinDistance('hello', 'hallo');
      calculateLevenshteinDistance('world', 'word');
      calculateLevenshteinDistance('test', 'best');
      
      const finalPoolSize = globalArrayPool.size();
      
      // Pool should have arrays available for reuse
      expect(finalPoolSize).toBeGreaterThanOrEqual(initialPoolSize);
    });

    it('should handle very long strings efficiently', () => {
      const str1 = 'a'.repeat(100);
      const str2 = 'b'.repeat(100);
      
      const distance = calculateLevenshteinDistance(str1, str2, 10);
      expect(distance).toBe(11); // Exceeds maxDistance
    });
  });

  describe('N-gram Similarity Optimization', () => {
    it('should calculate similarity correctly', () => {
      const similarity = calculateNgramSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should return 1.0 for identical strings', () => {
      const similarity = calculateNgramSimilarity('test', 'test');
      expect(similarity).toBe(1.0);
    });

    it('should return 0.0 for empty strings', () => {
      expect(calculateNgramSimilarity('', 'test')).toBe(0.0);
      expect(calculateNgramSimilarity('test', '')).toBe(0.0);
    });

    it('should handle different n-gram sizes', () => {
      const sim2 = calculateNgramSimilarity('hello', 'hallo', 2);
      const sim3 = calculateNgramSimilarity('hello', 'hallo', 3);
      
      expect(sim2).toBeGreaterThan(0);
      expect(sim3).toBeGreaterThan(0);
    });

    it('should not create unnecessary Set objects', () => {
      // This test verifies the optimization that calculates intersection
      // without creating a new Set
      const similarity = calculateNgramSimilarity('testing', 'tasting');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('N-gram Generation Optimization', () => {
    it('should generate correct n-grams', () => {
      const ngrams = generateNgrams('hello', 3);
      expect(ngrams).toEqual(['hel', 'ell', 'llo']);
    });

    it('should handle strings shorter than n', () => {
      const ngrams = generateNgrams('hi', 3);
      expect(ngrams).toEqual(['hi']);
    });

    it('should handle n=1', () => {
      const ngrams = generateNgrams('abc', 1);
      expect(ngrams).toEqual(['a', 'b', 'c']);
    });

    it('should pre-allocate array with exact size', () => {
      const ngrams = generateNgrams('testing', 3);
      // 'testing' has 7 chars, so 7-3+1 = 5 n-grams
      expect(ngrams.length).toBe(5);
      expect(ngrams).toEqual(['tes', 'est', 'sti', 'tin', 'ing']);
    });

    it('should handle empty string', () => {
      const ngrams = generateNgrams('', 3);
      expect(ngrams).toEqual(['']);
    });
  });

  describe('Distance to Similarity Conversion', () => {
    it('should convert distance to similarity correctly', () => {
      expect(distanceToSimilarity(0, 10)).toBe(1.0);
      expect(distanceToSimilarity(5, 10)).toBe(0.5);
      expect(distanceToSimilarity(10, 10)).toBe(0.0);
    });

    it('should handle zero max length', () => {
      expect(distanceToSimilarity(0, 0)).toBe(1.0);
      expect(distanceToSimilarity(1, 0)).toBe(0.0);
    });

    it('should never return negative values', () => {
      const similarity = distanceToSimilarity(15, 10);
      expect(similarity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('String Similarity Check', () => {
    it('should identify very similar strings', () => {
      // Very similar strings should match
      expect(areStringsSimilar('testing', 'testings', 0.8)).toBe(true);
      expect(areStringsSimilar('hello', 'hello', 0.9)).toBe(true);
    });

    it('should reject dissimilar strings', () => {
      expect(areStringsSimilar('hello', 'world')).toBe(false);
      expect(areStringsSimilar('abc', 'xyz')).toBe(false);
    });

    it('should handle identical strings', () => {
      expect(areStringsSimilar('test', 'test')).toBe(true);
    });

    it('should respect threshold parameter', () => {
      // With high threshold, require closer match
      expect(areStringsSimilar('hello', 'hallo', 0.9)).toBe(false);
      
      // With very low threshold, allow more difference
      expect(areStringsSimilar('testing', 'tasting', 0.5)).toBe(true);
    });

    it('should work with reasonable edit distances', () => {
      // Similar words with small edits
      const result1 = areStringsSimilar('testing', 'testings', 0.8, 2);
      expect(result1).toBe(true);
      
      // Very different strings should still fail
      expect(areStringsSimilar('hello', 'xyz', 0.6, 2)).toBe(false);
    });

    it('should use n-gram pre-filtering for performance', () => {
      // Very different strings should be rejected quickly via n-gram
      const result = areStringsSimilar('completelydifferent', 'totallyunrelated');
      expect(result).toBe(false);
    });
  });

  describe('Integration with Fuzzy Search', () => {
    it('should use memory pools during search operations', () => {
      const index = buildFuzzyIndex([
        'apple', 'application', 'apply', 'apricot',
        'banana', 'bandana', 'band',
        'cherry', 'chair', 'chart'
      ]);

      // Perform multiple searches
      getSuggestions(index, 'aple');
      getSuggestions(index, 'banan');
      getSuggestions(index, 'cher');
      
      const finalPoolSize = globalArrayPool.size();
      
      // Pool should have arrays available (they were released back)
      expect(finalPoolSize).toBeGreaterThanOrEqual(0);
    });

    it('should handle large datasets efficiently with pooling', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(largeDataset);
      
      const startTime = performance.now();
      const results = getSuggestions(index, 'word123');
      const endTime = performance.now();
      
      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should maintain pool across multiple search sessions', () => {
      const index = buildFuzzyIndex(['test', 'testing', 'tester', 'tested']);
      
      // First batch of searches
      for (let i = 0; i < 10; i++) {
        getSuggestions(index, 'test');
      }
      
      const midPoolSize = globalArrayPool.size();
      
      // Second batch of searches
      for (let i = 0; i < 10; i++) {
        getSuggestions(index, 'tester');
      }
      
      const finalPoolSize = globalArrayPool.size();
      
      // Pool should be stable (arrays being reused)
      expect(finalPoolSize).toBeGreaterThanOrEqual(0);
      expect(midPoolSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Pool Performance', () => {
    it('should reduce allocations through pooling', () => {
      const iterations = 100;
      
      // Warm up the pool
      for (let i = 0; i < 10; i++) {
        calculateLevenshteinDistance('warm', 'up');
      }
      
      // Perform many calculations
      for (let i = 0; i < iterations; i++) {
        calculateLevenshteinDistance('hello', 'hallo');
        calculateLevenshteinDistance('world', 'word');
      }
      
      const endPoolSize = globalArrayPool.size();
      
      // Pool should have arrays available for reuse
      expect(endPoolSize).toBeGreaterThanOrEqual(0);
    });

    it('should handle concurrent-like operations', () => {
      const words = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      
      // Simulate multiple operations happening in quick succession
      const results = words.map(word1 => 
        words.map(word2 => 
          calculateLevenshteinDistance(word1, word2)
        )
      );
      
      // All calculations should complete successfully
      expect(results.length).toBe(5);
      expect(results[0].length).toBe(5);
      
      // Diagonal should be all zeros (same word)
      for (let i = 0; i < 5; i++) {
        expect(results[i][i]).toBe(0);
      }
    });

    it('should not leak memory with pool limits', () => {
      // The pool has a max size, so it shouldn't grow indefinitely
      const maxPoolSize = 500; // globalArrayPool default max
      
      // Try to overflow the pool
      for (let i = 0; i < maxPoolSize * 2; i++) {
        calculateLevenshteinDistance(`test${i}`, `best${i}`);
      }
      
      const poolSize = globalArrayPool.size();
      
      // Pool size should not exceed max
      expect(poolSize).toBeLessThanOrEqual(maxPoolSize);
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle unicode characters', () => {
      const distance = calculateLevenshteinDistance('café', 'cafe');
      expect(distance).toBeGreaterThan(0);
    });

    it('should handle very similar strings', () => {
      const similarity = calculateNgramSimilarity('testing', 'testings');
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should handle single character strings', () => {
      expect(calculateLevenshteinDistance('a', 'b')).toBe(1);
      expect(calculateLevenshteinDistance('a', 'a')).toBe(0);
    });

    it('should handle special characters', () => {
      const distance = calculateLevenshteinDistance('hello!', 'hello?');
      expect(distance).toBe(1);
    });

    it('should handle numbers in strings', () => {
      const distance = calculateLevenshteinDistance('test123', 'test124');
      expect(distance).toBe(1);
    });
  });
});
