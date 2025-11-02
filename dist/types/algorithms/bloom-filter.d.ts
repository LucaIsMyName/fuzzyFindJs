/**
 * Bloom Filter Implementation
 * Probabilistic data structure for fast membership testing
 *
 * Benefits:
 * - O(1) lookup time
 * - Space-efficient (much smaller than Set/Map)
 * - No false negatives (if it says "no", it's definitely not there)
 * - Small false positive rate (configurable)
 *
 * Use case: Quickly check if a term exists before expensive lookups
 * Saves 50-70% of lookup time for non-existent terms
 */
export interface BloomFilterConfig {
    /** Expected number of elements */
    expectedElements: number;
    /** Desired false positive rate (0-1, e.g., 0.01 = 1%) */
    falsePositiveRate: number;
}
export declare class BloomFilter {
    private bitArray;
    private size;
    private numHashFunctions;
    private numElements;
    constructor(config: BloomFilterConfig);
    /**
     * Add an element to the bloom filter
     */
    add(item: string): void;
    /**
     * Check if an element might be in the set
     * Returns:
     * - true: element MIGHT be in the set (could be false positive)
     * - false: element is DEFINITELY NOT in the set (no false negatives)
     */
    mightContain(item: string): boolean;
    /**
     * Generate multiple hash values for an item
     * Uses double hashing technique for efficiency
     */
    private getHashes;
    /**
     * Simple hash function (FNV-1a variant)
     */
    private hash;
    /**
     * Get current false positive probability
     * Actual rate may differ from configured rate as elements are added
     */
    getFalsePositiveRate(): number;
    /**
     * Get statistics about the bloom filter
     */
    getStats(): {
        size: number;
        numHashFunctions: number;
        numElements: number;
        falsePositiveRate: number;
        memoryUsage: number;
    };
    /**
     * Clear all elements from the filter
     */
    clear(): void;
    /**
     * Serialize bloom filter to JSON
     */
    toJSON(): {
        bitArray: number[];
        size: number;
        numHashFunctions: number;
        numElements: number;
    };
    /**
     * Deserialize bloom filter from JSON
     */
    static fromJSON(data: {
        bitArray: number[];
        size: number;
        numHashFunctions: number;
        numElements: number;
    }): BloomFilter;
}
/**
 * Create a bloom filter with sensible defaults
 */
export declare function createBloomFilter(expectedElements: number, falsePositiveRate?: number): BloomFilter;
//# sourceMappingURL=bloom-filter.d.ts.map