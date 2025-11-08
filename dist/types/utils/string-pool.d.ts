/**
 * String pooling utility for memory optimization
 * Deduplicates strings to reduce memory usage without data loss
 */
export declare class StringPool {
    private pool;
    private stats;
    constructor();
    /**
     * Intern a string - returns the canonical instance
     * If the string already exists in the pool, returns that instance
     * Otherwise, adds it to the pool and returns it
     */
    intern(str: string): string;
    /**
     * Intern an array of strings
     */
    internArray(strings: string[]): string[];
    /**
     * Intern a Set of strings
     */
    internSet(strings: Set<string>): Set<string>;
    /**
     * Get pooling statistics
     */
    getStats(): {
        deduplicationRate: string;
        memorySavedMB: string;
        totalStrings: number;
        uniqueStrings: number;
        memorySaved: number;
    };
    /**
     * Clear the pool
     */
    clear(): void;
    /**
     * Get pool size
     */
    size(): number;
}
/**
 * Global string pool instance for index building
 */
export declare const globalStringPool: StringPool;
//# sourceMappingURL=string-pool.d.ts.map