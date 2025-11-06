import type {
  //
  FuzzyIndex,
  FuzzyConfig,
  SuggestionResult,
  SearchMatch,
  BuildIndexOptions,
  SearchOptions,
  LanguageProcessor,
} from "./types.js";
import {
  //
  mergeConfig,
  validateConfig,
} from "./config.js";
import {
  //
  LanguageRegistry,
} from "../languages/index.js";
import {
  //
  calculateLevenshteinDistance,
  calculateDamerauLevenshteinDistance,
  calculateNgramSimilarity,
} from "../algorithms/levenshtein.js";
import {
  //
  buildInvertedIndex,
  searchInvertedIndex,
  calculateBM25Scores,
} from "./inverted-index.js";
import {
  //
  calculateHighlights,
} from "./highlighting.js";
import {
  //
  SearchCache,
} from "./cache.js";
import { removeAccents } from "../utils/accent-normalization.js";
import { extractFieldValues, normalizeFieldWeights } from "./field-weighting.js";
import { filterStopWords } from "../utils/stop-words.js";
import { matchesWord, matchesWildcard } from "../utils/word-boundaries.js";
import { parseQuery } from "../utils/phrase-parser.js";
import { matchPhrase } from "./phrase-matching.js";
import { detectLanguages, sampleTextForDetection } from "../utils/language-detection.js";
import { isFQLQuery, executeFQLQuery } from "../fql/index.js";
import { isAlphanumeric, extractAlphaPart, extractNumericPart } from "../utils/alphanumeric-segmenter.js";
import { applyFilters } from "./filters.js";
import { applySorting } from "./sorting.js";

/**
 * Builds a fuzzy search index from an array of words or objects.
 * 
 * This is the primary function for creating a searchable index. It processes each word/object
 * through language-specific processors, builds various indices (phonetic, n-gram, synonym),
 * and automatically enables optimizations like inverted index for large datasets (10k+ items).
 * 
 * @param words - Array of strings to index, or objects with fields to search across
 * @param options - Configuration options for index building
 * @param options.config - Fuzzy search configuration (languages, features, thresholds)
 * @param options.languageProcessors - Custom language processors (overrides default)
 * @param options.onProgress - Callback for tracking indexing progress (processed, total)
 * @param options.useInvertedIndex - Force inverted index usage (auto-enabled for 10k+ words)
 * @param options.fields - Field names for multi-field search (required when indexing objects)
 * @param options.fieldWeights - Weight multipliers for field scoring (e.g., {title: 2.0, description: 1.0})
 * 
 * @returns A searchable fuzzy index containing all processed data and metadata
 * 
 * @throws {Error} If no language processors found for specified languages
 * @throws {Error} If objects are provided without specifying fields via options.fields
 * 
 * @example
 * ```typescript
 * // Simple string array
 * const index = buildFuzzyIndex(['apple', 'banana', 'cherry'], {
 *   config: { languages: ['english'], performance: 'fast' }
 * });
 * 
 * // Multi-field objects
 * const products = [
 *   { name: 'iPhone', description: 'Smartphone', price: 999 },
 *   { name: 'MacBook', description: 'Laptop', price: 1999 }
 * ];
 * const index = buildFuzzyIndex(products, {
 *   fields: ['name', 'description'],
 *   fieldWeights: { name: 2.0, description: 1.0 }
 * });
 * 
 * // With progress tracking
 * const index = buildFuzzyIndex(largeDataset, {
 *   onProgress: (processed, total) => {
 *     console.log(`Indexing: ${(processed/total*100).toFixed(1)}%`);
 *   }
 * });
 * ```
 * 
 * @see {@link getSuggestions} for searching the index
 * @see {@link BuildIndexOptions} for all configuration options
 * @see {@link FuzzyConfig} for fuzzy search settings
 */
