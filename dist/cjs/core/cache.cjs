"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
class LRUCache {
  cache;
  capacity;
  constructor(capacity = 100) {
    this.cache = /* @__PURE__ */ new Map();
    this.capacity = capacity;
  }
  /**
   * Get value from cache
   * Moves item to end (most recently used)
   */
  get(key) {
    if (!this.cache.has(key)) {
      return void 0;
    }
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  /**
   * Set value in cache
   * Evicts oldest entry if capacity exceeded
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
  }
  /**
   * Check if key exists in cache
   */
  has(key) {
    return this.cache.has(key);
  }
  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get current cache size
   */
  get size() {
    return this.cache.size;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      utilization: this.cache.size / this.capacity
    };
  }
}
class SearchCache {
  cache;
  hits = 0;
  misses = 0;
  constructor(capacity = 100) {
    this.cache = new LRUCache(capacity);
  }
  /**
   * Generate cache key from query and options
   */
  getCacheKey(query, maxResults, options) {
    const optionsKey = options ? JSON.stringify(options) : "";
    return `${query}|${maxResults || "default"}|${optionsKey}`;
  }
  /**
   * Get cached results
   */
  get(query, maxResults, options) {
    const key = this.getCacheKey(query, maxResults, options);
    const result = this.cache.get(key);
    if (result) {
      this.hits++;
    } else {
      this.misses++;
    }
    return result;
  }
  /**
   * Set cached results
   */
  set(query, results, maxResults, options) {
    const key = this.getCacheKey(query, maxResults, options);
    this.cache.set(key, results);
  }
  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    return {
      ...cacheStats,
      hits: this.hits,
      misses: this.misses,
      hitRate
    };
  }
}
exports.LRUCache = LRUCache;
exports.SearchCache = SearchCache;
//# sourceMappingURL=cache.cjs.map
