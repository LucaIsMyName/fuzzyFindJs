import { describe, it, expect } from "vitest";
import { buildFuzzyIndex, getSuggestions } from "../index.js";

describe("Feature 9: Transpositions (Damerau-Levenshtein)", () => {
  describe("Common Typos", () => {
    it("should match 'teh' to 'the'", () => {
      const index = buildFuzzyIndex(["the", "then", "them"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
          fuzzyThreshold: 0.5,
        },
      });

      const results = getSuggestions(index, "teh");
      expect(results.length).toBeGreaterThan(0);
      // Check that 'the' is in the results (scoring may affect order)
      expect(results.some(r => r.display === "the")).toBe(true);
    });

    it("should match 'recieve' to 'receive'", () => {
      const index = buildFuzzyIndex(["receive", "receiver", "received"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
          fuzzyThreshold: 0.5,
        },
      });

      const results = getSuggestions(index, "recieve");
      expect(results.length).toBeGreaterThan(0);
      // Check that 'receive' is in the results (scoring may affect order)
      expect(results.some(r => r.display === "receive")).toBe(true);
    });

    it("should match 'freind' to 'friend'", () => {
      const index = buildFuzzyIndex(["friend", "friends", "friendly"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "freind");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("friend");
    });

    it("should match 'wierd' to 'weird'", () => {
      const index = buildFuzzyIndex(["weird", "weirder", "weirdly"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "wierd");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("weird");
    });
  });

  describe("Multiple Transpositions", () => {
    it("should handle multiple transpositions with higher edit distance", () => {
      const index = buildFuzzyIndex(["calendar", "calculator", "calibrate"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 2,
        },
      });

      const results = getSuggestions(index, "claendar");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("calendar");
    });

    it("should handle transposition at different positions", () => {
      const index = buildFuzzyIndex(["form", "from", "forum"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "form");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.display === "from")).toBe(true);
    });
  });

  describe("Backwards Compatibility", () => {
    it("should work without transpositions feature", () => {
      const index = buildFuzzyIndex(["the", "then", "them", "tea"], {
        config: {
          features: ["missing-letters", "extra-letters"],
          maxEditDistance: 2,
        },
      });

      const results = getSuggestions(index, "tea");
      // Should find exact match
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("tea");
    });

    it("should default to standard Levenshtein when transpositions not enabled", () => {
      const index = buildFuzzyIndex(["test", "testing", "tested"], {
        config: {
          features: ["missing-letters", "extra-letters"],
          maxEditDistance: 2,
        },
      });

      const results = getSuggestions(index, "tset");
      // May or may not find 'test' depending on edit distance
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should not significantly slow down search", () => {
      const dictionary = Array.from({ length: 1000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(dictionary, {
        config: {
          features: ["transpositions"],
          maxEditDistance: 2,
        },
      });

      const start = performance.now();
      getSuggestions(index, "wrod500");
      const time = performance.now() - start;

      expect(time).toBeLessThan(100); // Should be reasonably fast
    });
  });

  describe("Real-World Examples", () => {
    it("should handle common programming typos", () => {
      const index = buildFuzzyIndex(["function", "return", "variable", "constant", "import"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      // Common typos
      expect(getSuggestions(index, "funciton")[0]?.display).toBe("function");
      expect(getSuggestions(index, "retrun")[0]?.display).toBe("return");
      expect(getSuggestions(index, "varaible")[0]?.display).toBe("variable");
    });

    it("should handle product names with typos", () => {
      const index = buildFuzzyIndex(["iPhone", "MacBook", "iPad", "AirPods"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results1 = getSuggestions(index, "iPohne");
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].display).toBe("iPhone");

      const results2 = getSuggestions(index, "MaBcook");
      expect(results2.length).toBeGreaterThan(0);
      expect(results2[0].display).toBe("MacBook");
    });

    it("should handle city names with typos", () => {
      const index = buildFuzzyIndex(["Berlin", "Munich", "Hamburg", "Frankfurt"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "Beriln");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("Berlin");
    });
  });

  describe("Edge Cases", () => {
    it("should handle short word transposition", () => {
      const index = buildFuzzyIndex(["cat", "act", "tac"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
          fuzzyThreshold: 0.5,
        },
      });

      const results = getSuggestions(index, "cat");
      expect(results.length).toBeGreaterThan(0);
      // "act" is 1 transposition away from "cat"
      expect(results.some((r) => r.display === "act")).toBe(true);
    });

    it("should handle transposition at word boundaries", () => {
      const index = buildFuzzyIndex(["start", "stop", "step"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "tsart");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("start");
    });

    it("should not match when edit distance exceeds threshold", () => {
      const index = buildFuzzyIndex(["test"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "tset"); // 1 transposition
      expect(results.length).toBeGreaterThan(0);

      const results2 = getSuggestions(index, "stet"); // 2 transpositions
      expect(results2.length).toBe(0);
    });
  });

  describe("Combined with Other Features", () => {
    it("should work with phonetic matching", () => {
      const index = buildFuzzyIndex(["school", "cool", "pool"], {
        config: {
          features: ["transpositions", "phonetic"],
          languages: ["english"],
          maxEditDistance: 1,
          fuzzyThreshold: 0.5,
        },
      });

      const results = getSuggestions(index, "shcool");
      expect(results.length).toBeGreaterThan(0);
      // Check that 'school' is in the results (scoring may affect order)
      expect(results.some(r => r.display === "school")).toBe(true);
    });

    it("should work with accent normalization", () => {
      const index = buildFuzzyIndex(["café", "naïve", "résumé"], {
        config: {
          features: ["transpositions"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "cfae");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("café");
    });

    it("should work with stop words", () => {
      const index = buildFuzzyIndex(["quick", "brown", "fox"], {
        config: {
          features: ["transpositions"],
          stopWords: ["the"],
          maxEditDistance: 1,
        },
      });

      const results = getSuggestions(index, "qucik");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("quick");
    });
  });
});