export function buildFuzzyIndex(words: (string | any)[] = [], options: BuildIndexOptions = {}): FuzzyIndex {
  // AUTO-DETECTION: Detect languages if not explicitly specified
  const userSpecifiedLanguages = options.config?.languages;
  const shouldAutoDetect = !userSpecifiedLanguages || userSpecifiedLanguages.includes('auto');
  
  const config = mergeConfig(options.config);
  
  if (shouldAutoDetect) {
    const sampleText = sampleTextForDetection(words, 100);
    const detectedLanguages = detectLanguages(sampleText);
    config.languages = detectedLanguages;
  }
  
  validateConfig(config);

  // Convert features array to Set for O(1) lookup performance
  const featureSet = new Set(config.features);

  const languageProcessors = options.languageProcessors || LanguageRegistry.getProcessors(config.languages);

  if (languageProcessors.length === 0) {
    throw new Error(`No language processors found for: ${config.languages.join(", ")}`);
  }

  // Check if we're doing multi-field search
  const hasFields = options.fields && options.fields.length > 0;
  const isObjectArray = words.length > 0 && typeof words[0] === "object" && words[0] !== null;

  // Validate: if objects are provided, fields must be specified
  if (isObjectArray && !hasFields) {
    throw new Error("When indexing objects, you must specify which fields to index via options.fields");
  }

  const index: FuzzyIndex = {
    base: [],
    variantToBase: new Map(),
    phoneticToBase: new Map(),
    ngramIndex: new Map(),
    synonymMap: new Map(),
    languageProcessors: new Map(),
    config,
  };

  // Store field configuration if provided
  if (hasFields) {
    index.fields = options.fields;
    index.fieldWeights = normalizeFieldWeights(options.fields!, options.fieldWeights);
    index.fieldData = new Map();
  }

  // Store language processors
  languageProcessors.forEach((processor) => {
    index.languageProcessors.set(processor.language, processor);
  });

  // OPTIMIZATION 2: Decide early whether to use inverted index to avoid building redundant structures
  // Use inverted index for large datasets (10k+) or when explicitly requested
  const shouldUseInvertedIndex = options.useInvertedIndex || config.useInvertedIndex || config.useBM25 || config.useBloomFilter || words.length >= 10000;

  const processedWords = new Set<string>();
  let processed = 0;

  // OPTIMIZATION 2: Only build hash maps if NOT using inverted index
  // This avoids storing the same data twice in different structures
  if (!shouldUseInvertedIndex) {
    for (const item of words) {
      if (!item) continue;

      // Handle multi-field objects
      if (hasFields && isObjectArray) {
        const fieldValues = extractFieldValues(item, options.fields);
        if (!fieldValues) continue;

        // Generate a unique ID for this object (use first field value as base)
        const baseId = Object.values(fieldValues)[0] || `item_${processed}`;

        // Store field data
        index.fieldData!.set(baseId, fieldValues);

        // Index each field separately
        for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
          if (!fieldValue || fieldValue.trim().length < config.minQueryLength) continue;

          const trimmedValue = fieldValue.trim();

          // Add to base if not already there
          if (!processedWords.has(baseId.toLowerCase())) {
            processedWords.add(baseId.toLowerCase());
            index.base.push(baseId);
          }

          // Process this field value with each language processor
          for (const processor of languageProcessors) {
            processWordWithProcessorAndField(trimmedValue, baseId, fieldName, processor, index, config, featureSet);
          }
        }
      } else {
        // Handle simple string array (backwards compatible)
        const word = typeof item === "string" ? item : String(item);
        if (word.trim().length < config.minQueryLength) continue;

        const trimmedWord = word.trim();
        if (processedWords.has(trimmedWord.toLowerCase())) continue;

        processedWords.add(trimmedWord.toLowerCase());
        index.base.push(trimmedWord);

        // Process with each language processor
        for (const processor of languageProcessors) {
          processWordWithProcessor(trimmedWord, processor, index, config, featureSet);
        }
      }

      processed++;
      if (options.onProgress) {
        options.onProgress(processed, words.length);
      }
    }
  }

  // INVERTED INDEX: Build for large datasets (contains all the data we need)
  if (shouldUseInvertedIndex) {
    const { invertedIndex, documents } = buildInvertedIndex(words, languageProcessors, config, featureSet);
    index.invertedIndex = invertedIndex;
    index.documents = documents;
    
    // Populate base array from documents for compatibility
    index.base = documents.map(doc => doc.word);
  }

  // CACHE: Initialize search result cache if enabled (default: true)
  const enableCache = config.enableCache !== false; // Default to true
  if (enableCache) {
    const cacheSize = config.cacheSize || 100;
    index._cache = new SearchCache(cacheSize);
  }

  return index;
}

/**
 * Process a word with a specific language processor
 */
function processWordWithProcessor(word: string, processor: LanguageProcessor, index: FuzzyIndex, config: FuzzyConfig, featureSet: Set<string>): void {
  const normalized = processor.normalize(word);

  // OPTIMIZATION: Store only lowercase normalized form to eliminate duplicates
  // All case variations (apple, Apple, APPLE) map to same lowercase key
  addToVariantMap(index.variantToBase, normalized.toLowerCase(), word);

  // Add accent-insensitive variants (also normalized to lowercase)
  const accentFreeWord = removeAccents(word);
  if (accentFreeWord !== word) {
    const normalizedAccentFree = processor.normalize(accentFreeWord).toLowerCase();
    // Only add if different from the already-stored normalized form
    if (normalizedAccentFree !== normalized.toLowerCase()) {
      addToVariantMap(index.variantToBase, normalizedAccentFree, word);
    }
  }

  // Generate and index variants (normalized to lowercase)
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(word, config.performance);
    variants.forEach((variant) => {
      addToVariantMap(index.variantToBase, variant.toLowerCase(), word);
    });
  }

  // Generate phonetic codes
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(word);
    if (phoneticCode) {
      addToVariantMap(index.phoneticToBase, phoneticCode, word);
    }
  }

  // Generate n-grams for partial matching (normalized to lowercase)
  // OPTIMIZATION 3: Limit n-gram generation in fast mode to reduce index size
  const shouldLimitNgrams = config.performance === 'fast' && normalized.length > 10;
  const ngramSource = shouldLimitNgrams ? normalized.substring(0, 15) : normalized;
  const ngrams = generateNgrams(ngramSource.toLowerCase(), config.ngramSize);
  ngrams.forEach((ngram: string) => {
    addToVariantMap(index.ngramIndex, ngram, word);
  });

  // Handle compound words (normalized to lowercase)
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const compoundParts = processor.splitCompoundWords(word);
    compoundParts.forEach((part) => {
      if (part !== word) {
        addToVariantMap(index.variantToBase, processor.normalize(part).toLowerCase(), word);
      }
    });
  }

  // Add synonyms (normalized to lowercase)
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMap(index.synonymMap, synonym.toLowerCase(), word);
    });

    // Add custom synonyms
    if (config.customSynonyms) {
      const customSynonyms = config.customSynonyms[normalized.toLowerCase()];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMap(index.synonymMap, synonym.toLowerCase(), word);
        });
      }
    }
  }
}

