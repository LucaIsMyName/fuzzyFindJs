class StringPool {
  pool;
  stats;
  constructor() {
    this.pool = /* @__PURE__ */ new Map();
    this.stats = {
      totalStrings: 0,
      uniqueStrings: 0,
      memorySaved: 0
    };
  }
  /**
   * Intern a string - returns the canonical instance
   * If the string already exists in the pool, returns that instance
   * Otherwise, adds it to the pool and returns it
   */
  intern(str) {
    this.stats.totalStrings++;
    const existing = this.pool.get(str);
    if (existing !== void 0) {
      this.stats.memorySaved += str.length * 2;
      return existing;
    }
    this.pool.set(str, str);
    this.stats.uniqueStrings++;
    return str;
  }
  /**
   * Intern an array of strings
   */
  internArray(strings) {
    return strings.map((s) => this.intern(s));
  }
  /**
   * Intern a Set of strings
   */
  internSet(strings) {
    const result = /* @__PURE__ */ new Set();
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
      deduplicationRate: this.stats.totalStrings > 0 ? ((this.stats.totalStrings - this.stats.uniqueStrings) / this.stats.totalStrings * 100).toFixed(2) + "%" : "0%",
      memorySavedMB: (this.stats.memorySaved / 1024 / 1024).toFixed(2) + " MB"
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
      memorySaved: 0
    };
  }
  /**
   * Get pool size
   */
  size() {
    return this.pool.size;
  }
}
export {
  StringPool
};
//# sourceMappingURL=string-pool.js.map
