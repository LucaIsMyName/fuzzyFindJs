"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const index = require("./core/index.cjs");
const highlighting = require("./core/highlighting.cjs");
const cache = require("./core/cache.cjs");
const serialization = require("./core/serialization.cjs");
const accentNormalization = require("./utils/accent-normalization.cjs");
const stopWords = require("./utils/stop-words.cjs");
const wordBoundaries = require("./utils/word-boundaries.cjs");
const dataIndexer = require("./utils/data-indexer.cjs");
const config = require("./core/config.cjs");
const index$1 = require("./languages/index.cjs");
const levenshtein = require("./algorithms/levenshtein.cjs");
const bm25 = require("./algorithms/bm25.cjs");
const bloomFilter = require("./algorithms/bloom-filter.cjs");
const GermanProcessor = require("./languages/german/GermanProcessor.cjs");
const EnglishProcessor = require("./languages/english/EnglishProcessor.cjs");
const SpanishProcessor = require("./languages/spanish/SpanishProcessor.cjs");
const FrenchProcessor = require("./languages/french/FrenchProcessor.cjs");
const LanguageProcessor = require("./languages/base/LanguageProcessor.cjs");
function createFuzzySearch(dictionary, options = {}) {
  const index$12 = index.buildFuzzyIndex(dictionary, {
    config: {
      languages: options.languages || ["german"],
      performance: options.performance || "balanced",
      maxResults: options.maxResults || 5
    }
  });
  return {
    search: (query, maxResults) => index.getSuggestions(index$12, query, maxResults),
    index: index$12
  };
}
const VERSION = "1.0.2";
exports.batchSearch = index.batchSearch;
exports.buildFuzzyIndex = index.buildFuzzyIndex;
exports.getSuggestions = index.getSuggestions;
exports.calculateHighlights = highlighting.calculateHighlights;
exports.formatHighlightedHTML = highlighting.formatHighlightedHTML;
exports.LRUCache = cache.LRUCache;
exports.SearchCache = cache.SearchCache;
exports.deserializeIndex = serialization.deserializeIndex;
exports.getSerializedSize = serialization.getSerializedSize;
exports.loadIndexFromLocalStorage = serialization.loadIndexFromLocalStorage;
exports.saveIndexToLocalStorage = serialization.saveIndexToLocalStorage;
exports.serializeIndex = serialization.serializeIndex;
exports.getAccentVariants = accentNormalization.getAccentVariants;
exports.hasAccents = accentNormalization.hasAccents;
exports.normalizeForComparison = accentNormalization.normalizeForComparison;
exports.removeAccents = accentNormalization.removeAccents;
exports.DEFAULT_STOP_WORDS = stopWords.DEFAULT_STOP_WORDS;
exports.filterStopWords = stopWords.filterStopWords;
exports.getStopWordsForLanguages = stopWords.getStopWordsForLanguages;
exports.isStopWord = stopWords.isStopWord;
exports.findWordBoundaryMatches = wordBoundaries.findWordBoundaryMatches;
exports.isWordBoundary = wordBoundaries.isWordBoundary;
exports.matchesAtWordBoundary = wordBoundaries.matchesAtWordBoundary;
exports.matchesWildcard = wordBoundaries.matchesWildcard;
exports.matchesWord = wordBoundaries.matchesWord;
exports.dataToIndex = dataIndexer.dataToIndex;
exports.dataToIndexAsync = dataIndexer.dataToIndexAsync;
exports.DEFAULT_CONFIG = config.DEFAULT_CONFIG;
exports.PERFORMANCE_CONFIGS = config.PERFORMANCE_CONFIGS;
exports.mergeConfig = config.mergeConfig;
exports.LanguageRegistry = index$1.LanguageRegistry;
exports.areStringsSimilar = levenshtein.areStringsSimilar;
exports.calculateDamerauLevenshteinDistance = levenshtein.calculateDamerauLevenshteinDistance;
exports.calculateLevenshteinDistance = levenshtein.calculateLevenshteinDistance;
exports.calculateNgramSimilarity = levenshtein.calculateNgramSimilarity;
exports.distanceToSimilarity = levenshtein.distanceToSimilarity;
exports.DEFAULT_BM25_CONFIG = bm25.DEFAULT_BM25_CONFIG;
exports.buildCorpusStats = bm25.buildCorpusStats;
exports.calculateBM25Score = bm25.calculateBM25Score;
exports.calculateIDF = bm25.calculateIDF;
exports.combineScores = bm25.combineScores;
exports.normalizeBM25Score = bm25.normalizeBM25Score;
exports.BloomFilter = bloomFilter.BloomFilter;
exports.createBloomFilter = bloomFilter.createBloomFilter;
exports.GermanProcessor = GermanProcessor.GermanProcessor;
exports.EnglishProcessor = EnglishProcessor.EnglishProcessor;
exports.SpanishProcessor = SpanishProcessor.SpanishProcessor;
exports.FrenchProcessor = FrenchProcessor.FrenchProcessor;
exports.BaseLanguageProcessor = LanguageProcessor.BaseLanguageProcessor;
exports.VERSION = VERSION;
exports.createFuzzySearch = createFuzzySearch;
//# sourceMappingURL=index.cjs.map
