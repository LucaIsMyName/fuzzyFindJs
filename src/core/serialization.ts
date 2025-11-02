/**
 * Index Serialization
 * Save and load fuzzy search indices for 100x faster startup
 */

import type { FuzzyIndex } from "./types.js";
import { SearchCache } from "./cache.js";

/**
 * Serializable index format (JSON-compatible)
 */
interface SerializedIndex {
  version: string;
  base: string[];
  variantToBase: [string, string[]][];
  phoneticToBase: [string, string[]][];
  ngramIndex: [string, string[]][];
  synonymMap: [string, string[]][];
  config: any;
  languageProcessorNames: string[];
  invertedIndex?: any;
  documents?: any[];
}

/**
 * Serialize a FuzzyIndex to JSON string
 */
export function serializeIndex(index: FuzzyIndex): string {
  const serialized: SerializedIndex = {
    version: "1.0",
    base: index.base,
    variantToBase: Array.from(index.variantToBase.entries()).map(([k, v]) => [k, Array.from(v)]),
    phoneticToBase: Array.from(index.phoneticToBase.entries()).map(([k, v]) => [k, Array.from(v)]),
    ngramIndex: Array.from(index.ngramIndex.entries()).map(([k, v]) => [k, Array.from(v)]),
    synonymMap: Array.from(index.synonymMap.entries()).map(([k, v]) => [k, Array.from(v)]),
    config: index.config,
    languageProcessorNames: Array.from(index.languageProcessors.keys()),
  };

  // Serialize inverted index if present
  if (index.invertedIndex) {
    serialized.invertedIndex = {
      termToPostings: Array.from(index.invertedIndex.termToPostings.entries()),
      phoneticToPostings: Array.from(index.invertedIndex.phoneticToPostings.entries()),
      ngramToPostings: Array.from(index.invertedIndex.ngramToPostings.entries()),
      synonymToPostings: Array.from(index.invertedIndex.synonymToPostings.entries()),
      totalDocs: index.invertedIndex.totalDocs,
      avgDocLength: index.invertedIndex.avgDocLength,
    };
  }

  // Serialize documents if present
  if (index.documents) {
    serialized.documents = index.documents;
  }

  return JSON.stringify(serialized);
}

/**
 * Deserialize a FuzzyIndex from JSON string
 */
export async function deserializeIndex(json: string): Promise<FuzzyIndex> {
  const data: SerializedIndex = JSON.parse(json);

  // Reconstruct Maps from arrays
  const variantToBase = new Map(data.variantToBase.map(([k, v]) => [k, new Set(v)]));
  const phoneticToBase = new Map(data.phoneticToBase.map(([k, v]) => [k, new Set(v)]));
  const ngramIndex = new Map(data.ngramIndex.map(([k, v]) => [k, new Set(v)]));
  const synonymMap = new Map(data.synonymMap.map(([k, v]) => [k, new Set(v)]));

  // Reconstruct language processors (need to import them)
  const { LanguageRegistry } = await import("../languages/index.js");
  const languageProcessors = new Map();
  for (const langName of data.languageProcessorNames) {
    const processor = LanguageRegistry.getProcessor(langName);
    if (processor) {
      languageProcessors.set(langName, processor);
    }
  }

  const index: FuzzyIndex = {
    base: data.base,
    variantToBase,
    phoneticToBase,
    ngramIndex,
    synonymMap,
    languageProcessors,
    config: data.config,
  };

  // Reconstruct inverted index if present
  if (data.invertedIndex) {
    index.invertedIndex = {
      termToPostings: new Map(data.invertedIndex.termToPostings),
      phoneticToPostings: new Map(data.invertedIndex.phoneticToPostings),
      ngramToPostings: new Map(data.invertedIndex.ngramToPostings),
      synonymToPostings: new Map(data.invertedIndex.synonymToPostings),
      totalDocs: data.invertedIndex.totalDocs,
      avgDocLength: data.invertedIndex.avgDocLength,
    };
  }

  // Reconstruct documents if present
  if (data.documents) {
    index.documents = data.documents;
  }

  // Reconstruct cache if enabled in config
  if (data.config.enableCache !== false) {
    const cacheSize = data.config.cacheSize || 100;
    index._cache = new SearchCache(cacheSize);
  }

  return index;
}

/**
 * Save index to localStorage (browser)
 */
export function saveIndexToLocalStorage(index: FuzzyIndex, key: string = "fuzzy-search-index"): void {
  if (typeof localStorage === "undefined") {
    throw new Error("localStorage is not available");
  }
  const serialized = serializeIndex(index);
  localStorage.setItem(key, serialized);
}

/**
 * Load index from localStorage (browser)
 */
export async function loadIndexFromLocalStorage(key: string = "fuzzy-search-index"): Promise<FuzzyIndex | null> {
  if (typeof localStorage === "undefined") {
    throw new Error("localStorage is not available");
  }
  const serialized = localStorage.getItem(key);
  if (!serialized) {
    return null;
  }
  return await deserializeIndex(serialized);
}

/**
 * Get serialized index size in bytes
 */
export function getSerializedSize(index: FuzzyIndex): number {
  const serialized = serializeIndex(index);
  return new Blob([serialized]).size;
}
