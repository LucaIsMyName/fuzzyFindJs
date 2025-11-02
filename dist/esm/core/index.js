import { mergeConfig, validateConfig } from "./config.js";
import { LanguageRegistry } from "../languages/index.js";
import { calculateLevenshteinDistance, calculateNgramSimilarity } from "../algorithms/levenshtein.js";
import { buildInvertedIndex, searchInvertedIndex } from "./inverted-index.js";
import { calculateHighlights } from "./highlighting.js";
import { SearchCache } from "./cache.js";
import { removeAccents } from "../utils/accent-normalization.js";
import { normalizeFieldWeights, extractFieldValues } from "./field-weighting.js";
import { filterStopWords } from "../utils/stop-words.js";
import { matchesWildcard, matchesWord } from "../utils/word-boundaries.js";
function buildFuzzyIndex(words = [], options = {}) {
  const config = mergeConfig(options.config);
  validateConfig(config);
  const featureSet = new Set(config.features);
  const languageProcessors = options.languageProcessors || LanguageRegistry.getProcessors(config.languages);
  if (languageProcessors.length === 0) {
    throw new Error(`No language processors found for: ${config.languages.join(", ")}`);
  }
  const hasFields = options.fields && options.fields.length > 0;
  const isObjectArray = words.length > 0 && typeof words[0] === "object" && words[0] !== null;
  if (isObjectArray && !hasFields) {
    throw new Error("When indexing objects, you must specify which fields to index via options.fields");
  }
  const index = {
    base: [],
    variantToBase: /* @__PURE__ */ new Map(),
    phoneticToBase: /* @__PURE__ */ new Map(),
    ngramIndex: /* @__PURE__ */ new Map(),
    synonymMap: /* @__PURE__ */ new Map(),
    languageProcessors: /* @__PURE__ */ new Map(),
    config
  };
  if (hasFields) {
    index.fields = options.fields;
    index.fieldWeights = normalizeFieldWeights(options.fields, options.fieldWeights);
    index.fieldData = /* @__PURE__ */ new Map();
  }
  languageProcessors.forEach((processor) => {
    index.languageProcessors.set(processor.language, processor);
  });
  const processedWords = /* @__PURE__ */ new Set();
  let processed = 0;
  for (const item of words) {
    if (!item) continue;
    if (hasFields && isObjectArray) {
      const fieldValues = extractFieldValues(item, options.fields);
      if (!fieldValues) continue;
      const baseId = Object.values(fieldValues)[0] || `item_${processed}`;
      index.fieldData.set(baseId, fieldValues);
      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
        if (!fieldValue || fieldValue.trim().length < config.minQueryLength) continue;
        const trimmedValue = fieldValue.trim();
        if (!processedWords.has(baseId.toLowerCase())) {
          processedWords.add(baseId.toLowerCase());
          index.base.push(baseId);
        }
        for (const processor of languageProcessors) {
          processWordWithProcessorAndField(trimmedValue, baseId, fieldName, processor, index, config, featureSet);
        }
      }
    } else {
      const word = typeof item === "string" ? item : String(item);
      if (word.trim().length < config.minQueryLength) continue;
      const trimmedWord = word.trim();
      if (processedWords.has(trimmedWord.toLowerCase())) continue;
      processedWords.add(trimmedWord.toLowerCase());
      index.base.push(trimmedWord);
      for (const processor of languageProcessors) {
        processWordWithProcessor(trimmedWord, processor, index, config, featureSet);
      }
    }
    processed++;
    if (options.onProgress) {
      options.onProgress(processed, words.length);
    }
  }
  const shouldUseInvertedIndex = options.useInvertedIndex || config.useInvertedIndex || words.length >= 1e4;
  if (shouldUseInvertedIndex) {
    const { invertedIndex, documents } = buildInvertedIndex(words, languageProcessors, config, featureSet);
    index.invertedIndex = invertedIndex;
    index.documents = documents;
  }
  const enableCache = config.enableCache !== false;
  if (enableCache) {
    const cacheSize = config.cacheSize || 100;
    index._cache = new SearchCache(cacheSize);
  }
  return index;
}
function processWordWithProcessor(word, processor, index, config, featureSet) {
  const normalized = processor.normalize(word);
  addToVariantMap(index.variantToBase, normalized, word);
  addToVariantMap(index.variantToBase, word.toLowerCase(), word);
  addToVariantMap(index.variantToBase, word, word);
  const accentFreeWord = removeAccents(word);
  if (accentFreeWord !== word) {
    addToVariantMap(index.variantToBase, accentFreeWord, word);
    addToVariantMap(index.variantToBase, accentFreeWord.toLowerCase(), word);
    const normalizedAccentFree = processor.normalize(accentFreeWord);
    if (normalizedAccentFree !== accentFreeWord.toLowerCase()) {
      addToVariantMap(index.variantToBase, normalizedAccentFree, word);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(word);
    variants.forEach((variant) => {
      addToVariantMap(index.variantToBase, variant, word);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(word);
    if (phoneticCode) {
      addToVariantMap(index.phoneticToBase, phoneticCode, word);
    }
  }
  const ngrams = generateNgrams(normalized, config.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMap(index.ngramIndex, ngram, word);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const compoundParts = processor.splitCompoundWords(word);
    compoundParts.forEach((part) => {
      if (part !== word) {
        addToVariantMap(index.variantToBase, processor.normalize(part), word);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMap(index.synonymMap, synonym, word);
    });
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
function processWordWithProcessorAndField(fieldValue, baseId, fieldName, processor, index, config, featureSet) {
  const normalized = processor.normalize(fieldValue);
  addToVariantMapWithField(index.variantToBase, normalized, baseId);
  addToVariantMapWithField(index.variantToBase, fieldValue.toLowerCase(), baseId);
  addToVariantMapWithField(index.variantToBase, fieldValue, baseId);
  const accentFreeWord = removeAccents(fieldValue);
  if (accentFreeWord !== fieldValue) {
    addToVariantMapWithField(index.variantToBase, accentFreeWord, baseId);
    addToVariantMapWithField(index.variantToBase, accentFreeWord.toLowerCase(), baseId);
    const normalizedAccentFree = processor.normalize(accentFreeWord);
    if (normalizedAccentFree !== accentFreeWord.toLowerCase()) {
      addToVariantMapWithField(index.variantToBase, normalizedAccentFree, baseId);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(fieldValue);
    variants.forEach((variant) => {
      addToVariantMapWithField(index.variantToBase, variant, baseId);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(fieldValue);
    if (phoneticCode) {
      addToVariantMapWithField(index.phoneticToBase, phoneticCode, baseId);
    }
  }
  const ngrams = generateNgrams(normalized, config.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMapWithField(index.ngramIndex, ngram, baseId);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const parts = processor.splitCompoundWords(fieldValue);
    parts.forEach((part) => {
      if (part.length >= config.minQueryLength) {
        addToVariantMapWithField(index.variantToBase, part, baseId);
        addToVariantMapWithField(index.variantToBase, processor.normalize(part), baseId);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMapWithField(index.synonymMap, synonym, baseId);
    });
    if (config.customSynonyms) {
      const customSynonyms = config.customSynonyms[normalized];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMapWithField(index.synonymMap, synonym, baseId);
        });
      }
    }
  }
}
function addToVariantMapWithField(map, key, value, _fieldName) {
  if (!map.has(key)) {
    map.set(key, /* @__PURE__ */ new Set());
  }
  map.get(key).add(value);
}
function addToVariantMap(map, key, value) {
  if (!map.has(key)) {
    map.set(key, /* @__PURE__ */ new Set());
  }
  map.get(key).add(value);
}
function batchSearch(index, queries, maxResults, options = {}) {
  const results = {};
  const uniqueQueries = [...new Set(queries)];
  for (const query of uniqueQueries) {
    results[query] = getSuggestions(index, query, maxResults, options);
  }
  return results;
}
function getSuggestions(index, query, maxResults, options = {}) {
  const config = index.config;
  const limit = maxResults || options.maxResults || config.maxResults;
  const threshold = options.fuzzyThreshold || config.fuzzyThreshold;
  if (!query || query.trim().length < config.minQueryLength) {
    return [];
  }
  let processedQuery = query;
  if (config.enableStopWords && config.stopWords && config.stopWords.length > 0) {
    processedQuery = filterStopWords(query, config.stopWords);
  }
  if (index._cache) {
    const cached = index._cache.get(processedQuery, limit, options);
    if (cached) {
      return cached;
    }
  }
  const activeLanguages = options.languages || config.languages;
  const processors = activeLanguages.map((lang) => index.languageProcessors.get(lang)).filter((p) => p !== void 0);
  if (processors.length === 0) {
    return [];
  }
  if (index.invertedIndex && index.documents) {
    const results2 = getSuggestionsInverted(index, processedQuery, limit, threshold, processors, options);
    if (index._cache) {
      index._cache.set(processedQuery, results2, limit, options);
    }
    return results2;
  }
  const matches = /* @__PURE__ */ new Map();
  for (const processor of processors) {
    const normalizedQuery = processor.normalize(processedQuery.trim());
    findExactMatches(normalizedQuery, index, matches, processor.language);
    findPrefixMatches(normalizedQuery, index, matches, processor.language);
    findPhoneticMatches(normalizedQuery, processor, index, matches);
    findSynonymMatches(normalizedQuery, index, matches);
    findNgramMatches(normalizedQuery, index, matches, processor.language, config.ngramSize);
    if (config.features.includes("missing-letters") || config.features.includes("extra-letters") || config.features.includes("transpositions")) {
      findFuzzyMatches(normalizedQuery, index, matches, processor, config);
    }
  }
  const results = Array.from(matches.values()).map((match) => createSuggestionResult(match, processedQuery, threshold, index, options)).filter((result) => result !== null).sort((a, b) => b.score - a.score).slice(0, limit);
  if (index._cache) {
    index._cache.set(processedQuery, results, limit, options);
  }
  return results;
}
function findExactMatches(query, index, matches, language) {
  const wordBoundaries = index.config.wordBoundaries || false;
  if (query.includes("*")) {
    for (const baseWord of index.base) {
      if (matchesWildcard(baseWord, query)) {
        if (!matches.has(baseWord)) {
          matches.set(baseWord, {
            word: baseWord,
            normalized: query,
            matchType: "exact",
            editDistance: 0,
            language
          });
        }
      }
    }
    return;
  }
  const exactMatches = index.variantToBase.get(query);
  if (exactMatches) {
    exactMatches.forEach((word) => {
      if (wordBoundaries && !matchesWord(word, query, wordBoundaries)) {
        return;
      }
      const existing = matches.get(word);
      if (!existing || existing.matchType !== "exact") {
        matches.set(word, {
          word,
          normalized: query,
          matchType: "exact",
          editDistance: 0,
          language
        });
      }
    });
  }
  const queryLower = query.toLowerCase();
  for (const baseWord of index.base) {
    if (baseWord.toLowerCase() === queryLower) {
      if (!matches.has(baseWord)) {
        matches.set(baseWord, {
          word: baseWord,
          normalized: query,
          matchType: "exact",
          editDistance: 0,
          language
        });
      }
    }
  }
}
function findPrefixMatches(query, index, matches, language) {
  const wordBoundaries = index.config.wordBoundaries || false;
  for (const [variant, words] of index.variantToBase.entries()) {
    if (variant.startsWith(query) && variant !== query) {
      words.forEach((word) => {
        if (wordBoundaries && !matchesWord(word, query, wordBoundaries)) {
          return;
        }
        if (!matches.has(word)) {
          matches.set(word, {
            word,
            normalized: variant,
            matchType: "prefix",
            language
          });
        }
      });
    }
  }
}
function findPhoneticMatches(query, processor, index, matches) {
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
            language: processor.language
          });
        }
      });
    }
  }
}
function findSynonymMatches(query, index, matches) {
  const synonymMatches = index.synonymMap.get(query);
  if (synonymMatches) {
    synonymMatches.forEach((word) => {
      if (!matches.has(word)) {
        matches.set(word, {
          word,
          normalized: query,
          matchType: "synonym",
          language: "synonym"
        });
      }
    });
  }
}
function findNgramMatches(query, index, matches, language, ngramSize) {
  if (query.length < ngramSize) return;
  const queryNgrams = generateNgrams(query, ngramSize);
  const candidateWords = /* @__PURE__ */ new Set();
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
        language
      });
    }
  });
}
function findFuzzyMatches(query, index, matches, processor, config) {
  const maxDistance = config.maxEditDistance;
  for (const [variant, words] of index.variantToBase.entries()) {
    if (Math.abs(variant.length - query.length) <= maxDistance) {
      const distance = calculateLevenshteinDistance(query, variant, maxDistance);
      if (distance <= maxDistance) {
        words.forEach((word) => {
          const existingMatch = matches.get(word);
          if (!existingMatch || existingMatch.matchType !== "exact" && existingMatch.matchType !== "prefix" && (existingMatch.editDistance || Infinity) > distance) {
            matches.set(word, {
              word,
              normalized: variant,
              matchType: "fuzzy",
              editDistance: distance,
              language: processor.language
            });
          }
        });
      }
    }
  }
}
function createSuggestionResult(match, originalQuery, threshold, index, options) {
  let score = calculateMatchScore(match, originalQuery);
  if (match.fieldWeight) {
    score = Math.min(1, score * match.fieldWeight);
  }
  if (score < threshold) {
    return null;
  }
  const result = {
    display: match.word,
    baseWord: match.word,
    isSynonym: match.matchType === "synonym",
    score,
    language: match.language,
    // @ts-ignore - temporary debug property
    _debug_matchType: match.matchType
  };
  if (index.fieldData && index.fieldData.has(match.word)) {
    result.fields = index.fieldData.get(match.word);
    result.field = match.field;
  }
  if (options?.includeHighlights) {
    result.highlights = calculateHighlights(match, originalQuery, match.word);
  }
  return result;
}
function calculateMatchScore(match, query) {
  const queryLen = query.length;
  const wordLen = match.word.length;
  const maxLen = Math.max(queryLen, wordLen);
  let score = 0.5;
  switch (match.matchType) {
    case "exact":
      score = 1;
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
      if (match.editDistance !== void 0) {
        score = Math.max(0.3, 1 - match.editDistance / maxLen);
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
  if (wordLen <= queryLen + 2 && match.matchType !== "exact") {
    score += 0.1;
  }
  return Math.min(1, Math.max(0, score));
}
function generateNgrams(str, n) {
  if (str.length < n) return [str];
  const ngrams = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}
function getSuggestionsInverted(index, query, limit, threshold, processors, options) {
  if (!index.invertedIndex || !index.documents) {
    throw new Error("Inverted index not available");
  }
  const matches = searchInvertedIndex(index.invertedIndex, index.documents, query, processors, index.config);
  const results = matches.map((match) => createSuggestionResult(match, query, threshold, index, options)).filter((result) => result !== null).sort((a, b) => b.score - a.score).slice(0, limit);
  return results;
}
export {
  batchSearch,
  buildFuzzyIndex,
  getSuggestions
};
//# sourceMappingURL=index.js.map