/**
 * Process a word with field information for multi-field search
 */
function processWordWithProcessorAndField(fieldValue: string, baseId: string, fieldName: string, processor: LanguageProcessor, index: FuzzyIndex, config: FuzzyConfig, featureSet: Set<string>): void {
  const normalized = processor.normalize(fieldValue);

  // OPTIMIZATION: Store only lowercase normalized form to eliminate duplicates
  addToVariantMapWithField(index.variantToBase, normalized.toLowerCase(), baseId, fieldName);

  // Add accent-insensitive variants (normalized to lowercase)
  const accentFreeWord = removeAccents(fieldValue);
  if (accentFreeWord !== fieldValue) {
    const normalizedAccentFree = processor.normalize(accentFreeWord).toLowerCase();
    if (normalizedAccentFree !== normalized.toLowerCase()) {
      addToVariantMapWithField(index.variantToBase, normalizedAccentFree, baseId, fieldName);
    }
  }

  // Generate and index variants (normalized to lowercase)
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(fieldValue, config.performance);
    variants.forEach((variant) => {
      addToVariantMapWithField(index.variantToBase, variant.toLowerCase(), baseId, fieldName);
    });
  }

  // Generate phonetic codes
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(fieldValue);
    if (phoneticCode) {
      addToVariantMapWithField(index.phoneticToBase, phoneticCode, baseId, fieldName);
    }
  }

  // Generate n-grams for partial matching (normalized to lowercase)
  // OPTIMIZATION 3: Limit n-gram generation in fast mode to reduce index size
  const shouldLimitNgrams = config.performance === 'fast' && normalized.length > 15;
  const ngramSource = shouldLimitNgrams ? normalized.substring(0, 15) : normalized;
  const ngrams = generateNgrams(ngramSource.toLowerCase(), config.ngramSize);
  ngrams.forEach((ngram: string) => {
    addToVariantMapWithField(index.ngramIndex, ngram, baseId, fieldName);
  });

  // Handle compound words (normalized to lowercase)
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const parts = processor.splitCompoundWords(fieldValue);
    parts.forEach((part) => {
      if (part.length >= config.minQueryLength) {
        addToVariantMapWithField(index.variantToBase, processor.normalize(part).toLowerCase(), baseId, fieldName);
      }
    });
  }

  // Add synonyms (normalized to lowercase)
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMapWithField(index.synonymMap, synonym.toLowerCase(), baseId, fieldName);
    });

    // Add custom synonyms
    if (config.customSynonyms) {
      const customSynonyms = config.customSynonyms[normalized.toLowerCase()];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMapWithField(index.synonymMap, synonym.toLowerCase(), baseId, fieldName);
        });
      }
    }
  }
}

/**
 * Helper function to add mappings to variant maps with field information
 */
function addToVariantMapWithField(map: Map<string, Set<string>>, key: string, value: string, _fieldName: string): void {
  // For now, we'll use a simple approach: store the value with field metadata
  // The field information will be tracked separately in the index
  // _fieldName is prefixed with _ to indicate it's reserved for future use
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key)!.add(value);
}

/**
 * Helper function to add mappings to variant maps
 */
function addToVariantMap(map: Map<string, Set<string>>, key: string, value: string): void {
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key)!.add(value);
}

/**
 * Searches multiple queries at once with automatic deduplication.
 * 
 * This function efficiently processes multiple search queries by deduplicating identical
 * queries and leveraging the search cache. Perfect for batch processing or multi-field forms.
 * 
 * @param index - The fuzzy search index to search against
 * @param queries - Array of search query strings
 * @param maxResults - Maximum results per query (optional, defaults to index config)
 * @param options - Search options to apply to all queries
 * 
 * @returns Object mapping each unique query to its search results
 * 
 * @example
 * ```typescript
 * const results = batchSearch(index, ['apple', 'banana', 'apple', 'cherry']);
 * // Returns: { apple: [...], banana: [...], cherry: [...] }
 * // Note: 'apple' only searched once despite appearing twice
 * 
 * // With options
 * const results = batchSearch(index, ['app', 'ban'], 5, {
 *   includeHighlights: true,
 *   fuzzyThreshold: 0.8
 * });
 * ```
 * 
 * @see {@link getSuggestions} for single query search
 */
export function batchSearch(index: FuzzyIndex, queries: string[], maxResults?: number, options: SearchOptions = {}): Record<string, SuggestionResult[]> {
  const results: Record<string, SuggestionResult[]> = {};
  const uniqueQueries = [...new Set(queries)]; // Deduplicate

  for (const query of uniqueQueries) {
    results[query] = getSuggestions(index, query, maxResults, options);
  }

  return results;
}

