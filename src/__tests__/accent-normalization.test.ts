import { describe, it, expect } from "vitest";
import { buildFuzzyIndex, getSuggestions, removeAccents, hasAccents, normalizeForComparison, getAccentVariants } from "../index.js";

describe("Feature 5: Accent Normalization", () => {
  describe("Utility Functions", () => {
    describe("removeAccents", () => {
      it("should remove French accents", () => {
        expect(removeAccents("café")).toBe("cafe");
        expect(removeAccents("naïve")).toBe("naive");
        expect(removeAccents("résumé")).toBe("resume");
        expect(removeAccents("crème brûlée")).toBe("creme brulee");
      });

      it("should remove Spanish accents", () => {
        expect(removeAccents("José")).toBe("Jose");
        expect(removeAccents("niño")).toBe("nino");
        expect(removeAccents("señor")).toBe("senor");
        expect(removeAccents("mañana")).toBe("manana");
      });

      it("should remove German umlauts", () => {
        expect(removeAccents("Müller")).toBe("Muller");
        expect(removeAccents("Köln")).toBe("Koln");
        expect(removeAccents("Zürich")).toBe("Zurich");
        expect(removeAccents("Straße")).toBe("Strasse");
      });

      it("should handle mixed accents", () => {
        expect(removeAccents("Café Müller")).toBe("Cafe Muller");
        expect(removeAccents("José García")).toBe("Jose Garcia");
      });

      it("should preserve non-accented text", () => {
        expect(removeAccents("hello")).toBe("hello");
        expect(removeAccents("world")).toBe("world");
        expect(removeAccents("123")).toBe("123");
      });

      it("should handle empty strings", () => {
        expect(removeAccents("")).toBe("");
      });
    });

    describe("hasAccents", () => {
      it("should detect accented characters", () => {
        expect(hasAccents("café")).toBe(true);
        expect(hasAccents("José")).toBe(true);
        expect(hasAccents("Müller")).toBe(true);
      });

      it("should return false for non-accented text", () => {
        expect(hasAccents("hello")).toBe(false);
        expect(hasAccents("world")).toBe(false);
        expect(hasAccents("123")).toBe(false);
      });
    });

    describe("normalizeForComparison", () => {
      it("should normalize and lowercase", () => {
        expect(normalizeForComparison("CAFÉ")).toBe("cafe");
        expect(normalizeForComparison("José")).toBe("jose");
        expect(normalizeForComparison("Müller")).toBe("muller");
      });
    });

    describe("getAccentVariants", () => {
      it("should return both original and normalized for accented words", () => {
        const variants = getAccentVariants("café");
        expect(variants).toContain("café");
        expect(variants).toContain("cafe");
        expect(variants.length).toBe(2);
      });

      it("should return only original for non-accented words", () => {
        const variants = getAccentVariants("hello");
        expect(variants).toEqual(["hello"]);
      });
    });
  });

  describe("Search Integration", () => {
    it("should find accented words with non-accented query", () => {
      const index = buildFuzzyIndex(["café", "naïve", "résumé"], {
        config: { languages: ["english"], minQueryLength: 1 },
      });

      const results1 = getSuggestions(index, "cafe");
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].display).toBe("café");

      const results2 = getSuggestions(index, "naive");
      expect(results2.length).toBeGreaterThan(0);
      expect(results2[0].display).toBe("naïve");

      const results3 = getSuggestions(index, "resume");
      expect(results3.length).toBeGreaterThan(0);
      expect(results3[0].display).toBe("résumé");
    });

    it("should find non-accented words with accented query", () => {
      const index = buildFuzzyIndex(["cafe", "naive", "resume"]);

      const results1 = getSuggestions(index, "café");
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].display).toBe("cafe");

      const results2 = getSuggestions(index, "naïve");
      expect(results2.length).toBeGreaterThan(0);
      expect(results2[0].display).toBe("naive");
    });

    it("should work with German umlauts", () => {
      const index = buildFuzzyIndex(["Müller", "Köln", "Zürich"], {
        config: { languages: ["english"] }, // Use English to avoid German umlaut conversion
      });

      const results1 = getSuggestions(index, "Muller");
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].display).toBe("Müller");

      const results2 = getSuggestions(index, "Koln");
      expect(results2.length).toBeGreaterThan(0);
      expect(results2[0].display).toBe("Köln");
    });

    it("should work with Spanish accents", () => {
      const index = buildFuzzyIndex(["José", "María", "niño"]);

      const results1 = getSuggestions(index, "Jose");
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].display).toBe("José");

      const results2 = getSuggestions(index, "nino");
      expect(results2.length).toBeGreaterThan(0);
      expect(results2[0].display).toBe("niño");
    });

    it("should work bidirectionally", () => {
      const index = buildFuzzyIndex(["café", "cafe", "Café"]);

      // Search with accent
      const results1 = getSuggestions(index, "café");
      expect(results1.length).toBeGreaterThan(0);

      // Search without accent
      const results2 = getSuggestions(index, "cafe");
      expect(results2.length).toBeGreaterThan(0);

      // Both should find matches
      expect(results1.length).toBeGreaterThanOrEqual(2);
      expect(results2.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Multi-language Support", () => {
    it("should handle French dictionary", () => {
      const french = ["café", "crème", "naïve", "résumé", "château"];
      const index = buildFuzzyIndex(french);

      expect(getSuggestions(index, "cafe").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "creme").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "chateau").length).toBeGreaterThan(0);
    });

    it("should handle German dictionary", () => {
      const german = ["Müller", "Köln", "Zürich", "Straße", "Äpfel"];
      const index = buildFuzzyIndex(german, {
        config: { languages: ["english"] }, // Use English to test pure accent normalization
      });

      expect(getSuggestions(index, "Muller").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Koln").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Strasse").length).toBeGreaterThan(0);
    });

    it("should handle Spanish dictionary", () => {
      const spanish = ["José", "María", "niño", "señor", "mañana"];
      const index = buildFuzzyIndex(spanish);

      expect(getSuggestions(index, "Jose").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Maria").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "manana").length).toBeGreaterThan(0);
    });

    it("should handle mixed language dictionary", () => {
      const mixed = ["café", "Müller", "José", "naïve", "Köln"];
      const index = buildFuzzyIndex(mixed, {
        config: { languages: ["english"] }, // Use English for consistent accent handling
      });

      expect(getSuggestions(index, "cafe").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Muller").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Jose").length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle words with multiple accents", () => {
      const index = buildFuzzyIndex(["Amélie", "Renée", "Zoë"]);

      expect(getSuggestions(index, "Amelie").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Renee").length).toBeGreaterThan(0);
      expect(getSuggestions(index, "Zoe").length).toBeGreaterThan(0);
    });

    it("should handle uppercase and lowercase", () => {
      const index = buildFuzzyIndex(["CAFÉ", "café", "Café"], {
        config: { languages: ["english"] },
      });

      const results = getSuggestions(index, "cafe");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should work with prefix matching", () => {
      const index = buildFuzzyIndex(["café", "cafétéria", "cafeine"]);

      const results = getSuggestions(index, "caf");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should preserve original display text", () => {
      const index = buildFuzzyIndex(["café"], {
        config: { languages: ["english"] },
      });

      const results = getSuggestions(index, "cafe");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("café"); // Original with accent
    });
  });

  describe("Performance", () => {
    it("should not significantly slow down search", () => {
      // Use 10K+ words to trigger inverted index for realistic performance
      const dictionary = Array.from({ length: 10000 }, (_, i) => `café${i}`);
      const index = buildFuzzyIndex(dictionary, {
        config: {
          performance: 'fast',
          useInvertedIndex: true
        }
      });

      const start = performance.now();
      getSuggestions(index, "cafe5000");
      const time = performance.now() - start;

      // With inverted index + caching, should be very fast
      expect(time).toBeLessThan(50); // Should be fast
    });
  });
});
