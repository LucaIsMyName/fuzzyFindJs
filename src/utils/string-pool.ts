/**
 * String pooling utility for memory optimization
 * Deduplicates strings to reduce memory usage without data loss
 */

export class StringPool {
  private pool: Map<string, string>;
  private stats: {
    totalStrings: number;
    uniqueStrings: number;
    memorySaved: number;
  };

  constructor() {
    this.pool = new Map();
    this.stats = {
      totalStrings: 0,
      uniqueStrings: 0,
      memorySaved: 0,
    };
  }

  /**
   * Intern a string - returns the canonical instance
   * If the string already exists in the pool, returns that instance
   * Otherwise, adds it to the pool and returns it
   */
  intern(str: string): string {
    this.stats.totalStrings++;
    
    const existing = this.pool.get(str);
    if (existing !== undefined) {
      // String already in pool - memory saved!
      this.stats.memorySaved += str.length * 2; // Approximate bytes (UTF-16)
      return existing;
    }
    
    // New string - add to pool
    this.pool.set(str, str);
    this.stats.uniqueStrings++;
    return str;
  }

  /**
   * Intern an array of strings
   */
  internArray(strings: string[]): string[] {
    return strings.map(s => this.intern(s));
  }

  /**
   * Intern a Set of strings
   */
  internSet(strings: Set<string>): Set<string> {
    const result = new Set<string>();
    for (const str of strings) {
      result.add(this.intern(str));
    }
    return result;
  }

  /**
   * Get pooling statistics
   */
  getStats() {
    return {
      ...this.stats,
      deduplicationRate: this.stats.totalStrings > 0 
        ? ((this.stats.totalStrings - this.stats.uniqueStrings) / this.stats.totalStrings * 100).toFixed(2) + '%'
        : '0%',
      memorySavedMB: (this.stats.memorySaved / 1024 / 1024).toFixed(2) + ' MB',
    };
  }

  /**
   * Clear the pool
   */
  clear() {
    this.pool.clear();
    this.stats = {
      totalStrings: 0,
      uniqueStrings: 0,
      memorySaved: 0,
    };
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.pool.size;
  }
}

/**
 * Global string pool instance for index building
 */
export const globalStringPool = new StringPool();
