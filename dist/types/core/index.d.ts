import type { FuzzyIndex, SuggestionResult, BuildIndexOptions, SearchOptions } from "./types.js";
/**
 * Build a fuzzy search index from a dictionary of words or objects
 */
export declare function buildFuzzyIndex(words?: (string | any)[], options?: BuildIndexOptions): FuzzyIndex;
/**
 * Batch search multiple queries at once
 * Deduplicates identical queries and returns results for all
 */
export declare function batchSearch(index: FuzzyIndex, queries: string[], maxResults?: number, options?: SearchOptions): Record<string, SuggestionResult[]>;
/**
 * Get fuzzy search suggestions from an index
 * Auto-detects whether to use inverted index or classic hash-based approach
 */
export declare function getSuggestions(index: FuzzyIndex, query: string, maxResults?: number, options?: SearchOptions): SuggestionResult[];
//# sourceMappingURL=index.d.ts.map