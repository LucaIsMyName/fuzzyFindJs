import type { FuzzyIndex, FuzzyConfig, SuggestionResult, SearchMatch, BuildIndexOptions, SearchOptions, LanguageProcessor } from "./types.js";
import { mergeConfig, validateConfig } from "./config.js";
import { LanguageRegistry } from "../languages/index.js";
import { calculateLevenshteinDistance, calculateNgramSimilarity } from "../algorithms/levenshtein.js";
import { buildInvertedIndex, searchInvertedIndex } from "./inverted-index.js";
import { calculateHighlights } from "./highlighting.js";
import { SearchCache } from "./cache.js";
import { removeAccents } from "../utils/accent-normalization.js";
import { extractFieldValues, normalizeFieldWeights } from "./field-weighting.js";
import { filterStopWords } from "../utils/stop-words.js";
import { matchesWord, matchesWildcard } from "../utils/word-boundaries.js";

/**
 * Build a fuzzy search index from a dictionary of words or objects
 */
export function buildFuzzyIndex(words: (string | any)[] = [], options: BuildIndexOptions = {}): FuzzyIndex {
  const config = mergeConfig(options.config);
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

  const processedWords = new Set<string>();
  let processed = 0;

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

  // INVERTED INDEX: Build if enabled or auto-enable for large datasets
  const shouldUseInvertedIndex = options.useInvertedIndex || config.useInvertedIndex || words.length >= 10000; // Auto-enable for 10k+ words

  if (shouldUseInvertedIndex) {
    const { invertedIndex, documents } = buildInvertedIndex(words, languageProcessors, config, featureSet);
    index.invertedIndex = invertedIndex;
    index.documents = documents;
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

  // Add base word mapping
  addToVariantMap(index.variantToBase, normalized, word);
  addToVariantMap(index.variantToBase, word.toLowerCase(), word);
  // Also add the original word as-is for exact matching
  addToVariantMap(index.variantToBase, word, word);

  // Add accent-insensitive variants
  const accentFreeWord = removeAccents(word);
  if (accentFreeWord !== word) {
    // Add the accent-free version in multiple forms
    addToVariantMap(index.variantToBase, accentFreeWord, word); // Original case
    addToVariantMap(index.variantToBase, accentFreeWord.toLowerCase(), word); // Lowercase
    const normalizedAccentFree = processor.normalize(accentFreeWord);
    if (normalizedAccentFree !== accentFreeWord.toLowerCase()) {
      addToVariantMap(index.variantToBase, normalizedAccentFree, word); // Processor normalized
    }
  }

  // Generate and index variants
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(word);
    variants.forEach((variant) => {
      addToVariantMap(index.variantToBase, variant, word);
    });
  }

  // Generate phonetic codes
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(word);
    if (phoneticCode) {
      addToVariantMap(index.phoneticToBase, phoneticCode, word);
    }
  }

  // Generate n-grams for partial matching
  const ngrams = generateNgrams(normalized, config.ngramSize);
  ngrams.forEach((ngram: string) => {
    addToVariantMap(index.ngramIndex, ngram, word);
  });

  // Handle compound words
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const compoundParts = processor.splitCompoundWords(word);
    compoundParts.forEach((part) => {
      if (part !== word) {
        addToVariantMap(index.variantToBase, processor.normalize(part), word);
      }
    });
  }

  // Add synonyms
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMap(index.synonymMap, synonym, word);
    });

    // Add custom synonyms
    if (config.customSynonyms) {
      const customSynonyms = config.customSynonyms[normalized];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMap(index.synonymMap, synonym, word);
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

  // Add base word mapping with field metadata
  addToVariantMapWithField(index.variantToBase, normalized, baseId, fieldName);
  addToVariantMapWithField(index.variantToBase, fieldValue.toLowerCase(), baseId, fieldName);
  addToVariantMapWithField(index.variantToBase, fieldValue, baseId, fieldName);

  // Add accent-insensitive variants
  const accentFreeWord = removeAccents(fieldValue);
  if (accentFreeWord !== fieldValue) {
    addToVariantMapWithField(index.variantToBase, accentFreeWord, baseId, fieldName);
    addToVariantMapWithField(index.variantToBase, accentFreeWord.toLowerCase(), baseId, fieldName);
    const normalizedAccentFree = processor.normalize(accentFreeWord);
    if (normalizedAccentFree !== accentFreeWord.toLowerCase()) {
      addToVariantMapWithField(index.variantToBase, normalizedAccentFree, baseId, fieldName);
    }
  }

  // Generate and index variants
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(fieldValue);
    variants.forEach((variant) => {
      addToVariantMapWithField(index.variantToBase, variant, baseId, fieldName);
    });
  }

  // Generate phonetic codes
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(fieldValue);
    if (phoneticCode) {
      addToVariantMapWithField(index.phoneticToBase, phoneticCode, baseId, fieldName);
    }
  }

  // Generate n-grams for partial matching
  const ngrams = generateNgrams(normalized, config.ngramSize);
  ngrams.forEach((ngram: string) => {
    addToVariantMapWithField(index.ngramIndex, ngram, baseId, fieldName);
  });

  // Handle compound words
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const parts = processor.splitCompoundWords(fieldValue);
    parts.forEach((part) => {
      if (part.length >= config.minQueryLength) {
        addToVariantMapWithField(index.variantToBase, part, baseId, fieldName);
        addToVariantMapWithField(index.variantToBase, processor.normalize(part), baseId, fieldName);
      }
    });
  }

  // Add synonyms
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMapWithField(index.synonymMap, synonym, baseId, fieldName);
    });

    // Add custom synonyms
    if (config.customSynonyms) {
      const customSynonyms = config.customSynonyms[normalized];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMapWithField(index.synonymMap, synonym, baseId, fieldName);
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
 * Batch search multiple queries at once
 * Deduplicates identical queries and returns results for all
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
 * Get fuzzy search suggestions from an index
 * Auto-detects whether to use inverted index or classic hash-based approach
 */
export function getSuggestions(index: FuzzyIndex, query: string, maxResults?: number, options: SearchOptions = {}): SuggestionResult[] {
  const config = index.config;
  const limit = maxResults || options.maxResults || config.maxResults;
  const threshold = options.fuzzyThreshold || config.fuzzyThreshold;

  if (!query || query.trim().length < config.minQueryLength) {
    return [];
  }

  // STOP WORDS: Filter stop words from query if enabled
  let processedQuery = query;
  if (config.enableStopWords && config.stopWords && config.stopWords.length > 0) {
    processedQuery = filterStopWords(query, config.stopWords);
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
  const results = Array.from(matches.values())
    .map((match) => createSuggestionResult(match, processedQuery, threshold, index, options))
    .filter((result): result is SuggestionResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

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
  if (query.includes('*')) {
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
  
  // Check for exact matches in the variant map
  const exactMatches = index.variantToBase.get(query);
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
  
  for (const [variant, words] of index.variantToBase.entries()) {
    if (variant.startsWith(query) && variant !== query) {
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
  const synonymMatches = index.synonymMap.get(query);
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
      const distance = calculateLevenshteinDistance(query, variant, maxDistance);

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
  let score = calculateMatchScore(match, originalQuery);

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
  query: string
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
        score = Math.max(0.3, 1.0 - match.editDistance / maxLen);
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
  const matches = searchInvertedIndex(index.invertedIndex, index.documents, query, processors, index.config);

  // Convert to suggestion results (same as classic approach)
  const results = matches
    .map((match) => createSuggestionResult(match, query, threshold, index, options))
    .filter((result): result is SuggestionResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}
