import { buildFuzzyIndex, getSuggestions } from "./core/index.js";
import { batchSearch, removeFromIndex, updateIndex } from "./core/index.js";
import { calculateHighlights, formatHighlightedHTML } from "./core/highlighting.js";
import { LRUCache, SearchCache } from "./core/cache.js";
import { deserializeIndex, getSerializedSize, loadIndexFromLocalStorage, saveIndexToLocalStorage, serializeIndex } from "./core/serialization.js";
import { applyFilters } from "./core/filters.js";
import { applySorting } from "./core/sorting.js";
import { getAccentVariants, hasAccents, normalizeForComparison, removeAccents } from "./utils/accent-normalization.js";
import { DEFAULT_STOP_WORDS, filterStopWords, getStopWordsForLanguages, isStopWord } from "./utils/stop-words.js";
import { findWordBoundaryMatches, isWordBoundary, matchesAtWordBoundary, matchesWildcard, matchesWord } from "./utils/word-boundaries.js";
import { dataToIndex, dataToIndexAsync } from "./utils/data-indexer.js";
import { hasPhraseSyntax, normalizePhrase, parseQuery, splitPhraseWords } from "./utils/phrase-parser.js";
import { detectLanguages, detectLanguagesWithConfidence, isValidLanguage, normalizeLanguageCode, sampleTextForDetection } from "./utils/language-detection.js";
import { DEFAULT_CONFIG, PERFORMANCE_CONFIGS, mergeConfig } from "./core/config.js";
import { LanguageRegistry } from "./languages/index.js";
import { areStringsSimilar, calculateDamerauLevenshteinDistance, calculateLevenshteinDistance, calculateNgramSimilarity, distanceToSimilarity } from "./algorithms/levenshtein.js";
import { DEFAULT_BM25_CONFIG, buildCorpusStats, calculateBM25Score, calculateIDF, combineScores, normalizeBM25Score } from "./algorithms/bm25.js";
import { BloomFilter, createBloomFilter } from "./algorithms/bloom-filter.js";
import { ArrayPool, MapPool, ObjectPool, SetPool, globalArrayPool, globalMapPool, globalSetPool, withPooledArray } from "./utils/memory-pool.js";
import { compareSegments, extractAlphaPart, extractNumericPart, getAlphaSegments, getNumericSegments, isAlphanumeric, segmentString } from "./utils/alphanumeric-segmenter.js";
import { GermanProcessor } from "./languages/german/GermanProcessor.js";
import { EnglishProcessor } from "./languages/english/EnglishProcessor.js";
import { SpanishProcessor } from "./languages/spanish/SpanishProcessor.js";
import { FrenchProcessor } from "./languages/french/FrenchProcessor.js";
import { BaseLanguageProcessor } from "./languages/base/LanguageProcessor.js";
function createFuzzySearch(dictionary, options = {}) {
  const index = buildFuzzyIndex(dictionary, {
    config: {
      languages: options.languages || ["english"],
      performance: options.performance || "balanced",
      maxResults: options.maxResults || 5
    }
  });
  return {
    search: (query, maxResults) => getSuggestions(index, query, maxResults),
    index
  };
}
const VERSION = "1.0.13";
export {
  ArrayPool,
  BaseLanguageProcessor,
  BloomFilter,
  DEFAULT_BM25_CONFIG,
  DEFAULT_CONFIG,
  DEFAULT_STOP_WORDS,
  EnglishProcessor,
  FrenchProcessor,
  GermanProcessor,
  LRUCache,
  LanguageRegistry,
  MapPool,
  ObjectPool,
  PERFORMANCE_CONFIGS,
  SearchCache,
  SetPool,
  SpanishProcessor,
  VERSION,
  applyFilters,
  applySorting,
  areStringsSimilar,
  batchSearch,
  buildCorpusStats,
  buildFuzzyIndex,
  calculateBM25Score,
  calculateDamerauLevenshteinDistance,
  calculateHighlights,
  calculateIDF,
  calculateLevenshteinDistance,
  calculateNgramSimilarity,
  combineScores,
  compareSegments,
  createBloomFilter,
  createFuzzySearch,
  dataToIndex,
  dataToIndexAsync,
  deserializeIndex,
  detectLanguages,
  detectLanguagesWithConfidence,
  distanceToSimilarity,
  extractAlphaPart,
  extractNumericPart,
  filterStopWords,
  findWordBoundaryMatches,
  formatHighlightedHTML,
  getAccentVariants,
  getAlphaSegments,
  getNumericSegments,
  getSerializedSize,
  getStopWordsForLanguages,
  getSuggestions,
  globalArrayPool,
  globalMapPool,
  globalSetPool,
  hasAccents,
  hasPhraseSyntax,
  isAlphanumeric,
  isStopWord,
  isValidLanguage,
  isWordBoundary,
  loadIndexFromLocalStorage,
  matchesAtWordBoundary,
  matchesWildcard,
  matchesWord,
  mergeConfig,
  normalizeBM25Score,
  normalizeForComparison,
  normalizeLanguageCode,
  normalizePhrase,
  parseQuery,
  removeAccents,
  removeFromIndex,
  sampleTextForDetection,
  saveIndexToLocalStorage,
  segmentString,
  serializeIndex,
  splitPhraseWords,
  updateIndex,
  withPooledArray
};
//# sourceMappingURL=index.js.map
