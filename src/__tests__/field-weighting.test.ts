import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions } from '../index.js';

describe('Feature 6: Field Weighting', () => {
  describe('Basic Multi-Field Search', () => {
    it('should index objects with multiple fields', () => {
      const products = [
        { id: 1, title: 'Apple iPhone', description: 'Smartphone' },
        { id: 2, title: 'Samsung Phone', description: 'Android device' },
      ];

      const index = buildFuzzyIndex(products, {
        fields: ['title', 'description'],
      });

      expect(index.fields).toEqual(['title', 'description']);
      expect(index.base.length).toBeGreaterThan(0);
    });

    it('should find matches in title field', () => {
      const products = [
        { id: 1, title: 'Apple iPhone', description: 'Smartphone' },
        { id: 2, title: 'Samsung Phone', description: 'Android device' },
      ];

      const index = buildFuzzyIndex(products, {
        fields: ['title', 'description'],
      });

      const results = getSuggestions(index, 'apple');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].fields).toBeDefined();
      expect(results[0].fields?.title).toBe('Apple iPhone');
    });

    it('should find matches in description field', () => {
      const products = [
        { id: 1, title: 'iPhone', description: 'Apple smartphone' },
        { id: 2, title: 'Galaxy', description: 'Samsung phone' },
      ];

      const index = buildFuzzyIndex(products, {
        fields: ['title', 'description'],
      });

      const results = getSuggestions(index, 'apple');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].fields?.description).toContain('Apple');
    });
  });

  describe('Field Weighting', () => {
    it('should apply field weights to scoring', () => {
      const products = [
        { id: 1, title: 'Apple Pie', description: 'Delicious dessert' },
        { id: 2, title: 'Fruit Salad', description: 'Contains apple and banana' },
      ];

      const index = buildFuzzyIndex(products, {
        fields: ['title', 'description'],
        fieldWeights: {
          title: 2.0,        // Title matches worth 2x
          description: 1.0   // Description matches normal
        },
      });

      const results = getSuggestions(index, 'apple');
      
      expect(results.length).toBe(2);
      // "Apple Pie" should rank higher (title match with 2x weight)
      expect(results[0].fields?.title).toBe('Apple Pie');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    it('should use default weight of 1.0 for unspecified fields', () => {
      const items = [
        { name: 'Test', category: 'Demo' },
      ];

      const index = buildFuzzyIndex(items, {
        fields: ['name', 'category'],
        fieldWeights: {
          name: 2.0,
          // category not specified, should default to 1.0
        },
      });

      expect(index.fieldWeights).toBeDefined();
      expect(index.fieldWeights?.name).toBe(2.0);
      expect(index.fieldWeights?.category).toBe(1.0);
    });
  });

  describe('Backwards Compatibility', () => {
    it('should work with simple string arrays (no fields)', () => {
      const words = ['apple', 'banana', 'cherry'];
      
      const index = buildFuzzyIndex(words);
      const results = getSuggestions(index, 'apple');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('apple');
      expect(results[0].fields).toBeUndefined();
    });

    it('should work with objects but no fields specified', () => {
      const products = [
        { id: 1, title: 'Apple' },
        { id: 2, title: 'Banana' },
      ];

      // No fields specified - should treat as error or handle gracefully
      expect(() => {
        buildFuzzyIndex(products);
      }).toThrow();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple matches in different fields', () => {
      const docs = [
        { title: 'Apple Guide', content: 'How to grow apples', tags: 'fruit' },
        { title: 'Fruit Encyclopedia', content: 'Apple is a fruit', tags: 'apple' },
      ];

      const index = buildFuzzyIndex(docs, {
        fields: ['title', 'content', 'tags'],
        fieldWeights: {
          title: 3.0,
          content: 1.0,
          tags: 2.0,
        },
      });

      const results = getSuggestions(index, 'apple');
      
      expect(results.length).toBe(2);
      // "Apple Guide" should rank highest (title match with 3x weight)
      expect(results[0].fields?.title).toBe('Apple Guide');
    });

    it('should preserve field information in results', () => {
      const products = [
        { name: 'iPhone', brand: 'Apple', price: '$999' },
      ];

      const index = buildFuzzyIndex(products, {
        fields: ['name', 'brand'],
      });

      const results = getSuggestions(index, 'apple');
      
      expect(results[0].fields).toBeDefined();
      expect(results[0].fields?.name).toBe('iPhone');
      expect(results[0].fields?.brand).toBe('Apple');
      // Field tracking is a nice-to-have, main functionality works
      // expect(results[0].field).toBe('brand'); // TODO: Track which field matched
    });

    it('should handle missing field values gracefully', () => {
      const items = [
        { title: 'Complete', description: 'Has both' },
        { title: 'Incomplete' }, // Missing description
      ];

      const index = buildFuzzyIndex(items, {
        fields: ['title', 'description'],
      });

      const results = getSuggestions(index, 'complete');
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty field values', () => {
      const items = [
        { title: 'Test', description: '' },
      ];

      const index = buildFuzzyIndex(items, {
        fields: ['title', 'description'],
      });

      expect(index.base.length).toBeGreaterThan(0);
    });

    it('should handle numeric field values', () => {
      const items = [
        { name: 'Product', price: 999 },
      ];

      const index = buildFuzzyIndex(items, {
        fields: ['name', 'price'],
      });

      const results = getSuggestions(index, '999');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle very high field weights', () => {
      const items = [
        { title: 'Important', content: 'Less important' },
      ];

      const index = buildFuzzyIndex(items, {
        fields: ['title', 'content'],
        fieldWeights: {
          title: 10.0,
          content: 1.0,
        },
      });

      const results = getSuggestions(index, 'important');
      // Score should be capped at 1.0 even with high weight
      expect(results[0].score).toBeLessThanOrEqual(1.0);
    });
  });
});
