import type { FuzzyIndex, SuggestionResult, BuildIndexOptions, SearchOptions } from "./types.js";
/**
 * Build a fuzzy search index from a dictionary of words
 */
export declare function buildFuzzyIndex(words?: string[], options?: BuildIndexOptions): FuzzyIndex;
/**
 * Get fuzzy search suggestions from an index
 * Auto-detects whether to use inverted index or classic hash-based approach
 */
export declare function getSuggestions(index: FuzzyIndex, query: string, maxResults?: number, options?: SearchOptions): SuggestionResult[];
//# sourceMappingURL=index.d.ts.map