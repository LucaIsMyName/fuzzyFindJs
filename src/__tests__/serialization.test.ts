import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions, serializeIndex, deserializeIndex, getSerializedSize } from '../index.js';

describe('Feature 3: Index Serialization', () => {
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

  describe('Serialization', () => {
    it('should serialize an index to JSON string', () => {
      const index = buildFuzzyIndex(dictionary);
      const serialized = serializeIndex(index);

      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it('should include all index data in serialization', () => {
      const index = buildFuzzyIndex(dictionary);
      const serialized = serializeIndex(index);
      const data = JSON.parse(serialized);

      expect(data.version).toBeDefined();
      expect(data.base).toEqual(dictionary);
      expect(data.variantToBase).toBeDefined();
      expect(data.phoneticToBase).toBeDefined();
      expect(data.ngramIndex).toBeDefined();
      expect(data.synonymMap).toBeDefined();
      expect(data.config).toBeDefined();
      expect(data.languageProcessorNames).toBeDefined();
    });

    it('should serialize inverted index if present', () => {
      const largeDictionary = Array.from({ length: 100000 }, (_, i) => `Word${i}`);
      const index = buildFuzzyIndex(largeDictionary);
      const serialized = serializeIndex(index);
      const data = JSON.parse(serialized);

      expect(data.invertedIndex).toBeDefined();
      expect(data.documents).toBeDefined();
    });
  });

  describe('Deserialization', () => {
    it('should deserialize an index from JSON string', async () => {
      const index = buildFuzzyIndex(dictionary);
      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      expect(deserialized).toBeDefined();
      expect(deserialized.base).toEqual(index.base);
      expect(deserialized.config).toEqual(index.config);
    });

    it('should produce functional index after deserialization', async () => {
      const index = buildFuzzyIndex(dictionary);
      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      const results = getSuggestions(deserialized, 'app', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toMatch(/app/i);
    });

    it('should preserve search results after serialization', async () => {
      const index = buildFuzzyIndex(dictionary);
      const originalResults = getSuggestions(index, 'ban', 5);

      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);
      const deserializedResults = getSuggestions(deserialized, 'ban', 5);

      expect(deserializedResults.length).toBe(originalResults.length);
      expect(deserializedResults[0].display).toBe(originalResults[0].display);
    });

    it('should preserve inverted index after serialization', async () => {
      const largeDictionary = Array.from({ length: 100000 }, (_, i) => `Word${i}`);
      const index = buildFuzzyIndex(largeDictionary);
      
      expect(index.invertedIndex).toBeDefined();

      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      expect(deserialized.invertedIndex).toBeDefined();
      expect(deserialized.documents).toBeDefined();

      // Test that search still works
      const results = getSuggestions(deserialized, 'Word5000', 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Round-trip Serialization', () => {
    it('should maintain data integrity through serialize/deserialize cycle', async () => {
      const index = buildFuzzyIndex(dictionary);
      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      // Serialize again
      const serialized2 = serializeIndex(deserialized);
      
      // Should be identical
      expect(serialized).toBe(serialized2);
    });

    it('should work with multiple serialization cycles', async () => {
      let index = buildFuzzyIndex(dictionary);

      for (let i = 0; i < 3; i++) {
        const serialized = serializeIndex(index);
        index = await deserializeIndex(serialized);
      }

      // Should still work
      const results = getSuggestions(index, 'app', 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Size Calculation', () => {
    it('should calculate serialized size', () => {
      const index = buildFuzzyIndex(dictionary);
      const size = getSerializedSize(index);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should have larger size for larger indices', () => {
      const smallIndex = buildFuzzyIndex(['a', 'b', 'c']);
      const largeIndex = buildFuzzyIndex(dictionary);

      const smallSize = getSerializedSize(smallIndex);
      const largeSize = getSerializedSize(largeIndex);

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dictionary', async () => {
      const index = buildFuzzyIndex([]);
      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      expect(deserialized.base).toEqual([]);
    });

    it('should handle special characters in words', async () => {
      const specialDict = ['café', 'naïve', 'résumé', 'Müller'];
      const index = buildFuzzyIndex(specialDict);
      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      const results = getSuggestions(deserialized, 'café', 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle very long words', async () => {
      const longWord = 'a'.repeat(1000);
      const index = buildFuzzyIndex([longWord]);
      const serialized = serializeIndex(index);
      const deserialized = await deserializeIndex(serialized);

      expect(deserialized.base).toContain(longWord);
    });
  });
});
