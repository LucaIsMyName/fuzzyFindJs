import type { FuzzyIndex, SuggestionResult, BuildIndexOptions, SearchOptions } from "./types.js";
/**
 * Builds a fuzzy search index from an array of words or objects.
 *
 * This is the primary function for creating a searchable index. It processes each word/object
 * through language-specific processors, builds various indices (phonetic, n-gram, synonym),
 * and automatically enables optimizations like inverted index for large datasets (10k+ items).
 *
 * @param words - Array of strings to index, or objects with fields to search across
 * @param options - Configuration options for index building
 * @param options.config - Fuzzy search configuration (languages, features, thresholds)
 * @param options.languageProcessors - Custom language processors (overrides default)
 * @param options.onProgress - Callback for tracking indexing progress (processed, total)
 * @param options.useInvertedIndex - Force inverted index usage (auto-enabled for 10k+ words)
 * @param options.fields - Field names for multi-field search (required when indexing objects)
 * @param options.fieldWeights - Weight multipliers for field scoring (e.g., {title: 2.0, description: 1.0})
 *
 * @returns A searchable fuzzy index containing all processed data and metadata
 *
 * @throws {Error} If no language processors found for specified languages
 * @throws {Error} If objects are provided without specifying fields via options.fields
 *
 * @example
 * ```typescript
 * // Simple string array
 * const index = buildFuzzyIndex(['apple', 'banana', 'cherry'], {
 *   config: { languages: ['english'], performance: 'fast' }
 * });
 *
 * // Multi-field objects
 * const products = [
 *   { name: 'iPhone', description: 'Smartphone', price: 999 },
 *   { name: 'MacBook', description: 'Laptop', price: 1999 }
 * ];
 * const index = buildFuzzyIndex(products, {
 *   fields: ['name', 'description'],
 *   fieldWeights: { name: 2.0, description: 1.0 }
 * });
 *
 * // With progress tracking
 * const index = buildFuzzyIndex(largeDataset, {
 *   onProgress: (processed, total) => {
 *     console.log(`Indexing: ${(processed/total*100).toFixed(1)}%`);
 *   }
 * });
 * ```
 *
 * @see {@link getSuggestions} for searching the index
 * @see {@link BuildIndexOptions} for all configuration options
 * @see {@link FuzzyConfig} for fuzzy search settings
 */
export declare function buildFuzzyIndex(words?: (string | any)[], options?: BuildIndexOptions): FuzzyIndex;
/**
 * Searches multiple queries at once with automatic deduplication.
 *
 * This function efficiently processes multiple search queries by deduplicating identical
 * queries and leveraging the search cache. Perfect for batch processing or multi-field forms.
 *
 * @param index - The fuzzy search index to search against
 * @param queries - Array of search query strings
 * @param maxResults - Maximum results per query (optional, defaults to index config)
 * @param options - Search options to apply to all queries
 *
 * @returns Object mapping each unique query to its search results
 *
 * @example
 * ```typescript
 * const results = batchSearch(index, ['apple', 'banana', 'apple', 'cherry']);
 * // Returns: { apple: [...], banana: [...], cherry: [...] }
 * // Note: 'apple' only searched once despite appearing twice
 *
 * // With options
 * const results = batchSearch(index, ['app', 'ban'], 5, {
 *   includeHighlights: true,
 *   fuzzyThreshold: 0.8
 * });
 * ```
 *
 * @see {@link getSuggestions} for single query search
 */
export declare function batchSearch(index: FuzzyIndex, queries: string[], maxResults?: number, options?: SearchOptions): Record<string, SuggestionResult[]>;
/**
 * Searches the index for fuzzy matches to the query string.
 *
 * This is the primary search function. It automatically selects the optimal search strategy
 * (inverted index for large datasets, hash-based for smaller ones), handles phrase search,
 * FQL queries, stop word filtering, and caching for performance.
 *
 * @param index - The fuzzy search index to search against
 * @param query - The search query string (supports phrases in quotes, FQL with fql() wrapper)
 * @param maxResults - Maximum number of results to return (optional, defaults to index config)
 * @param options - Search options to customize behavior
 * @param options.fuzzyThreshold - Override fuzzy matching threshold (0-1, higher = stricter)
 * @param options.languages - Filter to specific languages
 * @param options.matchTypes - Filter to specific match types (exact, fuzzy, phonetic, etc.)
 * @param options.debug - Include debug information in results
 * @param options.includeHighlights - Include match position highlights for UI rendering
 * @param options.enableFQL - Enable Fuzzy Query Language support (AND, OR, NOT operators)
 *
 * @returns Array of suggestion results sorted by relevance score (highest first)
 *
 * @example
 * ```typescript
 * // Basic search
 * const results = getSuggestions(index, 'hospitl', 5);
 * // Returns: [{ display: 'Hospital', score: 0.92, ... }]
 *
 * // With highlights for UI
 * const results = getSuggestions(index, 'app', 10, {
 *   includeHighlights: true
 * });
 * // Results include highlight positions for rendering
 *
 * // Phrase search
 * const results = getSuggestions(index, '"new york"');
 * // Finds multi-word phrases
 *
 * // FQL query
 * const results = getSuggestions(index, 'fql(doctor AND berlin)', 10, {
 *   enableFQL: true
 * });
 *
 * // With debug info
 * const results = getSuggestions(index, 'query', 5, { debug: true });
 * // Results include timing and match details
 * ```
 *
 * @see {@link buildFuzzyIndex} for creating the index
 * @see {@link batchSearch} for searching multiple queries
 */
export declare function getSuggestions(index: FuzzyIndex, query: string, maxResults?: number, options?: SearchOptions): SuggestionResult[];
/**
 * Update an existing index by adding new items
 * Much faster than rebuilding the entire index
 *
 * @param index - Existing fuzzy index to update
 * @param newItems - New items to add (strings or objects)
 * @param options - Optional configuration (uses index's existing config by default)
 * @returns Updated index (mutates the original)
 *
 * @example
 * const index = buildFuzzyIndex(['apple', 'banana']);
 * updateIndex(index, ['cherry', 'date']);
 * // Index now contains: apple, banana, cherry, date
 */
export declare function updateIndex(index: FuzzyIndex, newItems?: (string | any)[], options?: Partial<BuildIndexOptions>): FuzzyIndex;
/**
 * Remove items from an existing index
 *
 * @param index - Existing fuzzy index to update
 * @param itemsToRemove - Items to remove (exact matches)
 * @returns Updated index (mutates the original)
 *
 * @example
 * const index = buildFuzzyIndex(['apple', 'banana', 'cherry']);
 * removeFromIndex(index, ['banana']);
 * // Index now contains: apple, cherry
 */
export declare function removeFromIndex(index: FuzzyIndex, itemsToRemove?: string[]): FuzzyIndex;
//# sourceMappingURL=index.d.ts.map