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
  const processedWords = /* @__PURE__ */ new Set();
  let processed = 0;
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
  const shouldUseInvertedIndex = options.useInvertedIndex || config$1.useInvertedIndex || config$1.useBM25 || config$1.useBloomFilter || words.length >= 1e4;
  if (shouldUseInvertedIndex) {
    const { invertedIndex: invertedIndex$1, documents } = invertedIndex.buildInvertedIndex(words, languageProcessors, config$1, featureSet);
    index$12.invertedIndex = invertedIndex$1;
    index$12.documents = documents;
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
  addToVariantMap(index2.variantToBase, normalized, word);
  addToVariantMap(index2.variantToBase, word.toLowerCase(), word);
  addToVariantMap(index2.variantToBase, word, word);
  const accentFreeWord = accentNormalization.removeAccents(word);
  if (accentFreeWord !== word) {
    addToVariantMap(index2.variantToBase, accentFreeWord, word);
    addToVariantMap(index2.variantToBase, accentFreeWord.toLowerCase(), word);
    const normalizedAccentFree = processor.normalize(accentFreeWord);
    if (normalizedAccentFree !== accentFreeWord.toLowerCase()) {
      addToVariantMap(index2.variantToBase, normalizedAccentFree, word);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(word);
    variants.forEach((variant) => {
      addToVariantMap(index2.variantToBase, variant, word);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(word);
    if (phoneticCode) {
      addToVariantMap(index2.phoneticToBase, phoneticCode, word);
    }
  }
  const ngrams = generateNgrams(normalized, config2.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMap(index2.ngramIndex, ngram, word);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const compoundParts = processor.splitCompoundWords(word);
    compoundParts.forEach((part) => {
      if (part !== word) {
        addToVariantMap(index2.variantToBase, processor.normalize(part), word);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMap(index2.synonymMap, synonym, word);
    });
    if (config2.customSynonyms) {
      const customSynonyms = config2.customSynonyms[normalized];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMap(index2.synonymMap, synonym, word);
        });
      }
    }
  }
}
function processWordWithProcessorAndField(fieldValue, baseId, fieldName, processor, index2, config2, featureSet) {
  const normalized = processor.normalize(fieldValue);
  addToVariantMapWithField(index2.variantToBase, normalized, baseId);
  addToVariantMapWithField(index2.variantToBase, fieldValue.toLowerCase(), baseId);
  addToVariantMapWithField(index2.variantToBase, fieldValue, baseId);
  const accentFreeWord = accentNormalization.removeAccents(fieldValue);
  if (accentFreeWord !== fieldValue) {
    addToVariantMapWithField(index2.variantToBase, accentFreeWord, baseId);
    addToVariantMapWithField(index2.variantToBase, accentFreeWord.toLowerCase(), baseId);
    const normalizedAccentFree = processor.normalize(accentFreeWord);
    if (normalizedAccentFree !== accentFreeWord.toLowerCase()) {
      addToVariantMapWithField(index2.variantToBase, normalizedAccentFree, baseId);
    }
  }
  if (featureSet.has("partial-words")) {
    const variants = processor.getWordVariants(fieldValue);
    variants.forEach((variant) => {
      addToVariantMapWithField(index2.variantToBase, variant, baseId);
    });
  }
  if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
    const phoneticCode = processor.getPhoneticCode(fieldValue);
    if (phoneticCode) {
      addToVariantMapWithField(index2.phoneticToBase, phoneticCode, baseId);
    }
  }
  const ngrams = generateNgrams(normalized, config2.ngramSize);
  ngrams.forEach((ngram) => {
    addToVariantMapWithField(index2.ngramIndex, ngram, baseId);
  });
  if (featureSet.has("compound") && processor.supportedFeatures.includes("compound")) {
    const parts = processor.splitCompoundWords(fieldValue);
    parts.forEach((part) => {
      if (part.length >= config2.minQueryLength) {
        addToVariantMapWithField(index2.variantToBase, part, baseId);
        addToVariantMapWithField(index2.variantToBase, processor.normalize(part), baseId);
      }
    });
  }
  if (featureSet.has("synonyms")) {
    const synonyms = processor.getSynonyms(normalized);
    synonyms.forEach((synonym) => {
      addToVariantMapWithField(index2.synonymMap, synonym, baseId);
    });
    if (config2.customSynonyms) {
      const customSynonyms = config2.customSynonyms[normalized];
      if (customSynonyms) {
        customSynonyms.forEach((synonym) => {
          addToVariantMapWithField(index2.synonymMap, synonym, baseId);
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
    findPrefixMatches(normalizedQuery, index2, matches, processor.language);
    findPhoneticMatches(normalizedQuery, processor, index2, matches);
    findSynonymMatches(normalizedQuery, index2, matches);
    findNgramMatches(normalizedQuery, index2, matches, processor.language, config2.ngramSize);
    if (config2.features.includes("missing-letters") || config2.features.includes("extra-letters") || config2.features.includes("transpositions")) {
      findFuzzyMatches(normalizedQuery, index2, matches, processor, config2);
    }
  }
  const results = Array.from(matches.values()).map((match) => createSuggestionResult(match, processedQuery, threshold, index2, options)).filter((result) => result !== null).sort((a, b) => b.score - a.score).slice(0, limit);
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
  const exactMatches = index2.variantToBase.get(query);
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
  for (const [variant, words] of index2.variantToBase.entries()) {
    if (variant.startsWith(query) && variant !== query) {
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
  const synonymMatches = index2.synonymMap.get(query);
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
  const maxDistance = config2.maxEditDistance;
  for (const [variant, words] of index2.variantToBase.entries()) {
    if (Math.abs(variant.length - query.length) <= maxDistance) {
      const useTranspositions = index2.config.features?.includes("transpositions");
      const distance = useTranspositions ? levenshtein.calculateDamerauLevenshteinDistance(query, variant, maxDistance) : levenshtein.calculateLevenshteinDistance(query, variant, maxDistance);
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
function createSuggestionResult(match, originalQuery, threshold, index2, options) {
  let score = calculateMatchScore(match, originalQuery);
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
      score = levenshtein.calculateNgramSimilarity(query.toLowerCase(), match.normalized, 3) * 0.8;
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
function getSuggestionsInverted(index2, query, limit, threshold, processors, options) {
  if (!index2.invertedIndex || !index2.documents) {
    throw new Error("Inverted index not available");
  }
  let matches = invertedIndex.searchInvertedIndex(index2.invertedIndex, index2.documents, query, processors, index2.config);
  if (index2.config.useBM25) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    matches = invertedIndex.calculateBM25Scores(matches, queryTerms, index2.invertedIndex, index2.documents, index2.config);
  }
  const results = matches.map((match) => createSuggestionResult(match, query, threshold, index2, options)).filter((result) => result !== null).sort((a, b) => b.score - a.score).slice(0, limit);
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
exports.batchSearch = batchSearch;
exports.buildFuzzyIndex = buildFuzzyIndex;
exports.getSuggestions = getSuggestions;
//# sourceMappingURL=index.cjs.map
