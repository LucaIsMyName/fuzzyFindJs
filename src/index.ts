/**
 * FuzzyFindJS - A powerful, multi-language optimized fuzzy search library
 *
 * @example
 * ```typescript
 * import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';
 *
 * const dictionary = ['Krankenhaus', 'Schule', 'Kindergarten'];
 * const index = buildFuzzyIndex(dictionary);
 * const results = getSuggestions(index, 'krankenh', 5);
 * ```
 */

// Core functionality
export { buildFuzzyIndex, getSuggestions } from "./core/index.js";
import { buildFuzzyIndex, getSuggestions } from "./core/index.js";

// Configuration
export { DEFAULT_CONFIG, PERFORMANCE_CONFIGS, mergeConfig } from "./core/config.js";

// Types
export type { FuzzyIndex, FuzzyConfig, SuggestionResult, SearchMatch, MatchType, FuzzyFeature, LanguageProcessor, BuildIndexOptions, SearchOptions, DebugInfo, SuggestionResultWithDebug } from "./core/types.js";

// Language processors
export { LanguageRegistry, GermanProcessor, EnglishProcessor, SpanishProcessor, FrenchProcessor, BaseLanguageProcessor } from "./languages/index.js";

// Algorithms (for advanced users)
export { calculateLevenshteinDistance, calculateDamerauLevenshteinDistance, calculateNgramSimilarity, distanceToSimilarity, areStringsSimilar } from "./algorithms/levenshtein.js";

/**
 * Quick start function with sensible defaults
 * Perfect for getting started quickly
 */
export function createFuzzySearch(
  dictionary: string[],
  options: {
    languages?: string[];
    performance?: "fast" | "balanced" | "comprehensive";
    maxResults?: number;
  } = {}
) {
  const index = buildFuzzyIndex(dictionary, {
    config: {
      languages: options.languages || ["german"],
      performance: options.performance || "balanced",
      maxResults: options.maxResults || 5,
    },
  });

  return {
    search: (query: string, maxResults?: number) => getSuggestions(index, query, maxResults),
    index,
  };
}

/**
 * Version information
 */
export const VERSION = "1.0.0";
