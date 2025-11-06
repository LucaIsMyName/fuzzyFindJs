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
export {
  //
  buildFuzzyIndex,
  getSuggestions,
  batchSearch,
  updateIndex,
  removeFromIndex,
} from "./core/index.js";

import {
  //
  buildFuzzyIndex,
  getSuggestions,
} from "./core/index.js";

// Highlighting utilities (for UI rendering)
export {
  //
  calculateHighlights,
  formatHighlightedHTML,
} from "./core/highlighting.js";

// Cache utilities (for advanced users)
export {
  //
  SearchCache,
  LRUCache,
} from "./core/cache.js";

// Serialization utilities (save/load indices)
export {
  //
  serializeIndex,
  deserializeIndex,
  saveIndexToLocalStorage,
  loadIndexFromLocalStorage,
  getSerializedSize,
} from "./core/serialization.js";

// E-Commerce: Filtering
export { applyFilters } from "./core/filters.js";
export type { RangeFilter, TermFilter, BooleanFilter, FilterOptions } from "./core/filters.js";

// E-Commerce: Sorting
export { applySorting } from "./core/sorting.js";
export type { SortOption, SortConfig } from "./core/sorting.js";

// Accent normalization utilities
export {
  //
  removeAccents,
  hasAccents,
  normalizeForComparison,
  getAccentVariants,
} from "./utils/accent-normalization.js";

// Stop words utilities
export {
  //
  filterStopWords,
  getStopWordsForLanguages,
  isStopWord,
  DEFAULT_STOP_WORDS,
} from "./utils/stop-words.js";

// Word boundary utilities
export {
  //
  isWordBoundary,
  matchesAtWordBoundary,
  findWordBoundaryMatches,
  matchesWord,
  matchesWildcard,
} from "./utils/word-boundaries.js";

// Data indexing utilities
export {
  //
  dataToIndex,
  dataToIndexAsync,
} from "./utils/data-indexer.js";
export type {
  //
  DataToIndexOptions,
} from "./utils/data-indexer.js";

// Phrase parsing utilities
export {
  //
  parseQuery,
  hasPhraseSyntax,
  normalizePhrase,
  splitPhraseWords,
} from "./utils/phrase-parser.js";
export type {
  //
  ParsedQuery,
} from "./utils/phrase-parser.js";

// Language detection utilities
export {
  //
  detectLanguages,
  detectLanguagesWithConfidence,
  sampleTextForDetection,
  isValidLanguage,
  normalizeLanguageCode,
} from "./utils/language-detection.js";
export type {
  //
  LanguageDetectionResult,
} from "./utils/language-detection.js";

// Configuration
export {
  //
  DEFAULT_CONFIG,
  PERFORMANCE_CONFIGS,
  mergeConfig,
} from "./core/config.js";

// Types
export type {
  //
  FuzzyIndex,
  FuzzyConfig,
  SuggestionResult,
  SearchMatch,
  MatchType,
  FuzzyFeature,
  LanguageProcessor,
  BuildIndexOptions,
  SearchOptions,
  DebugInfo,
  SuggestionResultWithDebug,
} from "./core/types.js";

// Language processors
export {
  //
  LanguageRegistry,
  GermanProcessor,
  EnglishProcessor,
  SpanishProcessor,
  FrenchProcessor,
  BaseLanguageProcessor,
} from "./languages/index.js";

// Algorithms (for advanced users)
export {
  //
  calculateLevenshteinDistance,
  calculateDamerauLevenshteinDistance,
  calculateNgramSimilarity,
  distanceToSimilarity,
  areStringsSimilar,
} from "./algorithms/levenshtein.js";
export {
  //
  calculateBM25Score,
  calculateIDF,
  normalizeBM25Score,
  combineScores,
  buildCorpusStats,
  DEFAULT_BM25_CONFIG,
} from "./algorithms/bm25.js";
export type {
  //
  BM25Config,
  DocumentStats,
  CorpusStats,
} from "./algorithms/bm25.js";
export {
  //
  BloomFilter,
  createBloomFilter,
} from "./algorithms/bloom-filter.js";
export type {
  //
  BloomFilterConfig,
} from "./algorithms/bloom-filter.js";

// Memory pooling utilities (for performance optimization)
export {
  //
  ObjectPool,
  ArrayPool,
  MapPool,
  SetPool,
  withPooledArray,
  globalArrayPool,
  globalMapPool,
  globalSetPool,
} from "./utils/memory-pool.js";

// Alphanumeric segmentation utilities
export {
  //
  isAlphanumeric,
  segmentString,
  getAlphaSegments,
  getNumericSegments,
  extractAlphaPart,
  extractNumericPart,
  compareSegments,
} from "./utils/alphanumeric-segmenter.js";
export type {
  //
  Segment,
  SegmentType,
} from "./utils/alphanumeric-segmenter.js";

/**
 * Creates a fuzzy search instance with sensible defaults - the easiest way to get started.
 * 
 * This convenience function combines index building and searching into a simple API.
 * It's perfect for quick prototyping and simple use cases. For advanced features,
 * use {@link buildFuzzyIndex} and {@link getSuggestions} directly.
 * 
 * @param dictionary - Array of strings to make searchable
 * @param options - Simple configuration options
 * @param options.languages - Languages to enable (default: ['english'])
 * @param options.performance - Performance mode: 'fast', 'balanced', or 'comprehensive' (default: 'balanced')
 * @param options.maxResults - Maximum results to return per search (default: 5)
 * 
 * @returns Object with search() method and the underlying index
 * @returns {Function} search - Function to search the index: (query: string, maxResults?: number) => SuggestionResult[]
 * @returns {FuzzyIndex} index - The underlying fuzzy index (for advanced usage)
 * 
 * @example
 * ```typescript
 * // Quick start - one line setup
 * const search = createFuzzySearch(['apple', 'banana', 'cherry']);
 * const results = search.search('aple');
 * // Returns: [{ display: 'apple', score: 0.9, ... }]
 * 
 * // With options
 * const search = createFuzzySearch(['Krankenhaus', 'Apotheke'], {
 *   languages: ['german'],
 *   performance: 'comprehensive',
 *   maxResults: 10
 * });
 * 
 * // Access underlying index for advanced features
 * const { search: searchFn, index } = createFuzzySearch(['hello', 'world']);
 * console.log(index.base); // ['hello', 'world']
 * ```
 * 
 * @see {@link buildFuzzyIndex} for advanced index building
 * @see {@link getSuggestions} for advanced search options
 */
export function createFuzzySearch(
  //
  dictionary: string[],
  options: {
    languages?: string[];
    performance?: "fast" | "balanced" | "comprehensive";
    maxResults?: number;
  } = {}
) {
  const index = buildFuzzyIndex(dictionary, {
    config: {
      languages: options.languages || ["english"],
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
export const VERSION = "1.0.13";