/**
 * Searches the index for fuzzy matches to the query string.
 * 
 * This is the primary search function. It automatically selects the optimal search strategy
 * (inverted index for large datasets, hash-based for smaller ones), handles phrase search,
 * FQL queries, stop word filtering, and caching for performance.
 * 
 * @param index - The fuzzy search index to search against
 * @param query - The search query string (supports phrases in quotes, FQL with fql() wrapper)
 * @param maxResults - Maximum number of results to return (optional, defaults to index config)
 * @param options - Search options to customize behavior
 * @param options.fuzzyThreshold - Override fuzzy matching threshold (0-1, higher = stricter)
 * @param options.languages - Filter to specific languages
 * @param options.matchTypes - Filter to specific match types (exact, fuzzy, phonetic, etc.)
 * @param options.debug - Include debug information in results
 * @param options.includeHighlights - Include match position highlights for UI rendering
 * @param options.enableFQL - Enable Fuzzy Query Language support (AND, OR, NOT operators)
 * 
 * @returns Array of suggestion results sorted by relevance score (highest first)
 * 
 * @example
 * ```typescript
 * // Basic search
 * const results = getSuggestions(index, 'hospitl', 5);
 * // Returns: [{ display: 'Hospital', score: 0.92, ... }]
 * 
 * // With highlights for UI
 * const results = getSuggestions(index, 'app', 10, {
 *   includeHighlights: true
 * });
 * // Results include highlight positions for rendering
 * 
 * // Phrase search
 * const results = getSuggestions(index, '"new york"');
 * // Finds multi-word phrases
 * 
 * // FQL query
 * const results = getSuggestions(index, 'fql(doctor AND berlin)', 10, {
 *   enableFQL: true
 * });
 * 
 * // With debug info
 * const results = getSuggestions(index, 'query', 5, { debug: true });
 * // Results include timing and match details
 * ```
 * 
 * @see {@link buildFuzzyIndex} for creating the index
 * @see {@link batchSearch} for searching multiple queries
 */
export function getSuggestions(index: FuzzyIndex, query: string, maxResults?: number, options: SearchOptions = {}): SuggestionResult[] {
  const config = index.config;
  const limit = maxResults || options.maxResults || config.maxResults;
  const threshold = options.fuzzyThreshold || config.fuzzyThreshold;

  if (!query || query.trim().length < config.minQueryLength) {
    return [];
  }

  // FQL: Check if FQL is enabled and query is FQL
  if (options.enableFQL && isFQLQuery(query)) {
    return executeFQLQuery(index, query, limit, options);
  }

  // PHRASE SEARCH: Check if query contains phrases
  const parsedQuery = parseQuery(query);
  
  // If query has phrases, use phrase search
  if (parsedQuery.hasPhrases) {
    return searchWithPhrases(index, parsedQuery, limit, threshold, options);
  }

  // STOP WORDS: Filter stop words from query if enabled
  let processedQuery = query;
  if (config.enableStopWords && config.stopWords && config.stopWords.length > 0) {
    processedQuery = filterStopWords(query, config.stopWords);
  }

  // Early return if processed query is empty after filtering
  if (!processedQuery || processedQuery.trim().length === 0) {
    return [];
  }

  // CACHE: Check cache first (use processed query for cache key)
  if (index._cache) {
    const cached = index._cache.get(processedQuery, limit, options);
    if (cached) {
      return cached; // Cache hit - return immediately!
    }
  }

  // Get active language processors
  const activeLanguages = options.languages || config.languages;
  const processors = activeLanguages.map((lang) => index.languageProcessors.get(lang)).filter((p): p is LanguageProcessor => p !== undefined);

  if (processors.length === 0) {
    return [];
  }

  // AUTO-DETECTION: Use inverted index if available
  if (index.invertedIndex && index.documents) {
    const results = getSuggestionsInverted(index, processedQuery, limit, threshold, processors, options);
    // Cache the results
    if (index._cache) {
      index._cache.set(processedQuery, results, limit, options);
    }
    return results;
  }

  // CLASSIC: Use hash-based approach (existing implementation)
  const matches = new Map<string, SearchMatch>();

  // Process query with each language processor
  for (const processor of processors) {
    const normalizedQuery = processor.normalize(processedQuery.trim());

    // Find matches using different strategies
    findExactMatches(normalizedQuery, index, matches, processor.language);
    findPrefixMatches(normalizedQuery, index, matches, processor.language);
    findPhoneticMatches(normalizedQuery, processor, index, matches);
    findSynonymMatches(normalizedQuery, index, matches);
    findNgramMatches(normalizedQuery, index, matches, processor.language, config.ngramSize);

    if (config.features.includes("missing-letters") || config.features.includes("extra-letters") || config.features.includes("transpositions")) {
      findFuzzyMatches(normalizedQuery, index, matches, processor, config);
    }
  }

  // Convert matches to results and rank them
  let results = Array.from(matches.values())
    .map((match) => createSuggestionResult(match, processedQuery, threshold, index, options))
    .filter((result): result is SuggestionResult => result !== null);

  // Apply filters if provided
  if (options.filters) {
    results = applyFilters(results, options.filters);
  }

  // Apply custom sorting if provided
  if (options.sort) {
    results = applySorting(results, options.sort);
  } else {
    // Default: sort by relevance
    results = results.sort((a, b) => b.score - a.score);
  }

  // Limit results
  results = results.slice(0, limit);

  // Cache the results
  if (index._cache) {
    index._cache.set(processedQuery, results, limit, options);
  }

  return results;
}

/**
 * Find exact matches
 */
