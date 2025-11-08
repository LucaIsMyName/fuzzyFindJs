import { mergeConfig, validateConfig, DEFAULT_MATCH_TYPE_SCORES, DEFAULT_SCORING_MODIFIERS } from "./config.js";
import { LanguageRegistry } from "../languages/index.js";
import { calculateDamerauLevenshteinDistance, calculateLevenshteinDistance, calculateNgramSimilarity } from "../algorithms/levenshtein.js";
import { buildInvertedIndex, searchInvertedIndex, calculateBM25Scores } from "./inverted-index.js";
import { calculateHighlights } from "./highlighting.js";
import { SearchCache } from "./cache.js";
import { removeAccents } from "../utils/accent-normalization.js";
import { normalizeFieldWeights, extractFieldValues } from "./field-weighting.js";
import { filterStopWords } from "../utils/stop-words.js";
import { matchesWildcard, matchesWord } from "../utils/word-boundaries.js";
import { parseQuery } from "../utils/phrase-parser.js";
import { matchPhrase } from "./phrase-matching.js";
import { sampleTextForDetection, detectLanguages } from "../utils/language-detection.js";
import { isFQLQuery, executeFQLQuery } from "../fql/index.js";
import { isAlphanumeric, extractAlphaPart, extractNumericPart } from "../utils/alphanumeric-segmenter.js";
import { applyFilters } from "./filters.js";
import { applySorting } from "./sorting.js";
function buildFuzzyIndex(words = [], options = {}) {
  const userSpecifiedLanguages = options.config?.languages;
  const shouldAutoDetect = !userSpecifiedLanguages || userSpecifiedLanguages.includes("auto");
  const config = mergeConfig(options.config);
  if (shouldAutoDetect) {
    const sampleText = sampleTextForDetection(words, 100);
    const detectedLanguages = detectLanguages(sampleText);
    config.languages = detectedLanguages;
  }
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
  const shouldUseInvertedIndex = options.useInvertedIndex || config.useInvertedIndex || config.useBM25 || config.useBloomFilter || words.length >= 1e4;
  const processedWords = /* @__PURE__ */ new Set();
  let processed = 0;
  if (!shouldUseInvertedIndex) {
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
  }
  if (shouldUseInvertedIndex) {
    const { invertedIndex, documents } = buildInvertedIndex(words, languageProcessors, config, featureSet);
    index.invertedIndex = invertedIndex;
    index.documents = documents;
    index.base = documents.map((doc) => doc.word);
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
  addToVariantMap(index.variantToBase, normalized.toLowerCase(), word);
  const accentFreeWord = removeAccents(word);
  if (accentFreeWord !== word) {
    const normalizedAccentFree = processor.normalize(accentFreeWord).toLowerCase();
    if (normalizedAccentFree !== normalized.toLowerCase()) {
      addToVariantMap(index.variantToBase, normalizedAccentFree, word);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(word, config.performance);
    variants.forEach((variant) => {
      addToVariantMap(index.variantToBase, variant.toLowerCase(), word);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(word);
    if (phoneticCode) {
      addToVariantMap(index.phoneticToBase, phoneticCode, word);
    }
  }
  const shouldLimitNgrams = config.performance === "fast" && normalized.length > 10;
  const ngramSource = shouldLimitNgrams ? normalized.substring(0, 15) : normalized;
  const ngrams = generateNgrams(ngramSource.toLowerCase(), config.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMap(index.ngramIndex, ngram, word);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const compoundParts = processor.splitCompoundWords(word);
    compoundParts.forEach((part) => {
      if (part !== word) {
        addToVariantMap(index.variantToBase, processor.normalize(part).toLowerCase(), word);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMap(index.synonymMap, synonym.toLowerCase(), word);
    });
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
function processWordWithProcessorAndField(fieldValue, baseId, fieldName, processor, index, config, featureSet) {
  const normalized = processor.normalize(fieldValue);
  addToVariantMapWithField(index.variantToBase, normalized.toLowerCase(), baseId);
  const accentFreeWord = removeAccents(fieldValue);
  if (accentFreeWord !== fieldValue) {
    const normalizedAccentFree = processor.normalize(accentFreeWord).toLowerCase();
    if (normalizedAccentFree !== normalized.toLowerCase()) {
      addToVariantMapWithField(index.variantToBase, normalizedAccentFree, baseId);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(fieldValue, config.performance);
    variants.forEach((variant) => {
      addToVariantMapWithField(index.variantToBase, variant.toLowerCase(), baseId);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(fieldValue);
    if (phoneticCode) {
      addToVariantMapWithField(index.phoneticToBase, phoneticCode, baseId);
    }
  }
  const shouldLimitNgrams = config.performance === "fast" && normalized.length > 15;
  const ngramSource = shouldLimitNgrams ? normalized.substring(0, 15) : normalized;
  const ngrams = generateNgrams(ngramSource.toLowerCase(), config.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMapWithField(index.ngramIndex, ngram, baseId);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const parts = processor.splitCompoundWords(fieldValue);
    parts.forEach((part) => {
      if (part.length >= config.minQueryLength) {
        addToVariantMapWithField(index.variantToBase, processor.normalize(part).toLowerCase(), baseId);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMapWithField(index.synonymMap, synonym.toLowerCase(), baseId);
    });
    if (config.customSynonyms) {
      const customSynonyms = config.customSynonyms[normalized.toLowerCase()];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMapWithField(index.synonymMap, synonym.toLowerCase(), baseId);
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
  if (options.enableFQL && isFQLQuery(query)) {
    return executeFQLQuery(index, query, limit, options);
  }
  const parsedQuery = parseQuery(query);
  if (parsedQuery.hasPhrases) {
    return searchWithPhrases(index, parsedQuery, limit, threshold, options);
  }
  let processedQuery = query;
  if (config.enableStopWords && config.stopWords && config.stopWords.length > 0) {
    processedQuery = filterStopWords(query, config.stopWords);
  }
  if (!processedQuery || processedQuery.trim().length === 0) {
    return [];
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
    const exactMatches = Array.from(matches.values()).filter((m) => m.matchType === "exact");
    if (exactMatches.length >= limit && exactMatches.some((m) => m.word === normalizedQuery)) {
      break;
    }
    findPrefixMatches(normalizedQuery, index, matches, processor.language);
    const highQualityMatches = Array.from(matches.values()).filter(
      (m) => m.matchType === "exact" || m.matchType === "prefix"
    );
    if (highQualityMatches.length >= limit * 2) {
      findPhoneticMatches(normalizedQuery, processor, index, matches);
      findSynonymMatches(normalizedQuery, index, matches);
      if (matches.size < limit * 3) {
        findNgramMatches(normalizedQuery, index, matches, processor.language, config.ngramSize);
        if (config.features.includes("missing-letters") || config.features.includes("extra-letters") || config.features.includes("transpositions")) {
          findFuzzyMatches(normalizedQuery, index, matches, processor, config);
        }
      }
    } else {
      findPhoneticMatches(normalizedQuery, processor, index, matches);
      findSynonymMatches(normalizedQuery, index, matches);
      findNgramMatches(normalizedQuery, index, matches, processor.language, config.ngramSize);
      if (config.features.includes("missing-letters") || config.features.includes("extra-letters") || config.features.includes("transpositions")) {
        findFuzzyMatches(normalizedQuery, index, matches, processor, config);
      }
    }
  }
  let results = Array.from(matches.values()).map((match) => createSuggestionResult(match, processedQuery, threshold, index, options)).filter((result) => result !== null);
  if (options.filters) {
    results = applyFilters(results, options.filters);
  }
  if (options.sort) {
    results = applySorting(results, options.sort);
  } else {
    results = results.sort((a, b) => b.score - a.score);
  }
  results = results.slice(0, limit);
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
  const exactMatches = index.variantToBase.get(query.toLowerCase());
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
  const queryLower = query.toLowerCase();
  for (const [variant, words] of index.variantToBase.entries()) {
    if (variant.startsWith(queryLower) && variant !== queryLower) {
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
  const synonymMatches = index.synonymMap.get(query.toLowerCase());
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
  let maxDistance = config.maxEditDistance;
  if (query.length <= 3) {
    maxDistance = Math.max(maxDistance, 2);
  } else if (query.length <= 4) {
    maxDistance = Math.max(maxDistance, 2);
  }
  for (const [variant, words] of index.variantToBase.entries()) {
    const lengthDiff = Math.abs(variant.length - query.length);
    const maxLengthDiff = query.length <= 3 ? 5 : query.length <= 4 ? 4 : maxDistance;
    if (lengthDiff <= maxLengthDiff) {
      const useTranspositions = index.config.features?.includes("transpositions");
      const distance = useTranspositions ? calculateDamerauLevenshteinDistance(query, variant, maxDistance) : calculateLevenshteinDistance(query, variant, maxDistance);
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
function createSuggestionResult(match, originalQuery, threshold, index, options) {
  let score = calculateMatchScore(match, originalQuery, index.config);
  if (match.bm25Score !== void 0 && index.config.useBM25) {
    const bm25Weight = index.config.bm25Weight || 0.6;
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
  if (index.fieldData && index.fieldData.has(match.word)) {
    result.fields = index.fieldData.get(match.word);
    result.field = match.field;
  }
  if (options?.includeHighlights) {
    result.highlights = calculateHighlights(match, originalQuery, match.word);
  }
  return result;
}
function calculateMatchScore(match, query, config) {
  const scores = {
    ...DEFAULT_MATCH_TYPE_SCORES,
    ...config?.matchTypeScores || {}
  };
  const modifiers = {
    ...DEFAULT_SCORING_MODIFIERS,
    ...config?.scoringModifiers || {}
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
        if (config?.enableAlphanumericSegmentation && isAlphanumeric(query) && isAlphanumeric(match.word)) {
          score = calculateAlphanumericScore(query, match.word, config);
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
      score = calculateNgramSimilarity(query.toLowerCase(), match.normalized, 3) * scores.ngram;
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
function calculateAlphanumericScore(query, target, config) {
  const queryAlpha = extractAlphaPart(query).toLowerCase();
  const targetAlpha = extractAlphaPart(target).toLowerCase();
  const queryNumeric = extractNumericPart(query);
  const targetNumeric = extractNumericPart(target);
  const alphaWeight = config.alphanumericAlphaWeight || 0.7;
  const numericWeight = config.alphanumericNumericWeight || 0.3;
  let alphaScore = 0;
  let numericScore = 0;
  if (queryAlpha.length > 0 && targetAlpha.length > 0) {
    const alphaMaxLen = Math.max(queryAlpha.length, targetAlpha.length);
    const alphaDistance = calculateLevenshteinDistance(queryAlpha, targetAlpha, config.maxEditDistance);
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
        const multiplier = config.alphanumericNumericEditDistanceMultiplier || 1.5;
        const numericDistance = calculateLevenshteinDistance(queryNumeric, targetNumeric, Math.ceil(config.maxEditDistance * multiplier));
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
function getSuggestionsInverted(index, query, limit, threshold, processors, options) {
  if (!index.invertedIndex || !index.documents) {
    throw new Error("Inverted index not available");
  }
  let matches = searchInvertedIndex(index.invertedIndex, index.documents, query, processors, index.config);
  if (index.config.useBM25) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    matches = calculateBM25Scores(matches, queryTerms, index.invertedIndex, index.documents, index.config);
  }
  let results = matches.map((match) => createSuggestionResult(match, query, threshold, index, options)).filter((result) => result !== null);
  if (options?.filters) {
    results = applyFilters(results, options.filters);
  }
  if (options?.sort) {
    results = applySorting(results, options.sort);
  } else {
    results = results.sort((a, b) => b.score - a.score);
  }
  results = results.slice(0, limit);
  return results;
}
function searchWithPhrases(index, parsedQuery, limit, threshold, options) {
  const config = index.config;
  const useTranspositions = config.features.includes("transpositions");
  const phraseOptions = {
    exactMatch: false,
    maxEditDistance: 1,
    proximityBonus: 1.5,
    maxProximityDistance: 3,
    useTranspositions
  };
  const phraseMatches = /* @__PURE__ */ new Map();
  for (const phrase of parsedQuery.phrases) {
    for (const word of index.base) {
      const match = matchPhrase(word, phrase, phraseOptions);
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
    const processors = config.languages.map((lang) => index.languageProcessors.get(lang)).filter((p) => p !== void 0);
    for (const processor of processors) {
      const normalizedQuery = processor.normalize(termQuery);
      findExactMatches(normalizedQuery, index, termMatches, processor.language);
      findPrefixMatches(normalizedQuery, index, termMatches, processor.language);
      findPhoneticMatches(normalizedQuery, processor, index, termMatches);
      findNgramMatches(normalizedQuery, index, termMatches, processor.language, config.ngramSize);
      if (config.features.includes("missing-letters") || config.features.includes("extra-letters") || config.features.includes("transpositions")) {
        findFuzzyMatches(normalizedQuery, index, termMatches, processor, config);
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
      const result = createSuggestionResult(match, parsedQuery.terms.join(" "), threshold, index, options);
      if (result) {
        result.score *= 0.8;
        combinedResults.set(word, result);
      }
    }
  }
  const results = Array.from(combinedResults.values()).filter((r) => r.score >= threshold).sort((a, b) => b.score - a.score).slice(0, limit);
  if (index._cache) {
    index._cache.set(parsedQuery.original, results, limit, options);
  }
  return results;
}
function updateIndex(index, newItems = [], options = {}) {
  if (!index || !index.config) {
    throw new Error("Invalid index provided");
  }
  if (!newItems || newItems.length === 0) {
    return index;
  }
  const config = index.config;
  const featureSet = new Set(config.features);
  const languageProcessors = Array.from(index.languageProcessors.values());
  if (languageProcessors.length === 0) {
    throw new Error("No language processors found in index");
  }
  const hasFields = index.fields && index.fields.length > 0;
  const isObjectArray = newItems.length > 0 && typeof newItems[0] === "object" && newItems[0] !== null;
  if (isObjectArray && !hasFields) {
    throw new Error("Index was not built with fields, cannot add objects");
  }
  const existingWords = new Set(index.base.map((w) => w.toLowerCase()));
  let processed = 0;
  for (const item of newItems) {
    if (!item) continue;
    if (hasFields && isObjectArray) {
      const fieldValues = extractFieldValues(item, index.fields);
      if (!fieldValues) continue;
      const baseId = Object.values(fieldValues)[0] || `item_${index.base.length + processed}`;
      if (existingWords.has(baseId.toLowerCase())) continue;
      if (index.fieldData) {
        index.fieldData.set(baseId, fieldValues);
      }
      existingWords.add(baseId.toLowerCase());
      index.base.push(baseId);
      for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
        if (!fieldValue || fieldValue.trim().length < config.minQueryLength) continue;
        const trimmedValue = fieldValue.trim();
        for (const processor of languageProcessors) {
          processWordWithProcessorAndField(trimmedValue, baseId, fieldName, processor, index, config, featureSet);
        }
      }
    } else {
      const word = typeof item === "string" ? item : String(item);
      if (word.trim().length < config.minQueryLength) continue;
      const trimmedWord = word.trim();
      if (existingWords.has(trimmedWord.toLowerCase())) continue;
      existingWords.add(trimmedWord.toLowerCase());
      index.base.push(trimmedWord);
      for (const processor of languageProcessors) {
        processWordWithProcessor(trimmedWord, processor, index, config, featureSet);
      }
    }
    processed++;
    if (options.onProgress) {
      options.onProgress(processed, newItems.length);
    }
  }
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
  if (index._cache) {
    index._cache.clear();
  }
  return index;
}
function removeFromIndex(index, itemsToRemove = []) {
  if (!index || !index.config) {
    throw new Error("Invalid index provided");
  }
  if (!itemsToRemove || itemsToRemove.length === 0) {
    return index;
  }
  const toRemove = new Set(itemsToRemove.map((item) => item.toLowerCase()));
  index.base = index.base.filter((word) => !toRemove.has(word.toLowerCase()));
  for (const [variant, baseWords] of index.variantToBase.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.variantToBase.delete(variant);
    } else {
      index.variantToBase.set(variant, filtered);
    }
  }
  for (const [phonetic, baseWords] of index.phoneticToBase.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.phoneticToBase.delete(phonetic);
    } else {
      index.phoneticToBase.set(phonetic, filtered);
    }
  }
  for (const [ngram, baseWords] of index.ngramIndex.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.ngramIndex.delete(ngram);
    } else {
      index.ngramIndex.set(ngram, filtered);
    }
  }
  for (const [synonym, baseWords] of index.synonymMap.entries()) {
    const filtered = new Set(Array.from(baseWords).filter((word) => !toRemove.has(word.toLowerCase())));
    if (filtered.size === 0) {
      index.synonymMap.delete(synonym);
    } else {
      index.synonymMap.set(synonym, filtered);
    }
  }
  if (index.fieldData) {
    for (const item of itemsToRemove) {
      index.fieldData.delete(item);
    }
  }
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
  if (index._cache) {
    index._cache.clear();
  }
  return index;
}
export {
  batchSearch,
  buildFuzzyIndex,
  getSuggestions,
  removeFromIndex,
  updateIndex
};
//# sourceMappingURL=index.js.map
