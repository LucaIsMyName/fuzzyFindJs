/**
 * N-gram Cache for avoiding duplicate computation
 * OPTIMIZATION: Reuses n-gram results across hash-based and inverted index building
 */
export declare class NgramCache {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    /**
     * Get n-grams for a string, using cache if available
     */
    get(str: string, n: number): string[];
    /**
     * Generate n-grams from a string
     */
    private generateNgrams;
    /**
     * Clear the cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
}
/**
 * Global n-gram cache instance for reuse across index building
 */
export declare const globalNgramCache: NgramCache;
//# sourceMappingURL=ngram-cache.d.ts.map