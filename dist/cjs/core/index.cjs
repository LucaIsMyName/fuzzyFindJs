"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const config = require("./config.cjs");
const index = require("../languages/index.cjs");
const levenshtein = require("../algorithms/levenshtein.cjs");
const invertedIndex = require("./inverted-index.cjs");
const highlighting = require("./highlighting.cjs");
const cache = require("./cache.cjs");
const accentNormalization = require("../utils/accent-normalization.cjs");
const fieldWeighting = require("./field-weighting.cjs");
const stopWords = require("../utils/stop-words.cjs");
const wordBoundaries = require("../utils/word-boundaries.cjs");
const phraseParser = require("../utils/phrase-parser.cjs");
const phraseMatching = require("./phrase-matching.cjs");
const languageDetection = require("../utils/language-detection.cjs");
const index$1 = require("../fql/index.cjs");
const alphanumericSegmenter = require("../utils/alphanumeric-segmenter.cjs");
const filters = require("./filters.cjs");
const sorting = require("./sorting.cjs");
function buildFuzzyIndex(words = [], options = {}) {
  const userSpecifiedLanguages = options.config?.languages;
  const shouldAutoDetect = !userSpecifiedLanguages || userSpecifiedLanguages.includes("auto");
  const config$1 = config.mergeConfig(options.config);
  if (shouldAutoDetect) {
    const sampleText = languageDetection.sampleTextForDetection(words, 100);
    const detectedLanguages = languageDetection.detectLanguages(sampleText);
    config$1.languages = detectedLanguages;
  }
  config.validateConfig(config$1);
  const featureSet = new Set(config$1.features);
  const languageProcessors = options.languageProcessors || index.LanguageRegistry.getProcessors(config$1.languages);
  if (languageProcessors.length === 0) {
    throw new Error(`No language processors found for: ${config$1.languages.join(", ")}`);
  }
  const hasFields = options.fields && options.fields.length > 0;
  const isObjectArray = words.length > 0 && typeof words[0] === "object" && words[0] !== null;
  if (isObjectArray && !hasFields) {
    throw new Error("When indexing objects, you must specify which fields to index via options.fields");
  }
  const index$12 = {
    base: [],
    variantToBase: /* @__PURE__ */ new Map(),
    phoneticToBase: /* @__PURE__ */ new Map(),
    ngramIndex: /* @__PURE__ */ new Map(),
    synonymMap: /* @__PURE__ */ new Map(),
    languageProcessors: /* @__PURE__ */ new Map(),
    config: config$1
  };
  if (hasFields) {
    index$12.fields = options.fields;
    index$12.fieldWeights = fieldWeighting.normalizeFieldWeights(options.fields, options.fieldWeights);
    index$12.fieldData = /* @__PURE__ */ new Map();
  }
  languageProcessors.forEach((processor) => {
    index$12.languageProcessors.set(processor.language, processor);
  });
  const shouldUseInvertedIndex = options.useInvertedIndex || config$1.useInvertedIndex || config$1.useBM25 || config$1.useBloomFilter || words.length >= 1e4;
  const processedWords = /* @__PURE__ */ new Set();
  let processed = 0;
  if (!shouldUseInvertedIndex) {
    for (const item of words) {
      if (!item) continue;
      if (hasFields && isObjectArray) {
        const fieldValues = fieldWeighting.extractFieldValues(item, options.fields);
        if (!fieldValues) continue;
        const baseId = Object.values(fieldValues)[0] || `item_${processed}`;
        index$12.fieldData.set(baseId, fieldValues);
        for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
          if (!fieldValue || fieldValue.trim().length < config$1.minQueryLength) continue;
          const trimmedValue = fieldValue.trim();
          if (!processedWords.has(baseId.toLowerCase())) {
            processedWords.add(baseId.toLowerCase());
            index$12.base.push(baseId);
          }
          for (const processor of languageProcessors) {
            processWordWithProcessorAndField(trimmedValue, baseId, fieldName, processor, index$12, config$1, featureSet);
          }
        }
      } else {
        const word = typeof item === "string" ? item : String(item);
        if (word.trim().length < config$1.minQueryLength) continue;
        const trimmedWord = word.trim();
        if (processedWords.has(trimmedWord.toLowerCase())) continue;
        processedWords.add(trimmedWord.toLowerCase());
        index$12.base.push(trimmedWord);
        for (const processor of languageProcessors) {
          processWordWithProcessor(trimmedWord, processor, index$12, config$1, featureSet);
        }
      }
      processed++;
      if (options.onProgress) {
        options.onProgress(processed, words.length);
      }
    }
  }
  if (shouldUseInvertedIndex) {
    const { invertedIndex: invertedIndex$1, documents } = invertedIndex.buildInvertedIndex(words, languageProcessors, config$1, featureSet);
    index$12.invertedIndex = invertedIndex$1;
    index$12.documents = documents;
    index$12.base = documents.map((doc) => doc.word);
  }
  const enableCache = config$1.enableCache !== false;
  if (enableCache) {
    const cacheSize = config$1.cacheSize || 100;
    index$12._cache = new cache.SearchCache(cacheSize);
  }
  return index$12;
}
function processWordWithProcessor(word, processor, index2, config2, featureSet) {
  const normalized = processor.normalize(word);
  addToVariantMap(index2.variantToBase, normalized.toLowerCase(), word);
  const accentFreeWord = accentNormalization.removeAccents(word);
  if (accentFreeWord !== word) {
    const normalizedAccentFree = processor.normalize(accentFreeWord).toLowerCase();
    if (normalizedAccentFree !== normalized.toLowerCase()) {
      addToVariantMap(index2.variantToBase, normalizedAccentFree, word);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(word, config2.performance);
    variants.forEach((variant) => {
      addToVariantMap(index2.variantToBase, variant.toLowerCase(), word);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(word);
    if (phoneticCode) {
      addToVariantMap(index2.phoneticToBase, phoneticCode, word);
    }
  }
  const shouldLimitNgrams = config2.performance === "fast" && normalized.length > 10;
  const ngramSource = shouldLimitNgrams ? normalized.substring(0, 15) : normalized;
  const ngrams = generateNgrams(ngramSource.toLowerCase(), config2.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMap(index2.ngramIndex, ngram, word);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const compoundParts = processor.splitCompoundWords(word);
    compoundParts.forEach((part) => {
      if (part !== word) {
        addToVariantMap(index2.variantToBase, processor.normalize(part).toLowerCase(), word);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMap(index2.synonymMap, synonym.toLowerCase(), word);
    });
    if (config2.customSynonyms) {
      const customSynonyms = config2.customSynonyms[normalized.toLowerCase()];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMap(index2.synonymMap, synonym.toLowerCase(), word);
        });
      }
    }
  }
}
function processWordWithProcessorAndField(fieldValue, baseId, fieldName, processor, index2, config2, featureSet) {
  const normalized = processor.normalize(fieldValue);
  addToVariantMapWithField(index2.variantToBase, normalized.toLowerCase(), baseId);
  const accentFreeWord = accentNormalization.removeAccents(fieldValue);
  if (accentFreeWord !== fieldValue) {
    const normalizedAccentFree = processor.normalize(accentFreeWord).toLowerCase();
    if (normalizedAccentFree !== normalized.toLowerCase()) {
      addToVariantMapWithField(index2.variantToBase, normalizedAccentFree, baseId);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(fieldValue, config2.performance);
    variants.forEach((variant) => {
      addToVariantMapWithField(index2.variantToBase, variant.toLowerCase(), baseId);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(fieldValue);
    if (phoneticCode) {
      addToVariantMapWithField(index2.phoneticToBase, phoneticCode, baseId);
    }
  }
  const shouldLimitNgrams = config2.performance === "fast" && normalized.length > 15;
  const ngramSource = shouldLimitNgrams ? normalized.substring(0, 15) : normalized;
  const ngrams = generateNgrams(ngramSource.toLowerCase(), config2.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMapWithField(index2.ngramIndex, ngram, baseId);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const parts = processor.splitCompoundWords(fieldValue);
    parts.forEach((part) => {
      if (part.length >= config2.minQueryLength) {
        addToVariantMapWithField(index2.variantToBase, processor.normalize(part).toLowerCase(), baseId);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMapWithField(index2.synonymMap, synonym.toLowerCase(), baseId);
    });
    if (config2.customSynonyms) {
      const customSynonyms = config2.customSynonyms[normalized.toLowerCase()];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMapWithField(index2.synonymMap, synonym.toLowerCase(), baseId);
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
function batchSearch(index2, queries, maxResults, options = {}) {
  const results = {};
  const uniqueQueries = [...new Set(queries)];
  for (const query of uniqueQueries) {
    results[query] = getSuggestions(index2, query, maxResults, options);
  }
  return results;
}
function getSuggestions(index2, query, maxResults, options = {}) {
  const config2 = index2.config;
  const limit = maxResults || options.maxResults || config2.maxResults;
  const threshold = options.fuzzyThreshold || config2.fuzzyThreshold;
  if (!query || query.trim().length < config2.minQueryLength) {
    return [];
  }
  if (options.enableFQL && index$1.isFQLQuery(query)) {
    return index$1.executeFQLQuery(index2, query, limit, options);
  }
  const parsedQuery = phraseParser.parseQuery(query);
  if (parsedQuery.hasPhrases) {
    return searchWithPhrases(index2, parsedQuery, limit, threshold, options);
  }
  let processedQuery = query;
  if (config2.enableStopWords && config2.stopWords && config2.stopWords.length > 0) {
    processedQuery = stopWords.filterStopWords(query, config2.stopWords);
  }
  if (!processedQuery || processedQuery.trim().length === 0) {
    return [];
  }
  if (index2._cache) {
    const cached = index2._cache.get(processedQuery, limit, options);
    if (cached) {
      return cached;
    }
  }
  const activeLanguages = options.languages || config2.languages;
  const processors = activeLanguages.map((lang) => index2.languageProcessors.get(lang)).filter((p) => p !== void 0);
  if (processors.length === 0) {
    return [];
  }
  if (index2.invertedIndex && index2.documents) {
    const results2 = getSuggestionsInverted(index2, processedQuery, limit, threshold, processors, options);
    if (index2._cache) {
      index2._cache.set(processedQuery, results2, limit, options);
    }
    return results2;
  }
  const matches = /* @__PURE__ */ new Map();
  for (const processor of processors) {
    const normalizedQuery = processor.normalize(processedQuery.trim());
    findExactMatches(normalizedQuery, index2, matches, processor.language);
    const exactMatches = Array.from(matches.values()).filter((m) => m.matchType === "exact");
    if (exactMatches.length >= limit && exactMatches.some((m) => m.word === normalizedQuery)) {
      break;
    }
    findPrefixMatches(normalizedQuery, index2, matches, processor.language);
    const highQualityMatches = Array.from(matches.values()).filter(
      (m) => m.matchType === "exact" || m.matchType === "prefix"
    );
    if (highQualityMatches.length >= limit * 2) {
      findPhoneticMatches(normalizedQuery, processor, index2, matches);
      findSynonymMatches(normalizedQuery, index2, matches);
      if (matches.size < limit * 3) {
        findNgramMatches(normalizedQuery, index2, matches, processor.language, config2.ngramSize);
        if (config2.features.includes("missing-letters") || config2.features.includes("extra-letters") || config2.features.includes("transpositions")) {
          findFuzzyMatches(normalizedQuery, index2, matches, processor, config2);
        }
      }
    } else {
      findPhoneticMatches(normalizedQuery, processor, index2, matches);
      findSynonymMatches(normalizedQuery, index2, matches);
      findNgramMatches(normalizedQuery, index2, matches, processor.language, config2.ngramSize);
      if (config2.features.includes("missing-letters") || config2.features.includes("extra-letters") || config2.features.includes("transpositions")) {
        findFuzzyMatches(normalizedQuery, index2, matches, processor, config2);
      }
    }
  }
  let results = Array.from(matches.values()).map((match) => createSuggestionResult(match, processedQuery, threshold, index2, options)).filter((result) => result !== null);
  if (options.filters) {
    results = filters.applyFilters(results, options.filters);
  }
  if (options.sort) {
    results = sorting.applySorting(results, options.sort);
  } else {
    results = results.sort((a, b) => b.score - a.score);
  }
  results = results.slice(0, limit);
  if (index2._cache) {
    index2._cache.set(processedQuery, results, limit, options);
  }
  return results;
}
function findExactMatches(query, index2, matches, language) {
  const wordBoundaries$1 = index2.config.wordBoundaries || false;
  if (query.includes("*")) {
    for (const baseWord of index2.base) {
      if (wordBoundaries.matchesWildcard(baseWord, query)) {
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
  const exactMatches = index2.variantToBase.get(query.toLowerCase());
  if (exactMatches) {
    exactMatches.forEach((word) => {
      if (wordBoundaries$1 && !wordBoundaries.matchesWord(word, query, wordBoundaries$1)) {
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
  for (const baseWord of index2.base) {
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
function findPrefixMatches(query, index2, matches, language) {
  const wordBoundaries$1 = index2.config.wordBoundaries || false;
  const queryLower = query.toLowerCase();
  for (const [variant, words] of index2.variantToBase.entries()) {
    if (variant.startsWith(queryLower) && variant !== queryLower) {
      words.forEach((word) => {
        if (wordBoundaries$1 && !wordBoundaries.matchesWord(word, query, wordBoundaries$1)) {
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
function findPhoneticMatches(query, processor, index2, matches) {
  if (!processor.supportedFeatures.includes("phonetic")) return;
  const phoneticCode = processor.getPhoneticCode(query);
  if (phoneticCode) {
    const phoneticMatches = index2.phoneticToBase.get(phoneticCode);
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
function findSynonymMatches(query, index2, matches) {
  const synonymMatches = index2.synonymMap.get(query.toLowerCase());
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
function findNgramMatches(query, index2, matches, language, ngramSize) {
  if (query.length < ngramSize) return;
  const queryNgrams = generateNgrams(query, ngramSize);
  const candidateWords = /* @__PURE__ */ new Set();
  queryNgrams.forEach((ngram) => {
    const ngramMatches = index2.ngramIndex.get(ngram);
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
function findFuzzyMatches(query, index2, matches, processor, config2) {
  let maxDistance = config2.maxEditDistance;
  if (query.length <= 3) {
    maxDistance = Math.max(maxDistance, 2);
  } else if (query.length <= 4) {
    maxDistance = Math.max(maxDistance, 2);
  }
  for (const [variant, words] of index2.variantToBase.entries()) {
    const lengthDiff = Math.abs(variant.length - query.length);
    const maxLengthDiff = query.length <= 3 ? 5 : query.length <= 4 ? 4 : maxDistance;
    if (lengthDiff <= maxLengthDiff) {
      const useTranspositions = index2.config.features?.includes("transpositions");
      const distance = useTranspositions ? levenshtein.calculateDamerauLevenshteinDistance(query, variant, maxDistance) : levenshtein.calculateLevenshteinDistance(query, variant, maxDistance);
      const distanceThreshold = query.length <= 3 ? 2 : maxDistance;
      if (distance <= distanceThreshold) {
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
function createSuggestionResult(match, originalQuery, threshold, index2, options) {
  let score = calculateMatchScore(match, originalQuery, index2.config);
  if (match.bm25Score !== void 0 && index2.config.useBM25) {
    const bm25Weight = index2.config.bm25Weight || 0.6;
    const fuzzyWeight = 1 - bm25Weight;
    score = bm25Weight * match.bm25Score + fuzzyWeight * score;
  }
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
  if (index2.fieldData && index2.fieldData.has(match.word)) {
    result.fields = index2.fieldData.get(match.word);
    result.field = match.field;
  }
  if (options?.includeHighlights) {
    result.highlights = highlighting.calculateHighlights(match, originalQuery, match.word);
  }
  return result;
}
function calculateMatchScore(match, query, config$1) {
  const scores = {
    ...config.DEFAULT_MATCH_TYPE_SCORES,
    ...config$1?.matchTypeScores || {}
  };
  const modifiers = {
    ...config.DEFAULT_SCORING_MODIFIERS,
    ...config$1?.scoringModifiers || {}
  };
  const queryLen = query.length;
  const wordLen = match.word.length;
  const maxLen = Math.max(queryLen, wordLen);
  let score = modifiers.baseScore;
  switch (match.matchType) {
    case "exact":
      score = scores.exact;
      break;
    case "prefix":
      score = scores.prefix;
      if (modifiers.prefixLengthPenalty) {
        score -= (wordLen - queryLen) / (maxLen * 2);
      }
      break;
    case "substring":
      score = scores.substring;
      break;
    case "phonetic":
      score = scores.phonetic;
      break;
    case "fuzzy":
      if (match.editDistance !== void 0) {
        if (config$1?.enableAlphanumericSegmentation && alphanumericSegmenter.isAlphanumeric(query) && alphanumericSegmenter.isAlphanumeric(match.word)) {
          score = calculateAlphanumericScore(query, match.word, config$1);
        } else {
          score = Math.max(scores.fuzzyMin, scores.fuzzy - match.editDistance / maxLen * 0.3);
        }
      }
      break;
    case "synonym":
      score = scores.synonym;
      break;
    case "compound":
      score = scores.compound;
      break;
    case "ngram":
      score = levenshtein.calculateNgramSimilarity(query.toLowerCase(), match.normalized, 3) * scores.ngram;
      break;
  }
  if (wordLen <= queryLen + modifiers.shortWordMaxDiff && match.matchType !== "exact") {
    score += modifiers.shortWordBoost;
  }
  if (match.matchType === "exact") {
    return Math.min(1, Math.max(0, scores.exact));
  }
  return Math.min(1, Math.max(0, score));
}
function calculateAlphanumericScore(query, target, config2) {
  const queryAlpha = alphanumericSegmenter.extractAlphaPart(query).toLowerCase();
  const targetAlpha = alphanumericSegmenter.extractAlphaPart(target).toLowerCase();
  const queryNumeric = alphanumericSegmenter.extractNumericPart(query);
  const targetNumeric = alphanumericSegmenter.extractNumericPart(target);
  const alphaWeight = config2.alphanumericAlphaWeight || 0.7;
  const numericWeight = config2.alphanumericNumericWeight || 0.3;
  let alphaScore = 0;
  let numericScore = 0;
  if (queryAlpha.length > 0 && targetAlpha.length > 0) {
    const alphaMaxLen = Math.max(queryAlpha.length, targetAlpha.length);
    const alphaDistance = levenshtein.calculateLevenshteinDistance(queryAlpha, targetAlpha, config2.maxEditDistance);
    alphaScore = Math.max(0, 1 - alphaDistance / alphaMaxLen);
  } else if (queryAlpha.length === 0 && targetAlpha.length === 0) {
    alphaScore = 1;
  }
  if (queryNumeric.length > 0 && targetNumeric.length > 0) {
    if (queryNumeric === targetNumeric) {
      numericScore = 1;
    } else {
      if (targetNumeric.includes(queryNumeric) || queryNumeric.includes(targetNumeric)) {
        const shorter = queryNumeric.length < targetNumeric.length ? queryNumeric : targetNumeric;
        const longer = queryNumeric.length < targetNumeric.length ? targetNumeric : queryNumeric;
        numericScore = shorter.length / longer.length;
      } else {
        const numericMaxLen = Math.max(queryNumeric.length, targetNumeric.length);
        const multiplier = config2.alphanumericNumericEditDistanceMultiplier || 1.5;
        const numericDistance = levenshtein.calculateLevenshteinDistance(queryNumeric, targetNumeric, Math.ceil(config2.maxEditDistance * multiplier));
        numericScore = Math.max(0, 1 - numericDistance / numericMaxLen);
      }
    }
  } else if (queryNumeric.length === 0 && targetNumeric.length === 0) {
    numericScore = 1;
  } else {
    numericScore = 0.3;
  }
  const combinedScore = alphaScore * alphaWeight + numericScore * numericWeight;
  return Math.max(0.3, combinedScore);
}
function generateNgrams(str, n) {
  if (str.length < n) return [str];
  const ngrams = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}
function getSuggestionsInverted(index2, query, limit, threshold, processors, options) {
  if (!index2.invertedIndex || !index2.documents) {
    throw new Error("Inverted index not available");
  }
  let matches = invertedIndex.searchInvertedIndex(index2.invertedIndex, index2.documents, query, processors, index2.config);
  if (index2.config.useBM25) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    matches = invertedIndex.calculateBM25Scores(matches, queryTerms, index2.invertedIndex, index2.documents, index2.config);
  }
  let results = matches.map((match) => createSuggestionResult(match, query, threshold, index2, options)).filter((result) => result !== null);
  if (options?.filters) {
    results = filters.applyFilters(results, options.filters);
  }
  if (options?.sort) {
    results = sorting.applySorting(results, options.sort);
  } else {
    results = results.sort((a, b) => b.score - a.score);
  }
  results = results.slice(0, limit);
  return results;
}
function searchWithPhrases(index2, parsedQuery, limit, threshold, options) {
  const config2 = index2.config;
  const useTranspositions = config2.features.includes("transpositions");
  const phraseOptions = {
    exactMatch: false,
    maxEditDistance: 1,
    proximityBonus: 1.5,
    maxProximityDistance: 3,
    useTranspositions
  };
  const phraseMatches = /* @__PURE__ */ new Map();
  for (const phrase of parsedQuery.phrases) {
    for (const word of index2.base) {
      const match = phraseMatching.matchPhrase(word, phrase, phraseOptions);
      if (match.matched) {
        const existing = phraseMatches.get(word);
        const newScore = match.score * phraseOptions.proximityBonus;
        if (existing) {
          phraseMatches.set(word, {
            score: Math.max(existing.score, newScore),
            phraseCount: existing.phraseCount + 1
          });
        } else {
          phraseMatches.set(word, { score: newScore, phraseCount: 1 });
        }
      }
    }
  }
  let termMatches = /* @__PURE__ */ new Map();
  if (parsedQuery.terms.length > 0) {
    const termQuery = parsedQuery.terms.join(" ");
    const processors = config2.languages.map((lang) => index2.languageProcessors.get(lang)).filter((p) => p !== void 0);
    for (const processor of processors) {
      const normalizedQuery = processor.normalize(termQuery);
      findExactMatches(normalizedQuery, index2, termMatches, processor.language);
      findPrefixMatches(normalizedQuery, index2, termMatches, processor.language);
      findPhoneticMatches(normalizedQuery, processor, index2, termMatches);
      findNgramMatches(normalizedQuery, index2, termMatches, processor.language, config2.ngramSize);
      if (config2.features.includes("missing-letters") || config2.features.includes("extra-letters") || config2.features.includes("transpositions")) {
        findFuzzyMatches(normalizedQuery, index2, termMatches, processor, config2);
      }
    }
  }
  const combinedResults = /* @__PURE__ */ new Map();
  for (const [word, phraseData] of phraseMatches.entries()) {
    const result = {
      display: word,
      baseWord: word,
      isSynonym: false,
      score: phraseData.score
    };
    const termMatch = termMatches.get(word);
    if (termMatch) {
      result.score = Math.min(1, result.score * 1.2);
    }
    combinedResults.set(word, result);
  }
  for (const [word, match] of termMatches.entries()) {
    if (!combinedResults.has(word)) {
      const result = createSuggestionResult(match, parsedQuery.terms.join(" "), threshold, index2, options);
      if (result) {
        result.score *= 0.8;
        combinedResults.set(word, result);
      }
    }
  }
  const results = Array.from(combinedResults.values()).filter((r) => r.score >= threshold).sort((a, b) => b.score - a.score).slice(0, limit);
  if (index2._cache) {
    index2._cache.set(parsedQuery.original, results, limit, options);
  }
  return results;
}
function updateIndex(index2, newItems = [], options = {}) {
  if (!index2 || !index2.config) {
    throw new Error("Invalid index provided");
  }
  if (!newItems || newItems.length === 0) {
    return index2;
  }
  const config2 = index2.config;
  const featureSet = new Set(config2.features);
  const languageProcessors = Array.from(index2.languageProcessors.values());
  if (languageProcessors.length === 0) {
    throw new Error("No language processors found in index");
  }
  const hasFields = index2.fields && index2.fields.length > 0;
  const isObjectArray = newItems.length > 0 && typeof newItems[0] === "object" && newItems[0] !== null;
  if (isObjectArray && !hasFields) {
    throw new Error("Index was not built with fields, cannot add objects");
  }
  const existingWords = new Set(index2.base.map((w) => w.toLowerCase()));
  let processed = 0;
  for (const item of newItems) {
    if (!item) continue;
    if (hasFields && isObjectArray) {
      const fieldValues = fieldWeighting.extractFieldValues(item, index2.fields);
      if (!fieldValues) continue;
      const baseId = Object.values(fieldValues)[0] || `item_${index2.base.length + processed}`;
      if (existingWords.has(baseId.toLowerCase())) continue;
      if (index2.fieldData) {
        index2.fieldData.set(baseId, fieldValues);
      }
      existingWords.add(baseId.toLowerCase());
      index2.base.push(baseId);
      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
        if (!fieldValue || fieldValue.trim().length < config2.minQueryLength) continue;
        const trimmedValue = fieldValue.trim();
        for (const processor of languageProcessors) {
          processWordWithProcessorAndField(trimmedValue, baseId, fieldName, processor, index2, config2, featureSet);
        }
      }
    } else {
      const word = typeof item === "string" ? item : String(item);
      if (word.trim().length < config2.minQueryLength) continue;
      const trimmedWord = word.trim();
      if (existingWords.has(trimmedWord.toLowerCase())) continue;
      existingWords.add(trimmedWord.toLowerCase());
      index2.base.push(trimmedWord);
      for (const processor of languageProcessors) {
        processWordWithProcessor(trimmedWord, processor, index2, config2, featureSet);
      }
    }
    processed++;
    if (options.onProgress) {
      options.onProgress(processed, newItems.length);
    }
  }
  if (index2.invertedIndex && index2.documents) {
    const { invertedIndex: invertedIndex$1, documents } = invertedIndex.buildInvertedIndex(
      index2.base,
      languageProcessors,
      config2,
      featureSet
    );
    index2.invertedIndex = invertedIndex$1;
    index2.documents = documents;
  }
  if (index2._cache) {
    index2._cache.clear();
  }
  return index2;
}
function removeFromIndex(index2, itemsToRemove = []) {
  if (!index2 || !index2.config) {
    throw new Error("Invalid index provided");
  }
  if (!itemsToRemove || itemsToRemove.length === 0) {
    return index2;
  }
  const toRemove = new Set(itemsToRemove.map((item) => item.toLowerCase()));
  index2.base = index2.base.filter((word) => !toRemove.has(word.toLowerCase()));
  for (const [variant, baseWords] of index2.variantToBase.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index2.variantToBase.delete(variant);
    } else {
      index2.variantToBase.set(variant, filtered);
    }
  }
  for (const [phonetic, baseWords] of index2.phoneticToBase.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index2.phoneticToBase.delete(phonetic);
    } else {
      index2.phoneticToBase.set(phonetic, filtered);
    }
  }
  for (const [ngram, baseWords] of index2.ngramIndex.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index2.ngramIndex.delete(ngram);
    } else {
      index2.ngramIndex.set(ngram, filtered);
    }
  }
  for (const [synonym, baseWords] of index2.synonymMap.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index2.synonymMap.delete(synonym);
    } else {
      index2.synonymMap.set(synonym, filtered);
    }
  }
  if (index2.fieldData) {
    for (const item of itemsToRemove) {
      index2.fieldData.delete(item);
    }
  }
  if (index2.invertedIndex && index2.documents) {
    const config2 = index2.config;
    const featureSet = new Set(config2.features);
    const languageProcessors = Array.from(index2.languageProcessors.values());
    const { invertedIndex: invertedIndex$1, documents } = invertedIndex.buildInvertedIndex(
      index2.base,
      languageProcessors,
      config2,
      featureSet
    );
    index2.invertedIndex = invertedIndex$1;
    index2.documents = documents;
  }
  if (index2._cache) {
    index2._cache.clear();
  }
  return index2;
}
exports.batchSearch = batchSearch;
exports.buildFuzzyIndex = buildFuzzyIndex;
exports.getSuggestions = getSuggestions;
exports.removeFromIndex = removeFromIndex;
exports.updateIndex = updateIndex;
//# sourceMappingURL=index.cjs.map
