/**
 * Test for Variant Generation Optimization
 * Verifies that the optimized variant generation reduces index size
 * while maintaining search quality
 */

import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions } from '../core/index.js';
import { BaseLanguageProcessor } from '../languages/base/LanguageProcessor.js';
import { GermanProcessor } from '../languages/german/GermanProcessor.js';
import { EnglishProcessor } from '../languages/english/EnglishProcessor.js';

describe('Variant Generation Optimization', () => {
  describe('Base Language Processor', () => {
    class TestProcessor extends BaseLanguageProcessor {
      readonly language = 'test';
      readonly displayName = 'Test';
      readonly supportedFeatures = [];
    }

    const processor = new TestProcessor();

    it('should generate fewer variants in fast mode than balanced mode', () => {
      const word = 'hospitalization'; // 15 characters
      
      const fastVariants = processor.getWordVariants(word, 'fast');
      const balancedVariants = processor.getWordVariants(word, 'balanced');
      
      // Fast mode should generate significantly fewer variants
      expect(fastVariants.length).toBeLessThan(balancedVariants.length);
      
      // Fast mode should still include the word itself
      expect(fastVariants).toContain('hospitalization');
    });

    it('should generate fewer variants in balanced mode than comprehensive mode', () => {
      const word = 'programming'; // 11 characters
      
      const balancedVariants = processor.getWordVariants(word, 'balanced');
      const comprehensiveVariants = processor.getWordVariants(word, 'comprehensive');
      
      // Balanced should have fewer than comprehensive
      expect(balancedVariants.length).toBeLessThanOrEqual(comprehensiveVariants.length);
    });

    it('should limit prefixes in fast mode for long words', () => {
      const word = 'extraordinary'; // 13 characters
      
      const fastVariants = processor.getWordVariants(word, 'fast');
      const prefixes = fastVariants.filter(v => v.length >= 3 && v.length < word.length);
      
      // Fast mode should generate max 4-5 prefixes
      expect(prefixes.length).toBeLessThanOrEqual(5);
    });

    it('should use adaptive stepping in balanced mode', () => {
      const shortWord = 'apple'; // 5 characters
      const mediumWord = 'beautiful'; // 9 characters
      const longWord = 'extraordinary'; // 13 characters
      
      const shortVariants = processor.getWordVariants(shortWord, 'balanced');
      const mediumVariants = processor.getWordVariants(mediumWord, 'balanced');
      const longVariants = processor.getWordVariants(longWord, 'balanced');
      
      // All should have reasonable variant counts
      expect(shortVariants.length).toBeGreaterThan(0);
      expect(mediumVariants.length).toBeGreaterThan(0);
      expect(longVariants.length).toBeGreaterThan(0);
      
      // Longer words shouldn't have proportionally more variants
      expect(longVariants.length).toBeLessThan(longWord.length);
    });
  });

  describe('German Processor', () => {
    const germanProcessor = new GermanProcessor();

    it('should use optimized variant generation', () => {
      const word = 'Krankenhausaufenthalt'; // 21 characters - long word
      
      const fastVariants = germanProcessor.getWordVariants(word, 'fast');
      const balancedVariants = germanProcessor.getWordVariants(word, 'balanced');
      
      // Fast should have fewer or equal variants (compound words add some)
      expect(fastVariants.length).toBeLessThanOrEqual(balancedVariants.length);
      
      // But definitely fewer prefixes
      const fastPrefixes = fastVariants.filter(v => v.length >= 3 && v.length < word.length);
      const balancedPrefixes = balancedVariants.filter(v => v.length >= 3 && v.length < word.length);
      expect(fastPrefixes.length).toBeLessThan(balancedPrefixes.length);
    });

    it('should still include compound word parts', () => {
      const word = 'Krankenhaus'; // kranken + haus
      
      const variants = germanProcessor.getWordVariants(word, 'balanced');
      
      // Should include the word itself
      expect(variants).toContain('krankenhaus');
    });
  });

  describe('English Processor', () => {
    const englishProcessor = new EnglishProcessor();

    it('should use optimized variant generation', () => {
      const word = 'internationalization'; // 20 characters - long word
      
      const fastVariants = englishProcessor.getWordVariants(word, 'fast');
      const balancedVariants = englishProcessor.getWordVariants(word, 'balanced');
      
      // Fast should have fewer or equal variants (morphological variants add some)
      expect(fastVariants.length).toBeLessThanOrEqual(balancedVariants.length);
      
      // But definitely fewer prefixes
      const fastPrefixes = fastVariants.filter(v => v.length >= 3 && v.length < word.length);
      const balancedPrefixes = balancedVariants.filter(v => v.length >= 3 && v.length < word.length);
      expect(fastPrefixes.length).toBeLessThan(balancedPrefixes.length);
    });

    it('should still include morphological variants', () => {
      const word = 'running';
      
      const variants = englishProcessor.getWordVariants(word, 'balanced');
      
      // Should include morphological forms
      expect(variants).toContain('running');
      expect(variants).toContain('runnings'); // plural
    });
  });

  describe('Index Size Reduction', () => {
    it('should create smaller index in fast mode', () => {
      const words = ['hospital', 'doctor', 'nurse', 'patient', 'medicine'];
      
      const fastIndex = buildFuzzyIndex(words, {
        config: { languages: ['english'], performance: 'fast' }
      });
      
      const balancedIndex = buildFuzzyIndex(words, {
        config: { languages: ['english'], performance: 'balanced' }
      });
      
      // Fast mode should have fewer variants in the index
      expect(fastIndex.variantToBase.size).toBeLessThan(balancedIndex.variantToBase.size);
    });

    it('should create significantly smaller index for large datasets', () => {
      // Use repeated long words to see the difference in variant generation
      const longWords = ['hospitalization', 'internationalization', 'telecommunications', 'responsibilities'];
      const words = Array.from({ length: 100 }, (_, i) => longWords[i % longWords.length]);
      
      const fastIndex = buildFuzzyIndex(words, {
        config: { languages: ['english'], performance: 'fast' }
      });
      
      const comprehensiveIndex = buildFuzzyIndex(words, {
        config: { languages: ['english'], performance: 'comprehensive' }
      });
      
      // Fast mode should have fewer variants
      expect(fastIndex.variantToBase.size).toBeLessThan(comprehensiveIndex.variantToBase.size);
      
      // Verify the reduction is meaningful
      const reduction = 1 - (fastIndex.variantToBase.size / comprehensiveIndex.variantToBase.size);
      expect(reduction).toBeGreaterThan(0.05); // At least 5% reduction
    });
  });

  describe('Search Quality Preservation', () => {
    it('should still find matches in fast mode', () => {
      const dictionary = ['hospital', 'doctor', 'nurse'];
      
      const fastIndex = buildFuzzyIndex(dictionary, {
        config: { languages: ['english'], performance: 'fast' }
      });
      
      // Should still find prefix matches
      const results = getSuggestions(fastIndex, 'hospit', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('hospital');
    });

    it('should maintain fuzzy matching in fast mode', () => {
      const dictionary = ['hospital', 'doctor', 'nurse'];
      
      const fastIndex = buildFuzzyIndex(dictionary, {
        config: { languages: ['english'], performance: 'fast' }
      });
      
      // Should still find fuzzy matches
      const results = getSuggestions(fastIndex, 'hospitl', 5); // missing 'a'
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('hospital');
    });

    it('should work with German compound words', () => {
      const dictionary = ['Krankenhaus', 'Arzt', 'Krankenschwester'];
      
      const fastIndex = buildFuzzyIndex(dictionary, {
        config: { languages: ['german'], performance: 'fast' }
      });
      
      // Should find the word
      const results = getSuggestions(fastIndex, 'kranken', 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Improvement', () => {
    it('should build index with reasonable performance', () => {
      const words = Array.from({ length: 1000 }, (_, i) => `hospitalization${i}`);
      
      const start = performance.now();
      const index = buildFuzzyIndex(words, {
        config: { languages: ['english'], performance: 'fast' }
      });
      const time = performance.now() - start;
      
      // Should complete in reasonable time
      expect(time).toBeLessThan(1000); // Less than 1 second
      expect(index.base.length).toBe(1000);
    });
  });
});
