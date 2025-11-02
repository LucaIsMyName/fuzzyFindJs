class BloomFilter {
  bitArray;
  size;
  numHashFunctions;
  numElements = 0;
  constructor(config) {
    const n = config.expectedElements;
    const p = config.falsePositiveRate;
    this.size = Math.ceil(-(n * Math.log(p)) / Math.log(2) ** 2);
    this.numHashFunctions = Math.ceil(this.size / n * Math.log(2));
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
  }
  /**
   * Add an element to the bloom filter
   */
  add(item) {
    const hashes = this.getHashes(item);
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      this.bitArray[byteIndex] |= 1 << bitIndex;
    }
    this.numElements++;
  }
  /**
   * Check if an element might be in the set
   * Returns:
   * - true: element MIGHT be in the set (could be false positive)
   * - false: element is DEFINITELY NOT in the set (no false negatives)
   */
  mightContain(item) {
    const hashes = this.getHashes(item);
    for (const hash of hashes) {
      const byteIndex = Math.floor(hash / 8);
      const bitIndex = hash % 8;
      if ((this.bitArray[byteIndex] & 1 << bitIndex) === 0) {
        return false;
      }
    }
    return true;
  }
  /**
   * Generate multiple hash values for an item
   * Uses double hashing technique for efficiency
   */
  getHashes(item) {
    const hash1 = this.hash(item, 0);
    const hash2 = this.hash(item, 1);
    const hashes = [];
    for (let i = 0; i < this.numHashFunctions; i++) {
      const combinedHash = (hash1 + i * hash2) % this.size;
      hashes.push(Math.abs(combinedHash));
    }
    return hashes;
  }
  /**
   * Simple hash function (FNV-1a variant)
   */
  hash(str, seed) {
    let hash = 2166136261 ^ seed;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }
  /**
   * Get current false positive probability
   * Actual rate may differ from configured rate as elements are added
   */
  getFalsePositiveRate() {
    if (this.numElements === 0) return 0;
    const k = this.numHashFunctions;
    const n = this.numElements;
    const m = this.size;
    return Math.pow(1 - Math.exp(-k * n / m), k);
  }
  /**
   * Get statistics about the bloom filter
   */
  getStats() {
    return {
      size: this.size,
      numHashFunctions: this.numHashFunctions,
      numElements: this.numElements,
      falsePositiveRate: this.getFalsePositiveRate(),
      memoryUsage: this.bitArray.byteLength
    };
  }
  /**
   * Clear all elements from the filter
   */
  clear() {
    this.bitArray.fill(0);
    this.numElements = 0;
  }
  /**
   * Serialize bloom filter to JSON
   */
  toJSON() {
    return {
      bitArray: Array.from(this.bitArray),
      size: this.size,
      numHashFunctions: this.numHashFunctions,
      numElements: this.numElements
    };
  }
  /**
   * Deserialize bloom filter from JSON
   */
  static fromJSON(data) {
    const filter = new BloomFilter({
      expectedElements: 100,
      falsePositiveRate: 0.01
    });
    filter.bitArray = new Uint8Array(data.bitArray);
    filter.size = data.size;
    filter.numHashFunctions = data.numHashFunctions;
    filter.numElements = data.numElements;
    return filter;
  }
}
function createBloomFilter(expectedElements, falsePositiveRate = 0.01) {
  return new BloomFilter({
    expectedElements,
    falsePositiveRate
  });
}
export {
  BloomFilter,
  createBloomFilter
};
//# sourceMappingURL=bloom-filter.js.map
