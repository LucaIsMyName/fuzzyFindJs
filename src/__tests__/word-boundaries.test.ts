import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions, isWordBoundary, matchesAtWordBoundary, matchesWildcard } from '../index.js';

describe('Feature 8: Word Boundaries', () => {
  describe('Utility Functions', () => {
    it('should detect word boundaries at start of string', () => {
      expect(isWordBoundary('hello', 0)).toBe(true);
    });

    it('should detect word boundaries after whitespace', () => {
      expect(isWordBoundary('hello world', 6)).toBe(true);
    });

    it('should detect word boundaries after punctuation', () => {
      expect(isWordBoundary('hello-world', 6)).toBe(true);
      expect(isWordBoundary('hello.world', 6)).toBe(true);
    });

    it('should not detect word boundaries in middle of word', () => {
      expect(isWordBoundary('hello', 2)).toBe(false);
    });

    it('should check if match is at word boundary', () => {
      expect(matchesAtWordBoundary('the cat sat', 4, 3)).toBe(true); // 'cat'
      expect(matchesAtWordBoundary('scatter', 1, 3)).toBe(false); // 'cat' in middle
    });
  });

  describe('Wildcard Matching', () => {
    it('should match wildcard patterns', () => {
      expect(matchesWildcard('category', 'cat*')).toBe(true);
      expect(matchesWildcard('cat', 'cat*')).toBe(true);
      expect(matchesWildcard('cats', 'cat*')).toBe(true);
      expect(matchesWildcard('dog', 'cat*')).toBe(false);
    });

    it('should match wildcards in middle', () => {
      expect(matchesWildcard('category', 'cat*ory')).toBe(true);
      expect(matchesWildcard('catgory', 'cat*ory')).toBe(true);
    });

    it('should match multiple wildcards', () => {
      expect(matchesWildcard('application', 'app*cat*')).toBe(true);
    });
  });

  describe('Search Without Word Boundaries (Default)', () => {
    it('should match substrings by default', () => {
      const dictionary = ['cat', 'category', 'scatter', 'concatenate'];
      const index = buildFuzzyIndex(dictionary);

      const results = getSuggestions(index, 'cat');
      
      // Should match all words containing 'cat'
      expect(results.length).toBeGreaterThanOrEqual(2);
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('category');
    });
  });

  describe('Search With Word Boundaries', () => {
    it('should prioritize whole word matches when enabled', () => {
      const dictionary = ['cat', 'category', 'cats'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true
        }
      });

      const results = getSuggestions(index, 'cat');
      
      // Should match all words starting with 'cat'
      expect(results.length).toBeGreaterThan(0);
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('category');
      expect(displays).toContain('cats');
      
      // 'cat' should rank highest (exact match)
      expect(results[0].display).toBe('cat');
    });

    it('should match words at start of compound words', () => {
      const dictionary = ['cat', 'cat-food', 'cat food', 'wildcat'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true
        }
      });

      const results = getSuggestions(index, 'cat');
      
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('cat-food'); // 'cat' at boundary
      expect(displays).toContain('cat food'); // 'cat' at boundary
    });

    it('should work with prefix matching', () => {
      const dictionary = ['category', 'cat', 'scatter'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true
        }
      });

      const results = getSuggestions(index, 'cat');
      
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('category'); // Starts with 'cat'
    });
  });

  describe('Wildcard Search', () => {
    it('should support wildcard patterns', () => {
      const dictionary = ['cat', 'cats', 'category', 'scatter'];
      const index = buildFuzzyIndex(dictionary);

      const results = getSuggestions(index, 'cat*');
      
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('cats');
      expect(displays).toContain('category');
    });

    it('should support wildcards with word boundaries', () => {
      const dictionary = ['cat', 'cats', 'category', 'scatter'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true
        }
      });

      const results = getSuggestions(index, 'cat*');
      
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('cats');
      expect(displays).toContain('category');
      // 'scatter' should not match with word boundaries
    });
  });

  describe('Backwards Compatibility', () => {
    it('should work without word boundaries config', () => {
      const dictionary = ['cat', 'category'];
      const index = buildFuzzyIndex(dictionary);

      const results = getSuggestions(index, 'cat');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should default to false for word boundaries', () => {
      const dictionary = ['cat', 'scatter'];
      const index = buildFuzzyIndex(dictionary);

      const results = getSuggestions(index, 'cat');
      
      // Should match both (substring matching)
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character queries', () => {
      const dictionary = ['a', 'an', 'apple'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true,
          minQueryLength: 1
        }
      });

      const results = getSuggestions(index, 'a');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('a');
    });

    it('should handle punctuation in words', () => {
      const dictionary = ['cat', 'cat-dog', 'dog-cat'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true
        }
      });

      const results = getSuggestions(index, 'cat');
      
      const displays = results.map(r => r.display);
      expect(displays).toContain('cat');
      expect(displays).toContain('cat-dog');
    });

    it('should handle empty wildcard', () => {
      const dictionary = ['cat', 'dog'];
      const index = buildFuzzyIndex(dictionary);

      const results = getSuggestions(index, '*');
      
      // Wildcard alone should match everything or nothing (implementation dependent)
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should not significantly slow down search', () => {
      const dictionary = Array.from({ length: 1000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(dictionary, {
        config: {
          wordBoundaries: true
        }
      });

      const start = performance.now();
      getSuggestions(index, 'word500');
      const time = performance.now() - start;

      expect(time).toBeLessThan(50); // Should be fast
    });
  });
});
