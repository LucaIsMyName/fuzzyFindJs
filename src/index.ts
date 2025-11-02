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
export { buildFuzzyIndex, getSuggestions, batchSearch } from "./core/index.js";
import { buildFuzzyIndex, getSuggestions } from "./core/index.js";

// Highlighting utilities (for UI rendering)
export { calculateHighlights, formatHighlightedHTML } from "./core/highlighting.js";

// Cache utilities (for advanced users)
export { SearchCache, LRUCache } from "./core/cache.js";

// Serialization utilities (save/load indices)
export { serializeIndex, deserializeIndex, saveIndexToLocalStorage, loadIndexFromLocalStorage, getSerializedSize } from "./core/serialization.js";

// Accent normalization utilities
export { removeAccents, hasAccents, normalizeForComparison, getAccentVariants } from "./utils/accent-normalization.js";

// Stop words utilities
export { filterStopWords, getStopWordsForLanguages, isStopWord, DEFAULT_STOP_WORDS } from "./utils/stop-words.js";

// Word boundary utilities
export { isWordBoundary, matchesAtWordBoundary, findWordBoundaryMatches, matchesWord, matchesWildcard } from "./utils/word-boundaries.js";

// Data indexing utilities
export { dataToIndex, dataToIndexAsync } from "./utils/data-indexer.js";
export type { DataToIndexOptions } from "./utils/data-indexer.js";

// Configuration
export { DEFAULT_CONFIG, PERFORMANCE_CONFIGS, mergeConfig } from "./core/config.js";

// Types
export type { FuzzyIndex, FuzzyConfig, SuggestionResult, SearchMatch, MatchType, FuzzyFeature, LanguageProcessor, BuildIndexOptions, SearchOptions, DebugInfo, SuggestionResultWithDebug } from "./core/types.js";

// Language processors
export { LanguageRegistry, GermanProcessor, EnglishProcessor, SpanishProcessor, FrenchProcessor, BaseLanguageProcessor } from "./languages/index.js";

// Algorithms (for advanced users)
export { calculateLevenshteinDistance, calculateDamerauLevenshteinDistance, calculateNgramSimilarity, distanceToSimilarity, areStringsSimilar } from "./algorithms/levenshtein.js";
export { calculateBM25Score, calculateIDF, normalizeBM25Score, combineScores, buildCorpusStats, DEFAULT_BM25_CONFIG } from "./algorithms/bm25.js";
export type { BM25Config, DocumentStats, CorpusStats } from "./algorithms/bm25.js";
export { BloomFilter, createBloomFilter } from "./algorithms/bloom-filter.js";
export type { BloomFilterConfig } from "./algorithms/bloom-filter.js";

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
export const VERSION = "1.0.2";
