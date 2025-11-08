import { describe, it, expect } from "vitest";
import { buildFuzzyIndex, getSuggestions } from "../index.js";
import { parseQuery } from "../utils/phrase-parser.js";
import { matchPhrase } from "../core/phrase-matching.js";

describe("Feature 10: Phrase Search", () => {
  describe("Query Parser", () => {
    it("should parse double-quoted phrases", () => {
      const parsed = parseQuery('"new york" city');
      expect(parsed.phrases).toEqual(["new york"]);
      expect(parsed.terms).toEqual(["city"]);
      expect(parsed.hasPhrases).toBe(true);
    });

    it("should parse single-quoted phrases", () => {
      const parsed = parseQuery("'san francisco' bay");
      expect(parsed.phrases).toEqual(["san francisco"]);
      expect(parsed.terms).toEqual(["bay"]);
      expect(parsed.hasPhrases).toBe(true);
    });

    it("should parse multiple phrases", () => {
      const parsed = parseQuery('"new york" and "san francisco"');
      expect(parsed.phrases).toEqual(["new york", "san francisco"]);
      expect(parsed.terms).toEqual(["and"]);
    });

    it("should handle queries without phrases", () => {
      const parsed = parseQuery("hello world");
      expect(parsed.phrases).toEqual([]);
      expect(parsed.terms).toEqual(["hello", "world"]);
      expect(parsed.hasPhrases).toBe(false);
    });

    it("should handle empty phrases", () => {
      const parsed = parseQuery('"" hello');
      expect(parsed.phrases).toEqual([]);
      expect(parsed.terms).toEqual(["hello"]);
    });

    it("should limit phrase length to 10 words", () => {
      const longPhrase = '"one two three four five six seven eight nine ten eleven"';
      const parsed = parseQuery(longPhrase);
      expect(parsed.phrases).toEqual([]); // Rejected because > 10 words
    });
  });

  describe("Exact Phrase Matching", () => {
    it("should match exact phrases", () => {
      const index = buildFuzzyIndex(["New York City", "New York Times", "New Orleans", "York University"]);

      const results = getSuggestions(index, '"new york"');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toMatch(/New York/i);
    });

    it("should be case-insensitive", () => {
      const index = buildFuzzyIndex(["Coffee Shop", "coffee bean", "COFFEE HOUSE"]);

      const results = getSuggestions(index, '"COFFEE"');
      expect(results.length).toBeGreaterThan(0);
    });

    it("should match multiple words in phrase", () => {
      const index = buildFuzzyIndex(["San Francisco Bay Area", "San Diego", "Francisco Street"]);

      const results = getSuggestions(index, '"san francisco"');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("San Francisco Bay Area");
    });
  });

  describe("Fuzzy Phrase Matching", () => {
    it("should allow typos in phrases", () => {
      const index = buildFuzzyIndex(["Coffee Shop Downtown", "Tea Shop", "Coffee Bean Cafe"], {
        config: {
          features: ["transpositions", "missing-letters"],
        },
      });

      const results = getSuggestions(index, '"cofee shop"');
      expect(results.length).toBeGreaterThan(0);
    });

    it("should preserve word order", () => {
      const index = buildFuzzyIndex(["New York", "York New"]);

      const results = getSuggestions(index, '"new york"');
      expect(results[0].display).toBe("New York");
    });

    it("should handle partial typos", () => {
      const index = buildFuzzyIndex(["MacBook Pro", "MacBook Air", "iMac Pro"]);

      const results = getSuggestions(index, '"macbok pro"');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Mixed Queries", () => {
    it("should combine phrases and terms", () => {
      const index = buildFuzzyIndex(["New York City downtown", "New York Times", "Los Angeles downtown"]);

      const results = getSuggestions(index, '"new york" downtown');
      expect(results.length).toBeGreaterThan(0);
    });

    it("should prioritize phrase matches", () => {
      const index = buildFuzzyIndex(["New York City", "New Orleans", "York Street"]);

      const results = getSuggestions(index, '"new york"');
      expect(results[0].display).toMatch(/New York/i);
    });

    it("should handle multiple phrases with terms", () => {
      const index = buildFuzzyIndex(["New York and San Francisco tour", "New York only", "San Francisco only"]);

      const results = getSuggestions(index, '"new york" "san francisco"');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Proximity Matching", () => {
    it("should find words near each other", () => {
      const match = matchPhrase("coffee and tea shop", "coffee shop", {
        maxProximityDistance: 3,
      });

      expect(match.matched).toBe(true);
      expect(match.matchType).toBe("proximity");
    });

    it("should score by proximity", () => {
      const close = matchPhrase("coffee shop", "coffee shop");
      const far = matchPhrase("coffee and tea and more shop", "coffee shop", {
        maxProximityDistance: 5,
      });

      expect(close.score).toBeGreaterThan(far.score);
    });

    it("should respect max distance", () => {
      const match = matchPhrase("coffee very far away from shop", "coffee shop", {
        maxProximityDistance: 2,
      });

      expect(match.matched).toBe(false);
    });
  });

  describe("Real-World Examples", () => {
    it("should find city names", () => {
      const index = buildFuzzyIndex(["San Francisco Bay Area", "San Diego", "Los Angeles", "San Jose"]);

      const results = getSuggestions(index, '"san francisco"');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("San Francisco Bay Area");
    });

    it("should find product names", () => {
      const index = buildFuzzyIndex(["MacBook Pro 16", "MacBook Air", "iPhone 15 Pro", "iPad Pro"]);

      const results = getSuggestions(index, '"macbook pro"');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toMatch(/MacBook Pro/i);
    });

    it("should find company names", () => {
      const index = buildFuzzyIndex(["Apple Inc", "Google LLC", "Microsoft Corporation", "Apple Store"]);

      const results = getSuggestions(index, '"apple inc"');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("Apple Inc");
    });

    it("should find street addresses", () => {
      const index = buildFuzzyIndex(["123 Main Street", "456 Main Avenue", "789 Oak Street"]);

      const results = getSuggestions(index, '"main street"');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("123 Main Street");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty query", () => {
      const index = buildFuzzyIndex(["test"]);
      const results = getSuggestions(index, '""');
      expect(results).toEqual([]);
    });

    it("should handle single-word phrases", () => {
      const index = buildFuzzyIndex(["hello", "world"]);
      const results = getSuggestions(index, '"hello"');
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle unclosed quotes", () => {
      const index = buildFuzzyIndex(["hello world"]);
      const results = getSuggestions(index, '"hello');
      // Should treat as regular search
      expect(Array.isArray(results)).toBe(true);
    });

    it("should handle special characters in phrases", () => {
      const index = buildFuzzyIndex(["user@example.com", "test@test.com"]);
      const results = getSuggestions(index, '"user@example"');
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle unicode in phrases", () => {
      const index = buildFuzzyIndex(["café résumé", "naïve"]);
      const results = getSuggestions(index, '"café résumé"');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Performance", () => {
    it("should not significantly slow down search", () => {
      const dictionary = Array.from({ length: 1000 }, (_, i) => `word${i} test${i}`);
      const index = buildFuzzyIndex(dictionary);

      const start = performance.now();
      getSuggestions(index, '"word500 test500"');
      const time = performance.now() - start;

      expect(time).toBeLessThan(100); // Should be reasonably fast
    });

    it("should handle large phrases efficiently", () => {
      const index = buildFuzzyIndex(["one two three four five six seven eight nine ten"]);

      const start = performance.now();
      getSuggestions(index, '"one two three four five"');
      const time = performance.now() - start;

      expect(time).toBeLessThan(100); // Should be reasonably fast
    });
  });

  describe("Backwards Compatibility", () => {
    it("should work without quotes", () => {
      const index = buildFuzzyIndex(["hello world", "hello there"]);
      const results = getSuggestions(index, "hello");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should work with existing features", () => {
      const index = buildFuzzyIndex(["café shop", "coffee shop"], {
        config: {
          features: ["phonetic", "transpositions"],
        },
      });

      const results = getSuggestions(index, '"coffee shop"');
      expect(results.length).toBeGreaterThan(0);
    });

    it("should work with stop words", () => {
      const index = buildFuzzyIndex(["the coffee shop", "a tea house"], {
        config: {
          enableStopWords: true,
          stopWords: ["the", "a"],
        },
      });

      const results = getSuggestions(index, '"coffee shop"');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Phrase Match Algorithm", () => {
    it("should return exact match type for perfect matches", () => {
      const match = matchPhrase("new york city", "new york");
      expect(match.matchType).toBe("exact");
      expect(match.score).toBe(1.0);
    });

    it("should return fuzzy match type for typos", () => {
      const match = matchPhrase("new yrok city", "new york", {
        maxEditDistance: 1,
        useTranspositions: true,
      });

      expect(match.matchType).toBe("fuzzy");
      expect(match.score).toBeGreaterThan(0.7);
      expect(match.score).toBeLessThan(1.0);
    });

    it("should return proximity match for nearby words", () => {
      const match = matchPhrase("new and york", "new york", {
        maxProximityDistance: 2,
      });

      expect(match.matchType).toBe("proximity");
      expect(match.score).toBeGreaterThan(0);
    });

    it("should return no match when phrase not found", () => {
      const match = matchPhrase("hello world", "goodbye");
      expect(match.matched).toBe(false);
      expect(match.matchType).toBe("none");
    });
  });
});
