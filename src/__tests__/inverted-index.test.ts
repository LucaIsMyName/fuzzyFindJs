import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions } from '../index.js';

describe('Inverted Index - Backwards Compatibility', () => {
  const smallDictionary = [
    'Krankenhaus',
    'Pflegeheim',
    'Ambulanz',
    'Schule',
    'Kindergarten',
    'Hospital',
    'School',
    'Doctor'
  ];

  describe('Small datasets (< 10k words) - Classic Index', () => {
    it('should NOT use inverted index for small datasets by default', () => {
      const index = buildFuzzyIndex(smallDictionary);
      
      // Inverted index should NOT be built
      expect(index.invertedIndex).toBeUndefined();
      expect(index.documents).toBeUndefined();
      
      // Classic index should work
      expect(index.base).toHaveLength(smallDictionary.length);
      expect(index.variantToBase.size).toBeGreaterThan(0);
    });

    it('should find exact matches with classic index', () => {
      const index = buildFuzzyIndex(smallDictionary);
      const results = getSuggestions(index, 'Schule', 5);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('Schule');
      expect(results[0].score).toBeGreaterThan(0.9);
    });

    it('should find fuzzy matches with classic index', () => {
      const index = buildFuzzyIndex(smallDictionary);
      const results = getSuggestions(index, 'krankenh', 5);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('Krankenhaus');
    });
  });

  describe('Large datasets (>= 100k words) - Inverted Index Auto-Enable', () => {
    // Generate large dictionary
    const largeDictionary = Array.from({ length: 100000 }, (_, i) => `Word${i}`);

    it('should auto-enable inverted index for 100k+ words', () => {
      const index = buildFuzzyIndex(largeDictionary);
      
      // Inverted index SHOULD be built automatically
      expect(index.invertedIndex).toBeDefined();
      expect(index.documents).toBeDefined();
      expect(index.documents?.length).toBeGreaterThan(0);
      
      // Classic index should ALSO exist (backwards compat)
      expect(index.base).toHaveLength(largeDictionary.length);
    });

    it('should find exact matches with inverted index', () => {
      const index = buildFuzzyIndex(largeDictionary);
      const results = getSuggestions(index, 'Word5000', 5);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('Word5000');
      // Score should be very high (>0.9) for exact match
      expect(results[0].score).toBeGreaterThan(0.9);
    });

    it('should find prefix matches with inverted index', () => {
      const index = buildFuzzyIndex(largeDictionary);
      const results = getSuggestions(index, 'Word1', 10);
      
      expect(results.length).toBeGreaterThan(0);
      // Should find words starting with Word1 (Word1, Word10, Word100, etc.)
      expect(results.some(r => r.display.startsWith('Word1'))).toBe(true);
    });
  });

  describe('Force Inverted Index - Manual Override', () => {
    it('should allow forcing inverted index on small datasets', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        useInvertedIndex: true
      });
      
      // Inverted index SHOULD be built even for small dataset
      expect(index.invertedIndex).toBeDefined();
      expect(index.documents).toBeDefined();
    });

    it('should produce same results with forced inverted index', () => {
      const classicIndex = buildFuzzyIndex(smallDictionary);
      const invertedIndex = buildFuzzyIndex(smallDictionary, {
        useInvertedIndex: true
      });
      
      const query = 'krankenh';
      const classicResults = getSuggestions(classicIndex, query, 5);
      const invertedResults = getSuggestions(invertedIndex, query, 5);
      
      // Results should be similar (same top result)
      expect(classicResults.length).toBeGreaterThan(0);
      expect(invertedResults.length).toBeGreaterThan(0);
      expect(classicResults[0].display).toBe(invertedResults[0].display);
    });
  });

  describe('Multi-language Support with Inverted Index', () => {
    const multiLangDict = [
      'Krankenhaus', 'Hospital', 'Hôpital', 'Hospital',
      'Schule', 'School', 'École', 'Escuela'
    ];

    it('should work with multiple languages', () => {
      const index = buildFuzzyIndex(multiLangDict, {
        config: { languages: ['german', 'english', 'french', 'spanish'] },
        useInvertedIndex: true
      });
      
      expect(index.invertedIndex).toBeDefined();
      
      const germanResults = getSuggestions(index, 'kranken', 3);
      const englishResults = getSuggestions(index, 'hospit', 3);
      
      expect(germanResults.length).toBeGreaterThan(0);
      expect(englishResults.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Modes with Inverted Index', () => {
    it('should work with fast performance mode', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        config: { performance: 'fast' },
        useInvertedIndex: true
      });
      
      const results = getSuggestions(index, 'schul', 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should work with comprehensive performance mode', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        config: { performance: 'comprehensive' },
        useInvertedIndex: true
      });
      
      const results = getSuggestions(index, 'schul', 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        useInvertedIndex: true
      });
      
      const results = getSuggestions(index, '', 5);
      expect(results).toHaveLength(0);
    });

    it('should handle query shorter than minQueryLength', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        useInvertedIndex: true
      });
      
      const results = getSuggestions(index, 'a', 5);
      expect(results).toHaveLength(0);
    });

    it('should respect maxResults parameter', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        useInvertedIndex: true
      });
      
      const results = getSuggestions(index, 'a', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should handle case insensitive matching', () => {
      const index = buildFuzzyIndex(smallDictionary, {
        useInvertedIndex: true
      });
      
      const results = getSuggestions(index, 'SCHULE', 5);
      expect(results.length).toBeGreaterThan(0);
      // Check that 'Schule' is in the results (scoring may affect order)
      expect(results.some(r => r.display === 'Schule')).toBe(true);
    });
  });
});

describe('Inverted Index - Specific Features', () => {
  const testDict = ['Apple', 'Application', 'Apricot', 'Banana', 'Band', 'Bandage'];

  describe('Phonetic Matching', () => {
    it('should support phonetic matching with inverted index', () => {
      const index = buildFuzzyIndex(testDict, {
        config: { 
          languages: ['english'],
          features: ['phonetic', 'partial-words']
        },
        useInvertedIndex: true
      });
      
      expect(index.invertedIndex).toBeDefined();
      expect(index.invertedIndex?.phoneticToPostings.size).toBeGreaterThan(0);
    });
  });

  describe('N-gram Matching', () => {
    it('should support n-gram matching with inverted index', () => {
      const index = buildFuzzyIndex(testDict, {
        useInvertedIndex: true
      });
      
      expect(index.invertedIndex).toBeDefined();
      expect(index.invertedIndex?.ngramToPostings.size).toBeGreaterThan(0);
      
      const results = getSuggestions(index, 'app', 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Synonym Matching', () => {
    it('should support synonyms with inverted index', () => {
      const index = buildFuzzyIndex(['Doctor', 'Physician'], {
        config: {
          languages: ['english'],
          features: ['synonyms'],
          customSynonyms: {
            'doctor': ['physician', 'doc']
          }
        },
        useInvertedIndex: true
      });
      
      expect(index.invertedIndex).toBeDefined();
      expect(index.invertedIndex?.synonymToPostings.size).toBeGreaterThan(0);
    });
  });
});
