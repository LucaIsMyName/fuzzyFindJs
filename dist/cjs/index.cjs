"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const index = require("./core/index.cjs");
const highlighting = require("./core/highlighting.cjs");
const cache = require("./core/cache.cjs");
const config = require("./core/config.cjs");
const index$1 = require("./languages/index.cjs");
const levenshtein = require("./algorithms/levenshtein.cjs");
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
exports.buildFuzzyIndex = index.buildFuzzyIndex;
exports.getSuggestions = index.getSuggestions;
exports.calculateHighlights = highlighting.calculateHighlights;
exports.formatHighlightedHTML = highlighting.formatHighlightedHTML;
exports.LRUCache = cache.LRUCache;
exports.SearchCache = cache.SearchCache;
exports.DEFAULT_CONFIG = config.DEFAULT_CONFIG;
exports.PERFORMANCE_CONFIGS = config.PERFORMANCE_CONFIGS;
exports.mergeConfig = config.mergeConfig;
exports.LanguageRegistry = index$1.LanguageRegistry;
exports.areStringsSimilar = levenshtein.areStringsSimilar;
exports.calculateDamerauLevenshteinDistance = levenshtein.calculateDamerauLevenshteinDistance;
exports.calculateLevenshteinDistance = levenshtein.calculateLevenshteinDistance;
exports.calculateNgramSimilarity = levenshtein.calculateNgramSimilarity;
exports.distanceToSimilarity = levenshtein.distanceToSimilarity;
exports.GermanProcessor = GermanProcessor.GermanProcessor;
exports.EnglishProcessor = EnglishProcessor.EnglishProcessor;
exports.SpanishProcessor = SpanishProcessor.SpanishProcessor;
exports.FrenchProcessor = FrenchProcessor.FrenchProcessor;
exports.BaseLanguageProcessor = LanguageProcessor.BaseLanguageProcessor;
exports.VERSION = VERSION;
exports.createFuzzySearch = createFuzzySearch;
//# sourceMappingURL=index.cjs.map
