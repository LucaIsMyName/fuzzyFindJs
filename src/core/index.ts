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
  calculateNgramSimilarity,
} from "../algorithms/levenshtein.js";
import {
  //
  buildInvertedIndex,
  searchInvertedIndex,
} from "./inverted-index.js";

/**
 * Build a fuzzy search index from a dictionary of words
 */
export function buildFuzzyIndex(words: string[] = [], options: BuildIndexOptions = {}): FuzzyIndex {
  const config = mergeConfig(options.config);
  validateConfig(config);

  // Convert features array to Set for O(1) lookup performance
  const featureSet = new Set(config.features);

  const languageProcessors = options.languageProcessors || LanguageRegistry.getProcessors(config.languages);

  if (languageProcessors.length === 0) {
    throw new Error(`No language processors found for: ${config.languages.join(", ")}`);
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

  // Store language processors
  languageProcessors.forEach((processor) => {
    index.languageProcessors.set(processor.language, processor);
  });

  const processedWords = new Set<string>();
  let processed = 0;

  for (const word of words) {
    if (!word || word.trim().length < config.minQueryLength) continue;

    const trimmedWord = word.trim();
    if (processedWords.has(trimmedWord.toLowerCase())) continue;

    processedWords.add(trimmedWord.toLowerCase());
    index.base.push(trimmedWord);

    // Process with each language processor
    for (const processor of languageProcessors) {
      processWordWithProcessor(trimmedWord, processor, index, config, featureSet);
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
 * Helper function to add mappings to variant maps
 */
function addToVariantMap(map: Map<string, Set<string>>, key: string, value: string): void {
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key)!.add(value);
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

  // Get active language processors
  const activeLanguages = options.languages || config.languages;
  const processors = activeLanguages.map((lang) => index.languageProcessors.get(lang)).filter((p): p is LanguageProcessor => p !== undefined);

  if (processors.length === 0) {
    return [];
  }

  // AUTO-DETECTION: Use inverted index if available
  if (index.invertedIndex && index.documents) {
    return getSuggestionsInverted(index, query, limit, threshold, processors);
  }

  // CLASSIC: Use hash-based approach (existing implementation)
  const matches = new Map<string, SearchMatch>();

  // Process query with each language processor
  for (const processor of processors) {
    const normalizedQuery = processor.normalize(query.trim());

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
    .map((match) => createSuggestionResult(match, query, threshold))
    .filter((result): result is SuggestionResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

/**
 * Find exact matches
 */
function findExactMatches(query: string, index: FuzzyIndex, matches: Map<string, SearchMatch>, language: string): void {
  // Check for exact matches in the variant map
  const exactMatches = index.variantToBase.get(query);
  if (exactMatches) {
    exactMatches.forEach((word) => {
      if (!matches.has(word)) {
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
  for (const [variant, words] of index.variantToBase.entries()) {
    if (variant.startsWith(query) && variant !== query) {
      words.forEach((word) => {
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
          if (!existingMatch || (existingMatch.editDistance || Infinity) > distance) {
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
function createSuggestionResult(match: SearchMatch, originalQuery: string, threshold: number): SuggestionResult | null {
  const score = calculateMatchScore(match, originalQuery);

  if (score < threshold) {
    return null;
  }

  return {
    display: match.word,
    baseWord: match.word,
    isSynonym: match.matchType === "synonym",
    score,
    language: match.language,
    // @ts-ignore - temporary debug property
    _debug_matchType: match.matchType,
  };
}

/**
 * Calculate match score (0-1, higher is better)
 */
function calculateMatchScore(match: SearchMatch, query: string): number {
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
function generateNgrams(str: string, n: number): string[] {
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
function getSuggestionsInverted(index: FuzzyIndex, query: string, limit: number, threshold: number, processors: LanguageProcessor[]): SuggestionResult[] {
  if (!index.invertedIndex || !index.documents) {
    throw new Error("Inverted index not available");
  }

  // Use inverted index search
  const matches = searchInvertedIndex(index.invertedIndex, index.documents, query, processors, index.config);

  // Convert to suggestion results (same as classic approach)
  const results = matches
    .map((match) => createSuggestionResult(match, query, threshold))
    .filter((result): result is SuggestionResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}