function findExactMatches(query: string, index: FuzzyIndex, matches: Map<string, SearchMatch>, language: string): void {
  const wordBoundaries = index.config.wordBoundaries || false;

  // Check for wildcard pattern
  if (query.includes("*")) {
    // Wildcard search
    for (const baseWord of index.base) {
      if (matchesWildcard(baseWord, query)) {
        if (!matches.has(baseWord)) {
          matches.set(baseWord, {
            word: baseWord,
            normalized: query,
            matchType: "exact",
            editDistance: 0,
            language,
          });
        }
      }
    }
    return;
  }

  // Check for exact matches in the variant map (normalize to lowercase)
  const exactMatches = index.variantToBase.get(query.toLowerCase());
  if (exactMatches) {
    exactMatches.forEach((word) => {
      // With word boundaries, verify the match
      if (wordBoundaries && !matchesWord(word, query, wordBoundaries)) {
        return;
      }

      // Always add exact matches, even if already found with lower score
      const existing = matches.get(word);
      if (!existing || existing.matchType !== "exact") {
        matches.set(word, {
          word,
          normalized: query,
          matchType: "exact",
          editDistance: 0,
          language,
        });
      }
    });
  }

  // Also check if the query exactly matches any base word (case-insensitive)
  const queryLower = query.toLowerCase();
  for (const baseWord of index.base) {
    if (baseWord.toLowerCase() === queryLower) {
      if (!matches.has(baseWord)) {
        matches.set(baseWord, {
          word: baseWord,
          normalized: query,
          matchType: "exact",
          editDistance: 0,
          language,
        });
      }
    }
  }
}

/**
 * Find prefix matches
 */
function findPrefixMatches(query: string, index: FuzzyIndex, matches: Map<string, SearchMatch>, language: string): void {
  const wordBoundaries = index.config.wordBoundaries || false;
  const queryLower = query.toLowerCase();

  for (const [variant, words] of index.variantToBase.entries()) {
    if (variant.startsWith(queryLower) && variant !== queryLower) {
      words.forEach((word) => {
        // With word boundaries, verify the match
        if (wordBoundaries && !matchesWord(word, query, wordBoundaries)) {
          return;
        }

        if (!matches.has(word)) {
          matches.set(word, {
            word,
            normalized: variant,
            matchType: "prefix",
            language,
          });
        }
      });
    }
  }
}

/**
 * Find phonetic matches
 */
function findPhoneticMatches(query: string, processor: LanguageProcessor, index: FuzzyIndex, matches: Map<string, SearchMatch>): void {
  if (!processor.supportedFeatures.includes("phonetic")) return;

  const phoneticCode = processor.getPhoneticCode(query);
  if (phoneticCode) {
    const phoneticMatches = index.phoneticToBase.get(phoneticCode);
    if (phoneticMatches) {
      phoneticMatches.forEach((word) => {
        if (!matches.has(word)) {
          matches.set(word, {
            word,
            normalized: query,
            matchType: "phonetic",
            phoneticCode,
            language: processor.language,
          });
        }
      });
    }
  }
}

/**
 * Find synonym matches
 */
function findSynonymMatches(query: string, index: FuzzyIndex, matches: Map<string, SearchMatch>): void {
  const synonymMatches = index.synonymMap.get(query.toLowerCase());
  if (synonymMatches) {
    synonymMatches.forEach((word) => {
      if (!matches.has(word)) {
        matches.set(word, {
          word,
          normalized: query,
          matchType: "synonym",
          language: "synonym",
        });
      }
    });
  }
}

/**
 * Find n-gram matches
 */
function findNgramMatches(query: string, index: FuzzyIndex, matches: Map<string, SearchMatch>, language: string, ngramSize: number): void {
  if (query.length < ngramSize) return;

  const queryNgrams = generateNgrams(query, ngramSize);
  const candidateWords = new Set<string>();

  queryNgrams.forEach((ngram) => {
    const ngramMatches = index.ngramIndex.get(ngram);
    if (ngramMatches) {
      ngramMatches.forEach((word) => candidateWords.add(word));
    }
  });

  candidateWords.forEach((word) => {
    if (!matches.has(word)) {
      matches.set(word, {
        word,
        normalized: query,
        matchType: "ngram",
        language,
      });
    }
  });
}

/**
 * Find fuzzy matches using edit distance
 */
function findFuzzyMatches(query: string, index: FuzzyIndex, matches: Map<string, SearchMatch>, processor: LanguageProcessor, config: FuzzyConfig): void {
  const maxDistance = config.maxEditDistance;

  for (const [variant, words] of index.variantToBase.entries()) {
    if (Math.abs(variant.length - query.length) <= maxDistance) {
      // Use Damerau-Levenshtein if transpositions feature is enabled
      const useTranspositions = index.config.features?.includes("transpositions");
      const distance = useTranspositions ? calculateDamerauLevenshteinDistance(query, variant, maxDistance) : calculateLevenshteinDistance(query, variant, maxDistance);

      if (distance <= maxDistance) {
        words.forEach((word) => {
          const existingMatch = matches.get(word);
          // Don't replace exact or prefix matches with fuzzy matches
          if (!existingMatch || (existingMatch.matchType !== "exact" && existingMatch.matchType !== "prefix" && (existingMatch.editDistance || Infinity) > distance)) {
            matches.set(word, {
              word,
              normalized: variant,
              matchType: "fuzzy",
              editDistance: distance,
              language: processor.language,
            });
          }
        });
      }
    }
  }
}

/**
 * Create a suggestion result from a search match
 */
