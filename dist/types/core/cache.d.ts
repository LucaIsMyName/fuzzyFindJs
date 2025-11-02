/**
 * LRU Cache for Search Results
 * Provides 10-100x speedup for repeated queries (e.g., autocomplete)
 */
import type { SuggestionResult } from "./types.js";
/**
 * LRU (Least Recently Used) Cache
 * Automatically evicts oldest entries when capacity is reached
 */
export declare class LRUCache<K, V> {
    private cache;
    private capacity;
    constructor(capacity?: number);
    /**
     * Get value from cache
     * Moves item to end (most recently used)
     */
    get(key: K): V | undefined;
    /**
     * Set value in cache
     * Evicts oldest entry if capacity exceeded
     */
    set(key: K, value: V): void;
    /**
     * Check if key exists in cache
     */
    has(key: K): boolean;
    /**
     * Clear all cached entries
     */
    clear(): void;
    /**
     * Get current cache size
     */
    get size(): number;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        capacity: number;
        utilization: number;
    };
}
/**
 * Search Result Cache
 * Caches search results with automatic invalidation
 */
export declare class SearchCache {
    private cache;
    private hits;
    private misses;
    constructor(capacity?: number);
    /**
     * Generate cache key from query and options
     */
    private getCacheKey;
    /**
     * Get cached results
     */
    get(query: string, maxResults?: number, options?: any): SuggestionResult[] | undefined;
    /**
     * Set cached results
     */
    set(query: string, results: SuggestionResult[], maxResults?: number, options?: any): void;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        capacity: number;
        hits: number;
        misses: number;
        hitRate: number;
    };
}
//# sourceMappingURL=cache.d.ts.map