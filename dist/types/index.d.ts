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
export { buildFuzzyIndex, getSuggestions, batchSearch } from "./core/index.js";
export { calculateHighlights, formatHighlightedHTML } from "./core/highlighting.js";
export { SearchCache, LRUCache } from "./core/cache.js";
export { serializeIndex, deserializeIndex, saveIndexToLocalStorage, loadIndexFromLocalStorage, getSerializedSize } from "./core/serialization.js";
export { removeAccents, hasAccents, normalizeForComparison, getAccentVariants } from "./utils/accent-normalization.js";
export { filterStopWords, getStopWordsForLanguages, isStopWord, DEFAULT_STOP_WORDS } from "./utils/stop-words.js";
export { isWordBoundary, matchesAtWordBoundary, findWordBoundaryMatches, matchesWord, matchesWildcard } from "./utils/word-boundaries.js";
export { DEFAULT_CONFIG, PERFORMANCE_CONFIGS, mergeConfig } from "./core/config.js";
export type { FuzzyIndex, FuzzyConfig, SuggestionResult, SearchMatch, MatchType, FuzzyFeature, LanguageProcessor, BuildIndexOptions, SearchOptions, DebugInfo, SuggestionResultWithDebug } from "./core/types.js";
export { LanguageRegistry, GermanProcessor, EnglishProcessor, SpanishProcessor, FrenchProcessor, BaseLanguageProcessor } from "./languages/index.js";
export { calculateLevenshteinDistance, calculateDamerauLevenshteinDistance, calculateNgramSimilarity, distanceToSimilarity, areStringsSimilar } from "./algorithms/levenshtein.js";
/**
 * Quick start function with sensible defaults
 * Perfect for getting started quickly
 */
export declare function createFuzzySearch(dictionary: string[], options?: {
    languages?: string[];
    performance?: "fast" | "balanced" | "comprehensive";
    maxResults?: number;
}): {
    search: (query: string, maxResults?: number) => import("./core/types.js").SuggestionResult[];
    index: import("./core/types.js").FuzzyIndex;
};
/**
 * Version information
 */
export declare const VERSION = "1.0.2";
//# sourceMappingURL=index.d.ts.map