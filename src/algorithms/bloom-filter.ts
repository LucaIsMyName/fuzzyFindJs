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

export class BloomFilter {
  private bitArray: Uint8Array;
  private size: number;
  private numHashFunctions: number;
  private numElements: number = 0;

  constructor(config: BloomFilterConfig) {
    // Calculate optimal bit array size
    // m = -(n * ln(p)) / (ln(2)^2)
    // where n = expected elements, p = false positive rate
    const n = config.expectedElements;
    const p = config.falsePositiveRate;
    
    this.size = Math.ceil(-(n * Math.log(p)) / (Math.log(2) ** 2));
    
    // Calculate optimal number of hash functions
    // k = (m / n) * ln(2)
    this.numHashFunctions = Math.ceil((this.size / n) * Math.log(2));
    
    // Use Uint8Array for efficient bit storage (8 bits per byte)
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
  }

  /**
   * Add an element to the bloom filter
   */
  add(item: string): void {
    const hashes = this.getHashes(item);
    
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      this.bitArray[byteIndex] |= (1 << bitIndex);
    }
    
    this.numElements++;
  }

  /**
   * Check if an element might be in the set
   * Returns:
   * - true: element MIGHT be in the set (could be false positive)
   * - false: element is DEFINITELY NOT in the set (no false negatives)
   */
  mightContain(item: string): boolean {
    const hashes = this.getHashes(item);
    
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      
      if ((this.bitArray[byteIndex] & (1 << bitIndex)) === 0) {
        return false; // Definitely not in set
      }
    }
    
    return true; // Might be in set
  }

  /**
   * Generate multiple hash values for an item
   * Uses double hashing technique for efficiency
   */
  private getHashes(item: string): number[] {
    const hash1 = this.hash(item, 0);
    const hash2 = this.hash(item, 1);
    
    const hashes: number[] = [];
    
    for (let i = 0; i < this.numHashFunctions; i++) {
      // Double hashing: h(i) = (hash1 + i * hash2) mod m
      const combinedHash = (hash1 + i * hash2) % this.size;
      hashes.push(Math.abs(combinedHash));
    }
    
    return hashes;
  }

  /**
   * Simple hash function (FNV-1a variant)
   */
  private hash(str: string, seed: number): number {
    let hash = 2166136261 ^ seed; // FNV offset basis
    
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    
    return hash >>> 0; // Convert to unsigned 32-bit integer
  }

  /**
   * Get current false positive probability
   * Actual rate may differ from configured rate as elements are added
   */
  getFalsePositiveRate(): number {
    if (this.numElements === 0) return 0;
    
    // p = (1 - e^(-kn/m))^k
    // where k = num hash functions, n = num elements, m = bit array size
    const k = this.numHashFunctions;
    const n = this.numElements;
    const m = this.size;
    
    return Math.pow(1 - Math.exp((-k * n) / m), k);
  }

  /**
   * Get statistics about the bloom filter
   */
  getStats(): {
    size: number;
    numHashFunctions: number;
    numElements: number;
    falsePositiveRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.size,
      numHashFunctions: this.numHashFunctions,
      numElements: this.numElements,
      falsePositiveRate: this.getFalsePositiveRate(),
      memoryUsage: this.bitArray.byteLength,
    };
  }

  /**
   * Clear all elements from the filter
   */
  clear(): void {
    this.bitArray.fill(0);
    this.numElements = 0;
  }

  /**
   * Serialize bloom filter to JSON
   */
  toJSON(): {
    bitArray: number[];
    size: number;
    numHashFunctions: number;
    numElements: number;
  } {
    return {
      bitArray: Array.from(this.bitArray),
      size: this.size,
      numHashFunctions: this.numHashFunctions,
      numElements: this.numElements,
    };
  }

  /**
   * Deserialize bloom filter from JSON
   */
  static fromJSON(data: {
    bitArray: number[];
    size: number;
    numHashFunctions: number;
    numElements: number;
  }): BloomFilter {
    // Create a dummy filter with minimal config
    const filter = new BloomFilter({
      expectedElements: 100,
      falsePositiveRate: 0.01,
    });
    
    // Override with saved data
    filter.bitArray = new Uint8Array(data.bitArray);
    filter.size = data.size;
    filter.numHashFunctions = data.numHashFunctions;
    filter.numElements = data.numElements;
    
    return filter;
  }
}

/**
 * Create a bloom filter with sensible defaults
 */
export function createBloomFilter(expectedElements: number, falsePositiveRate: number = 0.01): BloomFilter {
  return new BloomFilter({
    expectedElements,
    falsePositiveRate,
  });
}