function createSuggestionResult(match: SearchMatch, originalQuery: string, threshold: number, index: FuzzyIndex, options?: SearchOptions): SuggestionResult | null {
  let score = calculateMatchScore(match, originalQuery, index.config);

  // Combine with BM25 score if available
  if (match.bm25Score !== undefined && index.config.useBM25) {
    const bm25Weight = index.config.bm25Weight || 0.6;
    const fuzzyWeight = 1 - bm25Weight;
    score = bm25Weight * match.bm25Score + fuzzyWeight * score;
  }

  // Apply field weight if present
  if (match.fieldWeight) {
    score = Math.min(1.0, score * match.fieldWeight);
  }

  if (score < threshold) {
    return null;
  }

  const result: SuggestionResult = {
    display: match.word,
    baseWord: match.word,
    isSynonym: match.matchType === "synonym",
    score,
    language: match.language,
    // @ts-ignore - temporary debug property
    _debug_matchType: match.matchType,
  };

  // Add field information if this is a multi-field search
  if (index.fieldData && index.fieldData.has(match.word)) {
    result.fields = index.fieldData.get(match.word);
    result.field = match.field;
  }

  // Add highlights if requested
  if (options?.includeHighlights) {
    result.highlights = calculateHighlights(match, originalQuery, match.word);
  }

  return result;
}

/**
 * Calculate match score (0-1, higher is better)
 */
