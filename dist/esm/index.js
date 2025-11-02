import { buildFuzzyIndex, getSuggestions } from "./core/index.js";
import { calculateHighlights, formatHighlightedHTML } from "./core/highlighting.js";
import { LRUCache, SearchCache } from "./core/cache.js";
import { DEFAULT_CONFIG, PERFORMANCE_CONFIGS, mergeConfig } from "./core/config.js";
import { LanguageRegistry } from "./languages/index.js";
import { areStringsSimilar, calculateDamerauLevenshteinDistance, calculateLevenshteinDistance, calculateNgramSimilarity, distanceToSimilarity } from "./algorithms/levenshtein.js";
import { GermanProcessor } from "./languages/german/GermanProcessor.js";
import { EnglishProcessor } from "./languages/english/EnglishProcessor.js";
import { SpanishProcessor } from "./languages/spanish/SpanishProcessor.js";
import { FrenchProcessor } from "./languages/french/FrenchProcessor.js";
import { BaseLanguageProcessor } from "./languages/base/LanguageProcessor.js";
function createFuzzySearch(dictionary, options = {}) {
  const index = buildFuzzyIndex(dictionary, {
    config: {
      languages: options.languages || ["german"],
      performance: options.performance || "balanced",
      maxResults: options.maxResults || 5
    }
  });
  return {
    search: (query, maxResults) => getSuggestions(index, query, maxResults),
    index
  };
}
const VERSION = "1.0.2";
export {
  BaseLanguageProcessor,
  DEFAULT_CONFIG,
  EnglishProcessor,
  FrenchProcessor,
  GermanProcessor,
  LRUCache,
  LanguageRegistry,
  PERFORMANCE_CONFIGS,
  SearchCache,
  SpanishProcessor,
  VERSION,
  areStringsSimilar,
  buildFuzzyIndex,
  calculateDamerauLevenshteinDistance,
  calculateHighlights,
  calculateLevenshteinDistance,
  calculateNgramSimilarity,
  createFuzzySearch,
  distanceToSimilarity,
  formatHighlightedHTML,
  getSuggestions,
  mergeConfig
};
//# sourceMappingURL=index.js.map
