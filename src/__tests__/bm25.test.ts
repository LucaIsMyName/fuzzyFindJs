/**
 * BM25 Scoring Algorithm Tests
 * Tests for relevance ranking with BM25
 */

import { describe, it, expect } from "vitest";
import { buildFuzzyIndex, getSuggestions } from "../core/index.js";
import {
  calculateIDF,
  calculateBM25Score,
  buildCorpusStats,
  normalizeBM25Score,
  combineScores,
  DEFAULT_BM25_CONFIG,
  type DocumentStats,
  type CorpusStats,
} from "../algorithms/bm25.js";

describe("BM25 Scoring", () => {
  describe("IDF Calculation", () => {
    it("should calculate IDF correctly", () => {
      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 10,
        documentFrequencies: new Map([
          ["common", 80], // Very common term
          ["rare", 5], // Rare term
          ["unique", 1], // Very rare term
        ]),
      };

      const commonIDF = calculateIDF("common", corpusStats);
      const rareIDF = calculateIDF("rare", corpusStats);
      const uniqueIDF = calculateIDF("unique", corpusStats);

      // Rare terms should have higher IDF
      expect(rareIDF).toBeGreaterThan(commonIDF);
      expect(uniqueIDF).toBeGreaterThan(rareIDF);
      expect(uniqueIDF).toBeGreaterThan(commonIDF);
    });

    it("should handle non-existent terms", () => {
      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 10,
        documentFrequencies: new Map(),
      };

      const idf = calculateIDF("nonexistent", corpusStats);
      expect(idf).toBe(DEFAULT_BM25_CONFIG.minIDF);
    });

    it("should respect minimum IDF", () => {
      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 10,
        documentFrequencies: new Map([["verycommon", 99]]),
      };

      const idf = calculateIDF("verycommon", corpusStats);
      expect(idf).toBeGreaterThanOrEqual(DEFAULT_BM25_CONFIG.minIDF);
    });
  });

  describe("BM25 Score Calculation", () => {
    it("should calculate BM25 score for single term", () => {
      const docStats: DocumentStats = {
        docId: 0,
        length: 10,
        termFrequencies: new Map([["search", 3]]),
      };

      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 10,
        documentFrequencies: new Map([["search", 20]]),
      };

      const score = calculateBM25Score(["search"], docStats, corpusStats);
      expect(score).toBeGreaterThan(0);
    });

    it("should give higher scores to documents with higher term frequency", () => {
      const doc1: DocumentStats = {
        docId: 0,
        length: 10,
        termFrequencies: new Map([["search", 1]]),
      };

      const doc2: DocumentStats = {
        docId: 1,
        length: 10,
        termFrequencies: new Map([["search", 5]]),
      };

      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 10,
        documentFrequencies: new Map([["search", 20]]),
      };

      const score1 = calculateBM25Score(["search"], doc1, corpusStats);
      const score2 = calculateBM25Score(["search"], doc2, corpusStats);

      expect(score2).toBeGreaterThan(score1);
    });

    it("should handle multi-term queries", () => {
      const docStats: DocumentStats = {
        docId: 0,
        length: 20,
        termFrequencies: new Map([
          ["fuzzy", 3],
          ["search", 5],
        ]),
      };

      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 15,
        documentFrequencies: new Map([
          ["fuzzy", 30],
          ["search", 40],
        ]),
      };

      const score = calculateBM25Score(["fuzzy", "search"], docStats, corpusStats);
      expect(score).toBeGreaterThan(0);
    });

    it("should penalize very long documents", () => {
      const shortDoc: DocumentStats = {
        docId: 0,
        length: 10,
        termFrequencies: new Map([["term", 2]]),
      };

      const longDoc: DocumentStats = {
        docId: 1,
        length: 100,
        termFrequencies: new Map([["term", 2]]),
      };

      const corpusStats: CorpusStats = {
        totalDocs: 100,
        avgDocLength: 20,
        documentFrequencies: new Map([["term", 50]]),
      };

      const shortScore = calculateBM25Score(["term"], shortDoc, corpusStats);
      const longScore = calculateBM25Score(["term"], longDoc, corpusStats);

      // Short document should score higher (less penalty)
      expect(shortScore).toBeGreaterThan(longScore);
    });
  });

  describe("Corpus Statistics", () => {
    it("should build corpus stats correctly", () => {
      const documents: DocumentStats[] = [
        {
          docId: 0,
          length: 10,
          termFrequencies: new Map([
            ["apple", 2],
            ["banana", 1],
          ]),
        },
        {
          docId: 1,
          length: 15,
          termFrequencies: new Map([
            ["apple", 3],
            ["cherry", 2],
          ]),
        },
        {
          docId: 2,
          length: 5,
          termFrequencies: new Map([["banana", 1]]),
        },
      ];

      const corpusStats = buildCorpusStats(documents);

      expect(corpusStats.totalDocs).toBe(3);
      expect(corpusStats.avgDocLength).toBe(10); // (10 + 15 + 5) / 3
      expect(corpusStats.documentFrequencies.get("apple")).toBe(2); // In 2 docs
      expect(corpusStats.documentFrequencies.get("banana")).toBe(2); // In 2 docs
      expect(corpusStats.documentFrequencies.get("cherry")).toBe(1); // In 1 doc
    });
  });

  describe("Score Normalization", () => {
    it("should normalize BM25 scores to 0-1 range", () => {
      const scores = [0, 2, 5, 10, 20];

      for (const score of scores) {
        const normalized = normalizeBM25Score(score);
        expect(normalized).toBeGreaterThanOrEqual(0);
        expect(normalized).toBeLessThanOrEqual(1);
      }
    });

    it("should give higher normalized scores for higher raw scores", () => {
      const lowScore = normalizeBM25Score(1);
      const midScore = normalizeBM25Score(5);
      const highScore = normalizeBM25Score(10);

      expect(midScore).toBeGreaterThan(lowScore);
      expect(highScore).toBeGreaterThan(midScore);
    });
  });

  describe("Score Combination", () => {
    it("should combine BM25 and fuzzy scores", () => {
      const bm25Score = 0.8;
      const fuzzyScore = 0.6;

      const combined = combineScores(bm25Score, fuzzyScore, 0.6, 0.4);

      expect(combined).toBeGreaterThanOrEqual(0);
      expect(combined).toBeLessThanOrEqual(1);
      expect(combined).toBeCloseTo(0.72, 2); // 0.6 * 0.8 + 0.4 * 0.6
    });

    it("should respect weight parameters", () => {
      const bm25Score = 0.9;
      const fuzzyScore = 0.3;

      // BM25 heavily weighted
      const bm25Heavy = combineScores(bm25Score, fuzzyScore, 0.9, 0.1);
      // Fuzzy heavily weighted
      const fuzzyHeavy = combineScores(bm25Score, fuzzyScore, 0.1, 0.9);

      expect(bm25Heavy).toBeGreaterThan(fuzzyHeavy);
    });
  });

  describe("Integration with FuzzyFindJS", () => {
    it("should enable BM25 scoring in search", () => {
      const dictionary = [
        "apple pie recipe",
        "apple juice",
        "apple tree",
        "banana split",
        "cherry pie",
      ];

      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBM25: true,
          fuzzyThreshold: 0.1, // Very low threshold for BM25 tests with new scoring
          // useInvertedIndex is automatically enabled when useBM25 is true
        },
      });

      const results = getSuggestions(index, "apple", 5);

      expect(results.length).toBeGreaterThan(0);
      // All apple-related results should appear
      expect(results.some((r) => r.display.includes("apple"))).toBe(true);
    });

    it("should rank documents by relevance with BM25", () => {
      const dictionary = [
        "search engine optimization", // Contains "search" once
        "search search search", // Contains "search" three times
        "advanced search techniques", // Contains "search" once
        "database query", // Doesn't contain "search"
      ];

      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBM25: true,
          fuzzyThreshold: 0.1, // Very low threshold for new scoring
        },
      });

      const results = getSuggestions(index, "search", 5);

      // Document with highest term frequency should rank high
      expect(results.length).toBeGreaterThan(0);
      const topResult = results[0];
      expect(topResult.display).toContain("search");
    });

    it("should work without BM25 (backwards compatible)", () => {
      const dictionary = ["apple", "banana", "cherry"];

      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBM25: false, // Disabled
        },
      });

      const results = getSuggestions(index, "apple", 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("apple");
    });

    it("should handle custom BM25 parameters", () => {
      const dictionary = ["test document one", "test test document two"];

      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBM25: true,
          fuzzyThreshold: 0.1, // Very low threshold for new scoring
          bm25Config: {
            k1: 2.0, // Higher saturation
            b: 0.5, // Less length normalization
            minIDF: 0.2,
          },
        },
      });

      const results = getSuggestions(index, "test", 5);

      expect(results.length).toBeGreaterThan(0);
    });

    it("should combine BM25 with fuzzy matching", () => {
      const dictionary = [
        "javascript programming",
        "java programming",
        "python programming",
      ];

      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBM25: true,
          fuzzyThreshold: 0.2, // Lower threshold to be more lenient
          bm25Weight: 0.7, // Favor BM25
          maxEditDistance: 2,
        },
      });

      // Typo in query
      const results = getSuggestions(index, "javascrpt", 5);

      expect(results.length).toBeGreaterThan(0);
      // Should still find "javascript" despite typo
      expect(results.some((r) => r.display.includes("javascript"))).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", () => {
      const dictionary: string[] = [];
      for (let i = 0; i < 1000; i++) {
        dictionary.push(`document ${i} with search term`);
      }

      const start = performance.now();

      const index = buildFuzzyIndex(dictionary, {
        config: {
          languages: ["english"],
          useBM25: true,
          fuzzyThreshold: 0.3,
        },
      });

      const results = getSuggestions(index, "search", 10);

      const duration = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500); // Should complete in reasonable time
    });
  });
});
