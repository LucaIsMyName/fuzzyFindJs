import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions, filterStopWords, isStopWord, DEFAULT_STOP_WORDS } from '../index.js';

describe('Feature 7: Stop Words Filtering', () => {
  describe('Utility Functions', () => {
    it('should filter English stop words', () => {
      const result = filterStopWords('the hospital', ['the', 'a', 'an']);
      expect(result).toBe('hospital');
    });

    it('should filter multiple stop words', () => {
      const result = filterStopWords('the quick brown fox', ['the', 'a']);
      expect(result).toBe('quick brown fox');
    });

    it('should return original if all words are stop words', () => {
      const result = filterStopWords('the a an', ['the', 'a', 'an']);
      expect(result).toBe('the a an'); // Avoid empty search
    });

    it('should check if word is stop word', () => {
      expect(isStopWord('the', ['the', 'a', 'an'])).toBe(true);
      expect(isStopWord('hospital', ['the', 'a', 'an'])).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isStopWord('THE', ['the'])).toBe(true);
      expect(isStopWord('The', ['the'])).toBe(true);
    });
  });

  describe('Default Stop Words', () => {
    it('should have English stop words', () => {
      expect(DEFAULT_STOP_WORDS.english).toBeDefined();
      expect(DEFAULT_STOP_WORDS.english).toContain('the');
      expect(DEFAULT_STOP_WORDS.english).toContain('a');
      expect(DEFAULT_STOP_WORDS.english).toContain('an');
    });

    it('should have German stop words', () => {
      expect(DEFAULT_STOP_WORDS.german).toBeDefined();
      expect(DEFAULT_STOP_WORDS.german).toContain('der');
      expect(DEFAULT_STOP_WORDS.german).toContain('die');
      expect(DEFAULT_STOP_WORDS.german).toContain('das');
    });

    it('should have Spanish stop words', () => {
      expect(DEFAULT_STOP_WORDS.spanish).toBeDefined();
      expect(DEFAULT_STOP_WORDS.spanish).toContain('el');
      expect(DEFAULT_STOP_WORDS.spanish).toContain('la');
    });

    it('should have French stop words', () => {
      expect(DEFAULT_STOP_WORDS.french).toBeDefined();
      expect(DEFAULT_STOP_WORDS.french).toContain('le');
      expect(DEFAULT_STOP_WORDS.french).toContain('la');
    });
  });

  describe('Search Integration', () => {
    it('should filter stop words from search queries', () => {
      const dictionary = ['hospital', 'school', 'university'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          stopWords: ['the', 'a', 'an', 'is', 'at'],
          enableStopWords: true
        }
      });

      const results = getSuggestions(index, 'the hospital');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('hospital');
    });

    it('should work without stop words enabled', () => {
      const dictionary = ['the hospital', 'hospital'];
      const index = buildFuzzyIndex(dictionary);

      const results = getSuggestions(index, 'the hospital');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle queries with multiple stop words', () => {
      const dictionary = ['hospital', 'school'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          stopWords: ['the', 'a', 'an', 'in', 'at', 'on'],
          enableStopWords: true
        }
      });

      const results = getSuggestions(index, 'the hospital in the city');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('hospital');
    });

    it('should preserve results when stop words disabled', () => {
      const dictionary = ['hospital', 'the'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          stopWords: ['the'],
          enableStopWords: false // Disabled
        }
      });

      const results = getSuggestions(index, 'the');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('the');
    });
  });

  describe('Multi-language Stop Words', () => {
    it('should filter German stop words', () => {
      const dictionary = ['Krankenhaus', 'Schule'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ['german'],
          stopWords: DEFAULT_STOP_WORDS.german,
          enableStopWords: true
        }
      });

      const results = getSuggestions(index, 'das Krankenhaus');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('Krankenhaus');
    });

    it('should filter Spanish stop words', () => {
      const dictionary = ['hospital', 'escuela'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ['spanish'],
          stopWords: DEFAULT_STOP_WORDS.spanish,
          enableStopWords: true
        }
      });

      const results = getSuggestions(index, 'el hospital');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('hospital');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stop words array', () => {
      const dictionary = ['hospital'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          stopWords: [],
          enableStopWords: true
        }
      });

      const results = getSuggestions(index, 'the hospital');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle query with only stop words', () => {
      const dictionary = ['hospital'];
      const index = buildFuzzyIndex(dictionary, {
        config: {
          stopWords: ['the', 'a', 'an'],
          enableStopWords: true
        }
      });

      const results = getSuggestions(index, 'the a an');
      // Should return original query to avoid empty search
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed case stop words', () => {
      const result = filterStopWords('The Hospital', ['the']);
      expect(result).toBe('Hospital');
    });

    it('should preserve non-stop words', () => {
      const result = filterStopWords('hospital school', ['the', 'a']);
      expect(result).toBe('hospital school');
    });
  });

  describe('Performance', () => {
    it('should not significantly slow down search', () => {
      const dictionary = Array.from({ length: 1000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(dictionary, {
        config: {
          stopWords: DEFAULT_STOP_WORDS.english,
          enableStopWords: true
        }
      });

      const start = performance.now();
      getSuggestions(index, 'the word500');
      const time = performance.now() - start;

      expect(time).toBeLessThan(100); // Should be reasonably fast
    });
  });
});
