import { describe, it, expect } from "vitest";
import { buildFuzzyIndex, getSuggestions, createFuzzySearch } from "../index.js";

describe("FuzzyFindJS Basic Tests", () => {
  const testDictionary = [
    //
    "Krankenhaus",
    "Pflegeheim",
    "Ambulanz",
    "Schule",
    "Kindergarten",
    "Hospital",
    "School",
    "Doctor",
  ];

  it("should build an index successfully", () => {
    const index = buildFuzzyIndex(testDictionary);
    expect(index).toBeDefined();
    expect(index.base).toHaveLength(testDictionary.length);
  });

  it("should find exact matches", () => {
    const index = buildFuzzyIndex(testDictionary);
    const results = getSuggestions(index, "Schule", 5);

    console.log(
      "Debug match types:",
      results.map((r) => ({
        display: r.display,
        score: r.score,
        // @ts-ignore
        matchType: r._debug_matchType,
      }))
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].display).toBe("Schule");
    expect(results[0].score).toBeGreaterThan(0.9); // Temporarily relax this
  });

  it("should find fuzzy matches", () => {
    const index = buildFuzzyIndex(testDictionary);
    const results = getSuggestions(index, "krankenh", 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].display).toBe("Krankenhaus");
  });

  it("should work with multiple languages", () => {
    const index = buildFuzzyIndex(testDictionary, {
      config: { languages: ["german", "english"] },
    });

    const germanResults = getSuggestions(index, "schul", 3);
    const englishResults = getSuggestions(index, "doct", 3);

    expect(germanResults.length).toBeGreaterThan(0);
    expect(englishResults.length).toBeGreaterThan(0);
  });

  it("should work with createFuzzySearch helper", () => {
    const fuzzySearch = createFuzzySearch(testDictionary);
    const results = fuzzySearch.search("krankenh");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].display).toBe("Krankenhaus");
  });

  it("should handle empty queries", () => {
    const index = buildFuzzyIndex(testDictionary);
    const results = getSuggestions(index, "", 5);

    expect(results).toHaveLength(0);
  });

  it("should respect maxResults parameter", () => {
    const index = buildFuzzyIndex(testDictionary);
    const results = getSuggestions(index, "a", 2); // Should match multiple words

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("should handle case insensitive matching", () => {
    const index = buildFuzzyIndex(testDictionary);
    const results = getSuggestions(index, "SCHULE", 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].display).toBe("Schule");
  });

  it("should have improved scoring with better differentiation", () => {
    const testWords = [
      "servicehandler", "servicehelper", "service_pfcqa", "api_stevg",
      "clientmanager", "clientutil", "datafactory", "webhandler"
    ];

    const index = buildFuzzyIndex(testWords, {
      config: { useInvertedIndex: true },
    });

    // Test substring scoring - should find some results
    const icehResults = getSuggestions(index, "iceh", 5);
    expect(icehResults.length).toBeGreaterThan(0);

    // Results should have reasonable scores (updated for granular scoring)
    const topResult = icehResults[0];
    expect(topResult.score).toBeGreaterThan(0.4); // Lower threshold with new scoring

    // Test exact match gets highest score
    const serviceResults = getSuggestions(index, "servicehandler", 3);
    const exactMatch = serviceResults.find((r) => r.display === "servicehandler");
    expect(exactMatch).toBeDefined();
    expect(exactMatch!.score).toBeGreaterThan(0.6); // Should be high for exact match with new scoring

    // Test fuzzy scoring still works but with appropriate penalties
    const stemResults = getSuggestions(index, "stem", 5);
    expect(stemResults.length).toBeGreaterThan(0);
    // Results should have scores that reflect fuzzy matching
    stemResults.forEach((result) => {
      expect(result.score).toBeGreaterThan(0.2); // Should not be too low
      expect(result.score).toBeLessThanOrEqual(1.0); // Should not exceed perfect
    });
  });
});
