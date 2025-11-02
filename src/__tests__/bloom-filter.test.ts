/**
 * Bloom Filter Tests
 * Tests for probabilistic membership testing
 */

import { describe, it, expect } from "vitest";
import { BloomFilter, createBloomFilter } from "../algorithms/bloom-filter.js";
import { buildFuzzyIndex, getSuggestions } from "../core/index.js";

describe("Bloom Filter", () => {
  describe("Basic Operations", () => {
    it("should create a bloom filter", () => {
      const filter = createBloomFilter(1000, 0.01);
      expect(filter).toBeDefined();
    });

    it("should add and check elements", () => {
      const filter = createBloomFilter(100, 0.01);
      
      filter.add("apple");
      filter.add("banana");
      filter.add("cherry");
      
      expect(filter.mightContain("apple")).toBe(true);
      expect(filter.mightContain("banana")).toBe(true);
      expect(filter.mightContain("cherry")).toBe(true);
    });

    it("should return false for non-existent elements", () => {
      const filter = createBloomFilter(100, 0.01);
      
      filter.add("apple");
      
      // These should definitely not be in the filter
      expect(filter.mightContain("orange")).toBe(false);
      expect(filter.mightContain("grape")).toBe(false);
    });

    it("should have no false negatives", () => {
      const filter = createBloomFilter(1000, 0.01);
      const items = ["apple", "banana", "cherry", "date", "elderberry"];
      
      items.forEach(item => filter.add(item));
      
      // All added items should be found
      items.forEach(item => {
        expect(filter.mightContain(item)).toBe(true);
      });
    });

    it("should have acceptable false positive rate", () => {
      const filter = createBloomFilter(1000, 0.01);
      const addedItems = new Set<string>();
      
      // Add 1000 items
      for (let i = 0; i < 1000; i++) {
        const item = `item_${i}`;
        filter.add(item);
        addedItems.add(item);
      }
      
      // Test 1000 non-existent items
      let falsePositives = 0;
      for (let i = 1000; i < 2000; i++) {
        const item = `item_${i}`;
        if (filter.mightContain(item)) {
          falsePositives++;
        }
      }
      
      const actualRate = falsePositives / 1000;
      // Should be close to configured rate (0.01 = 1%)
      expect(actualRate).toBeLessThan(0.05); // Allow up to 5% due to randomness
    });
  });

  describe("Statistics", () => {
    it("should provide accurate statistics", () => {
      const filter = createBloomFilter(100, 0.01);
      
      for (let i = 0; i < 50; i++) {
        filter.add(`item_${i}`);
      }
      
      const stats = filter.getStats();
      
      expect(stats.numElements).toBe(50);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.numHashFunctions).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it("should calculate false positive rate", () => {
      const filter = createBloomFilter(100, 0.01);
      
      for (let i = 0; i < 50; i++) {
        filter.add(`item_${i}`);
      }
      
      const rate = filter.getFalsePositiveRate();
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize", () => {
      const filter = createBloomFilter(100, 0.01);
      
      filter.add("apple");
      filter.add("banana");
      
      const json = filter.toJSON();
      const restored = BloomFilter.fromJSON(json);
      
      expect(restored.mightContain("apple")).toBe(true);
      expect(restored.mightContain("banana")).toBe(true);
      expect(restored.mightContain("cherry")).toBe(false);
    });
  });

  describe("Integration with FuzzyFindJS", () => {
    it("should enable bloom filter for large datasets", () => {
      const dictionary: string[] = [];
      for (let i = 0; i < 15000; i++) {
        dictionary.push(`word_${i}`);
      }
      
      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
        },
      });
      
      // Bloom filter should be auto-enabled for 10k+ words
      expect(index.invertedIndex?.bloomFilter).toBeDefined();
    });

    it("should improve search performance with bloom filter", () => {
      const dictionary: string[] = [];
      for (let i = 0; i < 15000; i++) {
        dictionary.push(`document_${i}`);
      }
      
      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          fuzzyThreshold: 0.3,
        },
      });
      
      const start = performance.now();
      const results = getSuggestions(index, "xyzabc123", 10);
      const duration = performance.now() - start;
      
      // Should be fast even for non-existent terms (bloom filter helps)
      expect(duration).toBeLessThan(50);
      // May find some fuzzy matches, but should be fast
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it("should work with manual bloom filter enable", () => {
      const dictionary = ["apple", "banana", "cherry"];
      
      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBloomFilter: true,
          fuzzyThreshold: 0.3,
        },
      });
      
      expect(index.invertedIndex?.bloomFilter).toBeDefined();
      
      const results = getSuggestions(index, "apple", 5);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Memory Efficiency", () => {
    it("should use less memory than Set", () => {
      const numItems = 10000;
      
      // Bloom filter
      const filter = createBloomFilter(numItems, 0.01);
      for (let i = 0; i < numItems; i++) {
        filter.add(`item_${i}`);
      }
      const bloomMemory = filter.getStats().memoryUsage;
      
      // Set (for comparison)
      const set = new Set<string>();
      for (let i = 0; i < numItems; i++) {
        set.add(`item_${i}`);
      }
      // Rough estimate: each string ~20 bytes + Set overhead
      const setMemory = numItems * 20;
      
      // Bloom filter should use significantly less memory
      expect(bloomMemory).toBeLessThan(setMemory / 2);
    });
  });
});