function calculateMatchScore(
  //
  match: SearchMatch,
  query: string,
  config?: FuzzyConfig
): number {
  const queryLen = query.length;
  const wordLen = match.word.length;
  const maxLen = Math.max(queryLen, wordLen);

  let score = 0.5; // Base score

  switch (match.matchType) {
    case "exact":
      score = 1.0;
      break;
    case "prefix":
      score = 0.9 - (wordLen - queryLen) / (maxLen * 2);
      break;
    case "substring":
      score = 0.8;
      break;
    case "phonetic":
      score = 0.7;
      break;
    case "fuzzy":
      if (match.editDistance !== undefined) {
        // Use segment-aware scoring for alphanumeric strings if enabled
        if (config?.enableAlphanumericSegmentation && isAlphanumeric(query) && isAlphanumeric(match.word)) {
          score = calculateAlphanumericScore(query, match.word, config);
        } else {
          score = Math.max(0.3, 1.0 - match.editDistance / maxLen);
        }
      }
      break;
    case "synonym":
      score = 0.6;
      break;
    case "compound":
      score = 0.75;
      break;
    case "ngram":
      score = calculateNgramSimilarity(query.toLowerCase(), match.normalized, 3) * 0.8;
      break;
  }

  // Boost score for shorter words (more likely to be what user wants)
  // But don't boost exact matches - they should stay at 1.0
  if (wordLen <= queryLen + 2 && match.matchType !== "exact") {
    score += 0.1;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Calculate score for alphanumeric strings using segment-aware matching
 * Prioritizes alphabetic accuracy over numeric accuracy
 */
function calculateAlphanumericScore(
  query: string,
  target: string,
  config: FuzzyConfig
): number {
  // Extract alphabetic and numeric parts
  const queryAlpha = extractAlphaPart(query).toLowerCase();
  const targetAlpha = extractAlphaPart(target).toLowerCase();
  const queryNumeric = extractNumericPart(query);
  const targetNumeric = extractNumericPart(target);

  const alphaWeight = config.alphanumericAlphaWeight || 0.7;
  const numericWeight = config.alphanumericNumericWeight || 0.3;

  let alphaScore = 0;
  let numericScore = 0;

  // Calculate alphabetic score
  if (queryAlpha.length > 0 && targetAlpha.length > 0) {
    const alphaMaxLen = Math.max(queryAlpha.length, targetAlpha.length);
    const alphaDistance = calculateLevenshteinDistance(queryAlpha, targetAlpha, config.maxEditDistance);
    alphaScore = Math.max(0, 1.0 - alphaDistance / alphaMaxLen);
  } else if (queryAlpha.length === 0 && targetAlpha.length === 0) {
    alphaScore = 1.0; // Both have no alpha parts
  }

  // Calculate numeric score (more lenient)
  if (queryNumeric.length > 0 && targetNumeric.length > 0) {
    if (queryNumeric === targetNumeric) {
      numericScore = 1.0;
    } else {
      // Check if one contains the other
      if (targetNumeric.includes(queryNumeric) || queryNumeric.includes(targetNumeric)) {
        const shorter = queryNumeric.length < targetNumeric.length ? queryNumeric : targetNumeric;
        const longer = queryNumeric.length < targetNumeric.length ? targetNumeric : queryNumeric;
        numericScore = shorter.length / longer.length;
      } else {
        // Use edit distance with multiplier (more lenient for numbers)
        const numericMaxLen = Math.max(queryNumeric.length, targetNumeric.length);
        const multiplier = config.alphanumericNumericEditDistanceMultiplier || 1.5;
        const numericDistance = calculateLevenshteinDistance(queryNumeric, targetNumeric, Math.ceil(config.maxEditDistance * multiplier));
        numericScore = Math.max(0, 1.0 - numericDistance / numericMaxLen);
      }
    }
  } else if (queryNumeric.length === 0 && targetNumeric.length === 0) {
    numericScore = 1.0; // Both have no numeric parts
  } else {
    // One has numbers, one doesn't - partial penalty
    numericScore = 0.3;
  }

  // Weighted combination
  const combinedScore = alphaScore * alphaWeight + numericScore * numericWeight;

  // Ensure minimum score of 0.3 for fuzzy matches
  return Math.max(0.3, combinedScore);
}

/**
 * Generate n-grams from a string
 */
function generateNgrams(
  //
  str: string,
  n: number
): string[] {
  if (str.length < n) return [str];

  const ngrams: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Get suggestions using inverted index (for large datasets)
 * This is a wrapper that converts inverted index results to the same format
 */
function getSuggestionsInverted(
  //
  index: FuzzyIndex,
  query: string,
  limit: number,
  threshold: number,
  processors: LanguageProcessor[],
  options?: SearchOptions
): SuggestionResult[] {
  if (!index.invertedIndex || !index.documents) {
    throw new Error("Inverted index not available");
  }

  // Use inverted index search
  let matches = searchInvertedIndex(index.invertedIndex, index.documents, query, processors, index.config);

  // Calculate BM25 scores if enabled
  if (index.config.useBM25) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    matches = calculateBM25Scores(matches, queryTerms, index.invertedIndex, index.documents, index.config);
  }

  // Convert to suggestion results (same as classic approach)
  let results = matches
    .map((match) => createSuggestionResult(match, query, threshold, index, options))
    .filter((result): result is SuggestionResult => result !== null);

  // Apply filters if provided
  if (options?.filters) {
    results = applyFilters(results, options.filters);
  }

  // Apply custom sorting if provided
  if (options?.sort) {
    results = applySorting(results, options.sort);
  } else {
    // Default: sort by relevance
    results = results.sort((a, b) => b.score - a.score);
  }

  // Limit results
  results = results.slice(0, limit);

  return results;
}

/**
 * Search with phrase support
 * Handles queries containing quoted phrases
 */
function searchWithPhrases(
  index: FuzzyIndex,
  parsedQuery: ReturnType<typeof parseQuery>,
  limit: number,
  threshold: number,
  options: SearchOptions
): SuggestionResult[] {
  const config = index.config;
  const useTranspositions = config.features.includes('transpositions');
  
  // Get phrase match options
  const phraseOptions = {
    exactMatch: false,
    maxEditDistance: 1,
    proximityBonus: 1.5,
    maxProximityDistance: 3,
    useTranspositions,
  };

  // Search all base words for phrase matches
  const phraseMatches = new Map<string, { score: number; phraseCount: number }>();

  // For each phrase, find matching words
  for (const phrase of parsedQuery.phrases) {
    for (const word of index.base) {
      const match = matchPhrase(word, phrase, phraseOptions);
      
      if (match.matched) {
        const existing = phraseMatches.get(word);
        const newScore = match.score * phraseOptions.proximityBonus;
        
        if (existing) {
          // Multiple phrases matched - boost even more
          phraseMatches.set(word, {
            score: Math.max(existing.score, newScore),
            phraseCount: existing.phraseCount + 1,
          });
        } else {
          phraseMatches.set(word, { score: newScore, phraseCount: 1 });
        }
      }
    }
  }

  // If we have regular terms too, search for them
  let termMatches = new Map<string, SearchMatch>();
  
  if (parsedQuery.terms.length > 0) {
    const termQuery = parsedQuery.terms.join(' ');
    const processors = config.languages
      .map((lang) => index.languageProcessors.get(lang))
      .filter((p): p is LanguageProcessor => p !== undefined);

    for (const processor of processors) {
      const normalizedQuery = processor.normalize(termQuery);
      
      // Use existing search strategies for terms
      findExactMatches(normalizedQuery, index, termMatches, processor.language);
      findPrefixMatches(normalizedQuery, index, termMatches, processor.language);
      findPhoneticMatches(normalizedQuery, processor, index, termMatches);
      findNgramMatches(normalizedQuery, index, termMatches, processor.language, config.ngramSize);
      
      if (config.features.includes("missing-letters") || config.features.includes("extra-letters") || config.features.includes("transpositions")) {
        findFuzzyMatches(normalizedQuery, index, termMatches, processor, config);
      }
    }
  }

  // Combine phrase and term matches
  const combinedResults = new Map<string, SuggestionResult>();

  // Add phrase matches
  for (const [word, phraseData] of phraseMatches.entries()) {
    const result: SuggestionResult = {
      display: word,
      baseWord: word,
      isSynonym: false,
      score: phraseData.score,
    };
    
    // If word also matched terms, boost score even more
    const termMatch = termMatches.get(word);
    if (termMatch) {
      result.score = Math.min(1.0, result.score * 1.2);
    }
    
    combinedResults.set(word, result);
  }

  // Add term matches that didn't match phrases (with lower priority)
  for (const [word, match] of termMatches.entries()) {
    if (!combinedResults.has(word)) {
      const result = createSuggestionResult(match, parsedQuery.terms.join(' '), threshold, index, options);
      if (result) {
        // Reduce score slightly since it didn't match the phrase
        result.score *= 0.8;
        combinedResults.set(word, result);
      }
    }
  }

  // Sort and limit results
  const results = Array.from(combinedResults.values())
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Cache the results
  if (index._cache) {
    index._cache.set(parsedQuery.original, results, limit, options);
  }

  return results;
}

/**
 * Update an existing index by adding new items
 * Much faster than rebuilding the entire index
 * 
 * @param index - Existing fuzzy index to update
 * @param newItems - New items to add (strings or objects)
 * @param options - Optional configuration (uses index's existing config by default)
 * @returns Updated index (mutates the original)
 * 
 * @example
 * const index = buildFuzzyIndex(['apple', 'banana']);
 * updateIndex(index, ['cherry', 'date']);
 * // Index now contains: apple, banana, cherry, date
 */
export function updateIndex(
  index: FuzzyIndex,
  newItems: (string | any)[] = [],
  options: Partial<BuildIndexOptions> = {}
): FuzzyIndex {
  if (!index || !index.config) {
    throw new Error('Invalid index provided');
  }

  if (!newItems || newItems.length === 0) {
    return index;
  }

  // Use existing index configuration
  const config = index.config;
  const featureSet = new Set(config.features);
  
  // Get language processors from index
  const languageProcessors = Array.from(index.languageProcessors.values());
  
  if (languageProcessors.length === 0) {
    throw new Error('No language processors found in index');
  }

  // Check if we're doing multi-field search
  const hasFields = index.fields && index.fields.length > 0;
  const isObjectArray = newItems.length > 0 && typeof newItems[0] === 'object' && newItems[0] !== null;

  // Validate: if objects are provided, fields must be specified
  if (isObjectArray && !hasFields) {
    throw new Error('Index was not built with fields, cannot add objects');
  }

  // Track existing words to avoid duplicates
  const existingWords = new Set(index.base.map(w => w.toLowerCase()));
  let processed = 0;

  for (const item of newItems) {
    if (!item) continue;

    // Handle multi-field objects
    if (hasFields && isObjectArray) {
      const fieldValues = extractFieldValues(item, index.fields);
      if (!fieldValues) continue;

      // Generate a unique ID for this object
      const baseId = Object.values(fieldValues)[0] || `item_${index.base.length + processed}`;

      // Skip if already exists
      if (existingWords.has(baseId.toLowerCase())) continue;

      // Store field data
      if (index.fieldData) {
        index.fieldData.set(baseId, fieldValues);
      }

      // Add to base
      existingWords.add(baseId.toLowerCase());
      index.base.push(baseId);

      // Index each field separately
      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
        if (!fieldValue || fieldValue.trim().length < config.minQueryLength) continue;

        const trimmedValue = fieldValue.trim();

        // Process this field value with each language processor
        for (const processor of languageProcessors) {
          processWordWithProcessorAndField(trimmedValue, baseId, fieldName, processor, index, config, featureSet);
        }
      }
    } else {
      // Handle simple string array
      const word = typeof item === 'string' ? item : String(item);
      if (word.trim().length < config.minQueryLength) continue;

      const trimmedWord = word.trim();
      
      // Skip if already exists
      if (existingWords.has(trimmedWord.toLowerCase())) continue;

      existingWords.add(trimmedWord.toLowerCase());
      index.base.push(trimmedWord);

      // Process with each language processor
      for (const processor of languageProcessors) {
        processWordWithProcessor(trimmedWord, processor, index, config, featureSet);
      }
    }

    processed++;
    if (options.onProgress) {
      options.onProgress(processed, newItems.length);
    }
  }

  // Update inverted index if it exists
  if (index.invertedIndex && index.documents) {
    const { invertedIndex, documents } = buildInvertedIndex(
      index.base,
      languageProcessors,
      config,
      featureSet
    );
    index.invertedIndex = invertedIndex;
    index.documents = documents;
  }

  // Clear cache since index has changed
  if (index._cache) {
    index._cache.clear();
  }

  return index;
}

/**
 * Remove items from an existing index
 * 
 * @param index - Existing fuzzy index to update
 * @param itemsToRemove - Items to remove (exact matches)
 * @returns Updated index (mutates the original)
 * 
 * @example
 * const index = buildFuzzyIndex(['apple', 'banana', 'cherry']);
 * removeFromIndex(index, ['banana']);
 * // Index now contains: apple, cherry
 */
export function removeFromIndex(
  index: FuzzyIndex,
  itemsToRemove: string[] = []
): FuzzyIndex {
  if (!index || !index.config) {
    throw new Error('Invalid index provided');
  }

  if (!itemsToRemove || itemsToRemove.length === 0) {
    return index;
  }

  // Create set of items to remove (case-insensitive)
  const toRemove = new Set(itemsToRemove.map(item => item.toLowerCase()));

  // Remove from base array
  index.base = index.base.filter(word => !toRemove.has(word.toLowerCase()));

  // Remove from variant maps
  for (const [variant, baseWords] of index.variantToBase.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word: string) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.variantToBase.delete(variant);
    } else {
      index.variantToBase.set(variant, filtered);
    }
  }

  // Remove from phonetic map
  for (const [phonetic, baseWords] of index.phoneticToBase.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word: string) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.phoneticToBase.delete(phonetic);
    } else {
      index.phoneticToBase.set(phonetic, filtered);
    }
  }

  // Remove from ngram index
  for (const [ngram, baseWords] of index.ngramIndex.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word: string) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.ngramIndex.delete(ngram);
    } else {
      index.ngramIndex.set(ngram, filtered);
    }
  }

  // Remove from synonym map
  for (const [synonym, baseWords] of index.synonymMap.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word: string) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.synonymMap.delete(synonym);
    } else {
      index.synonymMap.set(synonym, filtered);
    }
  }

  // Remove from field data if exists
  if (index.fieldData) {
    for (const item of itemsToRemove) {
      index.fieldData.delete(item);
    }
  }

  // Rebuild inverted index if it exists
  if (index.invertedIndex && index.documents) {
    const config = index.config;
    const featureSet = new Set(config.features);
    const languageProcessors = Array.from(index.languageProcessors.values());
    
    const { invertedIndex, documents } = buildInvertedIndex(
      index.base,
      languageProcessors,
      config,
      featureSet
    );
    index.invertedIndex = invertedIndex;
    index.documents = documents;
  }

  // Clear cache since index has changed
  if (index._cache) {
    index._cache.clear();
  }

  return index;
}
