/**
 * Tests for improved scoring with edit distance as primary metric
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildFuzzyIndex, getSuggestions } from "../core/index.js";
import type { FuzzyIndex } from "../core/types.js";

describe("Improved Scoring with Edit Distance Priority", () => {
  let index: FuzzyIndex;

  describe("Fuzzy matches should score higher than unrelated prefix matches", () => {
    beforeEach(() => {
      // Dataset with similar structure to the real-world example
      const words = [
        "clientfactory82269",
        "clientfactory82869",
        "clientfactory1269",
        "client_hdect",
        "client_hvvql",
        "client_hzohb",
        "client_manager",
        "client_service",
        "clienthandler",
      ];
      index = buildFuzzyIndex(words, {
        config: {
          performance: "balanced",
          languages: ["english"],
          maxResults: 10,
        },
      });
    });

    it("should prioritize close fuzzy matches over distant prefix matches", () => {
      // Query with typo: "n" instead of "2"
      const results = getSuggestions(index, "clientfactory82n69", 5);

      expect(results.length).toBeGreaterThan(0);

      // The top results should be the actual close matches
      const topResult = results[0];
      expect(topResult.display).toMatch(/clientfactory82[0-9]69/);

      // Should NOT be generic "client_" prefixes
      expect(topResult.display).not.toMatch(/^client_[a-z]{5}$/);
    });

    it("should rank results by edit distance when available", () => {
      const results = getSuggestions(index, "clientfactory82n69", 5);

      // All results should have edit distance
      results.forEach((result) => {
        expect(result._editDistance).toBeDefined();
        expect(typeof result._editDistance).toBe("number");
      });

      // Edit distances should generally increase (or stay same) as we go down the list
      for (let i = 1; i < results.length; i++) {
        const prevEditDist = results[i - 1]._editDistance ?? Infinity;
        const currEditDist = results[i]._editDistance ?? Infinity;
        const prevScore = results[i - 1].score;
        const currScore = results[i].score;

        // If scores are similar, edit distance should be used as tiebreaker
        if (Math.abs(prevScore - currScore) < 0.1) {
          expect(currEditDist).toBeGreaterThanOrEqual(prevEditDist);
        }
      }
    });

    it("should penalize prefix matches on much longer words", () => {
      const results = getSuggestions(index, "client", 10);

      // "client" exact matches or very close matches should score highest
      const topResults = results.slice(0, 3);

      // Check that very long words are penalized
      topResults.forEach((result) => {
        // If it's a prefix match on a much longer word, score should be reduced
        if (result.display.length > "client".length * 2) {
          expect(result.score).toBeLessThan(0.9);
        }
      });
    });
  });

  describe("Edit distance calculation for all match types", () => {
    beforeEach(() => {
      const words = ["apple", "application", "apply", "apricot", "banana"];
      index = buildFuzzyIndex(words, {
        config: {
          performance: "balanced",
          languages: ["english"],
        },
      });
    });

    it("should calculate edit distance for prefix matches", () => {
      const results = getSuggestions(index, "app", 5);

      results.forEach((result) => {
        expect(result._editDistance).toBeDefined();
        expect(result._editDistance).toBeGreaterThanOrEqual(0);
      });
    });

    it("should calculate edit distance for exact matches", () => {
      const results = getSuggestions(index, "apple", 5);

      const exactMatch = results.find((r) => r.display === "apple");
      expect(exactMatch).toBeDefined();
      expect(exactMatch?._editDistance).toBe(0);
      expect(exactMatch?.score).toBe(1.0);
    });

    it("should calculate edit distance for fuzzy matches", () => {
      // Typo: "aple" instead of "apple"
      const results = getSuggestions(index, "aple", 5);

      const appleMatch = results.find((r) => r.display === "apple");
      expect(appleMatch).toBeDefined();
      expect(appleMatch?._editDistance).toBe(1); // One missing letter
      expect(appleMatch?.score).toBeGreaterThan(0.8);
    });
  });

  describe("Length-based penalties", () => {
    beforeEach(() => {
      const words = [
        "test",
        "testing",
        "testingverylongwordthatdoesntmatch",
        "tester",
        "tests",
      ];
      index = buildFuzzyIndex(words, {
        config: {
          performance: "balanced",
          languages: ["english"],
        },
      });
    });

    it("should penalize words much longer than query", () => {
      const results = getSuggestions(index, "test", 10);

      // Find the very long word
      const longWord = results.find((r) =>
        r.display.includes("verylongword")
      );

      if (longWord) {
        // Should be heavily penalized
        expect(longWord.score).toBeLessThan(0.7);

        // Should rank lower than shorter matches
        const shortMatches = results.filter(
          (r) => r.display.length <= "testing".length
        );
        if (shortMatches.length > 0) {
          const avgShortScore =
            shortMatches.reduce((sum, r) => sum + r.score, 0) /
            shortMatches.length;
          expect(longWord.score).toBeLessThan(avgShortScore);
        }
      }
    });

    it("should boost words close to query length", () => {
      const results = getSuggestions(index, "test", 10);

      // Words close to query length (test=4, so 4-6 chars)
      const closeLength = results.filter(
        (r) => Math.abs(r.display.length - 4) <= 2
      );
      const farLength = results.filter(
        (r) => Math.abs(r.display.length - 4) > 5
      );

      if (closeLength.length > 0 && farLength.length > 0) {
        const avgCloseScore =
          closeLength.reduce((sum, r) => sum + r.score, 0) /
          closeLength.length;
        const avgFarScore =
          farLength.reduce((sum, r) => sum + r.score, 0) / farLength.length;

        expect(avgCloseScore).toBeGreaterThan(avgFarScore);
      }
    });
  });

  describe("Sorting with edit distance tiebreaker", () => {
    beforeEach(() => {
      const words = [
        "product123",
        "product124",
        "product125",
        "product223",
        "product323",
      ];
      index = buildFuzzyIndex(words, {
        config: {
          performance: "balanced",
          languages: ["english"],
        },
      });
    });

    it("should use edit distance as tiebreaker when scores are equal", () => {
      const results = getSuggestions(index, "product12", 5);

      // Find results with similar scores
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];

        // If scores are very close (within 0.001)
        if (Math.abs(prev.score - curr.score) < 0.001) {
          // Edit distance should be used as tiebreaker
          expect(curr._editDistance ?? Infinity).toBeGreaterThanOrEqual(
            prev._editDistance ?? 0
          );
        }
      }
    });

    it("should use length as tertiary sort key", () => {
      const results = getSuggestions(index, "prod", 5);

      // All should be prefix matches with similar scores
      // Check that shorter words come first when scores and edit distances are equal
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];

        if (
          Math.abs(prev.score - curr.score) < 0.001 &&
          prev._editDistance === curr._editDistance
        ) {
          expect(curr.display.length).toBeGreaterThanOrEqual(
            prev.display.length
          );
        }
      }
    });
  });

  describe("Real-world scenario: typo in compound identifier", () => {
    beforeEach(() => {
      // Simulate a real dataset with many similar entries
      const words: string[] = [];
      for (let i = 0; i < 100; i++) {
        words.push(`client_${Math.random().toString(36).substring(7)}`);
      }
      words.push("clientfactory82269");
      words.push("clientfactory82869");
      words.push("clientfactory1269");

      index = buildFuzzyIndex(words, {
        config: {
          performance: "fast",
          languages: ["english"],
          maxResults: 10,
        },
      });
    });

    it("should find the correct match despite typo and noise", () => {
      // Query with typo: "n" instead of "2"
      const results = getSuggestions(index, "clientfactory82n69", 10);

      expect(results.length).toBeGreaterThan(0);

      // Top 3 should include the actual matches
      const topThree = results.slice(0, 3);
      const hasCorrectMatch = topThree.some((r) =>
        r.display.match(/clientfactory\d+269/)
      );

      expect(hasCorrectMatch).toBe(true);
    });

    it("should not be dominated by generic prefix matches", () => {
      const results = getSuggestions(index, "clientfactory82n69", 10);

      // Count how many results are generic "client_xxxxx" vs actual "clientfactory" matches
      const genericMatches = results.filter((r) =>
        r.display.match(/^client_[a-z0-9]{5}$/)
      );
      const factoryMatches = results.filter((r) =>
        r.display.includes("clientfactory")
      );

      // Factory matches should dominate the top results
      expect(factoryMatches.length).toBeGreaterThan(0);

      // If there are factory matches, they should score higher than generic ones
      if (factoryMatches.length > 0 && genericMatches.length > 0) {
        const bestFactory = Math.max(...factoryMatches.map((r) => r.score));
        const bestGeneric = Math.max(...genericMatches.map((r) => r.score));
        expect(bestFactory).toBeGreaterThan(bestGeneric);
      }
    });
  });

  describe("Boost for low edit distance fuzzy matches", () => {
    beforeEach(() => {
      const words = ["hello", "hallo", "hullo", "helo", "help"];
      index = buildFuzzyIndex(words, {
        config: {
          performance: "balanced",
          languages: ["english"],
        },
      });
    });

    it("should boost fuzzy matches with edit distance <= 2", () => {
      const results = getSuggestions(index, "helo", 5);

      // "hello" has edit distance of 1 (one missing 'l')
      const helloMatch = results.find((r) => r.display === "hello");
      expect(helloMatch).toBeDefined();
      expect(helloMatch?._editDistance).toBeLessThanOrEqual(2);
      expect(helloMatch?.score).toBeGreaterThan(0.85);
    });

    it("should prioritize matches with lower edit distance", () => {
      const results = getSuggestions(index, "helo", 5);

      // Results should be ordered by edit distance (when scores are similar)
      const editDistances = results.map((r) => r._editDistance ?? Infinity);

      // Check that we're not getting worse matches first
      expect(editDistances[0]).toBeLessThanOrEqual(editDistances[editDistances.length - 1]);
    });
  });
});
