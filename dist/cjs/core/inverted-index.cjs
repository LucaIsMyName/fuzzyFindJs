"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const levenshtein = require("../algorithms/levenshtein.cjs");
const trie = require("./trie.cjs");
const bm25 = require("../algorithms/bm25.cjs");
const bloomFilter = require("../algorithms/bloom-filter.cjs");
function buildInvertedIndex(words, languageProcessors, config, featureSet) {
  const documents = [];
  const invertedIndex = {
    termToPostings: /* @__PURE__ */ new Map(),
    termTrie: new trie.Trie(),
    // Initialize Trie for fast prefix matching
    phoneticToPostings: /* @__PURE__ */ new Map(),
    ngramToPostings: /* @__PURE__ */ new Map(),
    synonymToPostings: /* @__PURE__ */ new Map(),
    fieldIndices: /* @__PURE__ */ new Map(),
    totalDocs: 0,
    avgDocLength: 0
  };
  let totalLength = 0;
  let docId = 0;
  for (const word of words) {
    if (!word || word.trim().length < config.minQueryLength) continue;
    const trimmedWord = word.trim();
    for (const processor of languageProcessors) {
      const normalized = processor.normalize(trimmedWord);
      const phoneticCode = featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic") ? processor.getPhoneticCode(trimmedWord) : void 0;
      const compoundParts = featureSet.has("compound") && processor.supportedFeatures.includes("compound") ? processor.splitCompoundWords(trimmedWord) : void 0;
      const doc = {
        id: docId,
        word: trimmedWord,
        normalized,
        phoneticCode,
        language: processor.language,
        compoundParts: compoundParts && compoundParts.length > 1 ? compoundParts : void 0
      };
      documents.push(doc);
      totalLength += normalized.length;
      addToPostingList(invertedIndex.termToPostings, normalized, docId);
      invertedIndex.termTrie.insert(normalized, [docId]);
      const lowerWord = trimmedWord.toLowerCase();
      addToPostingList(invertedIndex.termToPostings, lowerWord, docId);
      invertedIndex.termTrie.insert(lowerWord, [docId]);
      if (featureSet.has("partial-words")) {
        const variants = processor.getWordVariants(trimmedWord);
        variants.forEach((variant) => {
          addToPostingList(invertedIndex.termToPostings, variant, docId);
          invertedIndex.termTrie.insert(variant, [docId]);
        });
      }
      if (phoneticCode) {
        addToPostingList(invertedIndex.phoneticToPostings, phoneticCode, docId);
      }
      const ngrams = levenshtein.generateNgrams(normalized, config.ngramSize);
      ngrams.forEach((ngram) => {
        addToPostingList(invertedIndex.ngramToPostings, ngram, docId);
      });
      if (compoundParts && compoundParts.length > 1) {
        compoundParts.forEach((part) => {
          const normalizedPart = processor.normalize(part);
          addToPostingList(invertedIndex.termToPostings, normalizedPart, docId);
          invertedIndex.termTrie.insert(normalizedPart, [docId]);
        });
      }
      if (featureSet.has("synonyms")) {
        const synonyms = processor.getSynonyms(normalized);
        synonyms.forEach((synonym) => {
          addToPostingList(invertedIndex.synonymToPostings, synonym, docId);
        });
        if (config.customSynonyms) {
          const customSynonyms = config.customSynonyms[normalized];
          if (customSynonyms) {
            customSynonyms.forEach((synonym) => {
              addToPostingList(invertedIndex.synonymToPostings, synonym, docId);
            });
          }
        }
      }
      docId++;
    }
  }
  invertedIndex.totalDocs = docId;
  invertedIndex.avgDocLength = totalLength / Math.max(1, docId);
  if (config.useBM25) {
    const documentFrequencies = /* @__PURE__ */ new Map();
    const documentLengths = /* @__PURE__ */ new Map();
    for (const [term, posting] of invertedIndex.termToPostings.entries()) {
      documentFrequencies.set(term, posting.docIds.length);
    }
    documents.forEach((doc) => {
      documentLengths.set(doc.id, doc.normalized.length);
    });
    invertedIndex.bm25Stats = {
      documentFrequencies,
      documentLengths
    };
  }
  const shouldUseBloomFilter = config.useBloomFilter || words.length >= 1e4;
  if (shouldUseBloomFilter) {
    const falsePositiveRate = config.bloomFilterFalsePositiveRate || 0.01;
    const bloomFilter$1 = new bloomFilter.BloomFilter({
      expectedElements: invertedIndex.termToPostings.size,
      falsePositiveRate
    });
    for (const term of invertedIndex.termToPostings.keys()) {
      bloomFilter$1.add(term);
    }
    invertedIndex.bloomFilter = bloomFilter$1;
  }
  return { invertedIndex, documents };
}
function searchInvertedIndex(invertedIndex, documents, query, processors, config) {
  const matches = /* @__PURE__ */ new Map();
  const featureSet = new Set(config.features);
  for (const processor of processors) {
    const normalizedQuery = processor.normalize(query.trim());
    findExactMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor.language);
    findPrefixMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor.language);
    if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
      findPhoneticMatchesInverted(normalizedQuery, processor, invertedIndex, documents, matches);
    }
    if (featureSet.has("synonyms")) {
      findSynonymMatchesInverted(normalizedQuery, invertedIndex, documents, matches);
    }
    findNgramMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor.language, config.ngramSize);
    const shouldSkipFuzzy = config.performance === "fast" && invertedIndex.termToPostings.size > 1e5 && matches.size >= config.maxResults * 2;
    if (!shouldSkipFuzzy && (featureSet.has("missing-letters") || featureSet.has("extra-letters") || featureSet.has("transpositions"))) {
      findFuzzyMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor, config.maxEditDistance, config);
    }
  }
  return Array.from(matches.values());
}
function addToPostingList(postings, term, docId) {
  let posting = postings.get(term);
  if (!posting) {
    posting = { term, docIds: [] };
    postings.set(term, posting);
  }
  if (!posting.docIds.includes(docId)) {
    posting.docIds.push(docId);
  }
}
function findExactMatchesInverted(query, invertedIndex, documents, matches, language) {
  if (invertedIndex.bloomFilter && !invertedIndex.bloomFilter.mightContain(query)) {
    return;
  }
  const posting = invertedIndex.termToPostings.get(query);
  if (!posting) return;
  posting.docIds.forEach((docId) => {
    const doc = documents[docId];
    if (!doc) return;
    if (!matches.has(docId)) {
      matches.set(docId, {
        word: doc.word,
        normalized: query,
        matchType: "exact",
        editDistance: 0,
        language,
        docId
      });
    }
  });
}
function findPrefixMatchesInverted(query, invertedIndex, documents, matches, language) {
  if (invertedIndex.termTrie) {
    const prefixMatches = invertedIndex.termTrie.findWithPrefix(query);
    for (const [term, docIds] of prefixMatches) {
      if (term !== query) {
        docIds.forEach((docId) => {
          const doc = documents[docId];
          if (!doc) return;
          if (!matches.has(docId)) {
            matches.set(docId, {
              word: doc.word,
              normalized: term,
              matchType: "prefix",
              language,
              docId
            });
          }
        });
      }
    }
  } else {
    for (const [term, posting] of invertedIndex.termToPostings.entries()) {
      if (term.startsWith(query) && term !== query) {
        posting.docIds.forEach((docId) => {
          const doc = documents[docId];
          if (!doc) return;
          if (!matches.has(docId)) {
            matches.set(docId, {
              word: doc.word,
              normalized: term,
              matchType: "prefix",
              language,
              docId
            });
          }
        });
      }
    }
  }
}
function findPhoneticMatchesInverted(query, processor, invertedIndex, documents, matches) {
  const phoneticCode = processor.getPhoneticCode(query);
  if (!phoneticCode) return;
  const posting = invertedIndex.phoneticToPostings.get(phoneticCode);
  if (!posting) return;
  posting.docIds.forEach((docId) => {
    const doc = documents[docId];
    if (!doc) return;
    if (!matches.has(docId)) {
      matches.set(docId, {
        word: doc.word,
        normalized: query,
        matchType: "phonetic",
        phoneticCode,
        language: processor.language,
        docId
      });
    }
  });
}
function findSynonymMatchesInverted(query, invertedIndex, documents, matches) {
  const posting = invertedIndex.synonymToPostings.get(query);
  if (!posting) return;
  posting.docIds.forEach((docId) => {
    const doc = documents[docId];
    if (!doc) return;
    if (!matches.has(docId)) {
      matches.set(docId, {
        word: doc.word,
        normalized: query,
        matchType: "synonym",
        language: "synonym",
        docId
      });
    }
  });
}
function findNgramMatchesInverted(query, invertedIndex, documents, matches, language, ngramSize) {
  if (query.length < ngramSize) return;
  const queryNgrams = levenshtein.generateNgrams(query, ngramSize);
  const candidateDocs = /* @__PURE__ */ new Set();
  queryNgrams.forEach((ngram) => {
    const posting = invertedIndex.ngramToPostings.get(ngram);
    if (posting) {
      posting.docIds.forEach((docId) => candidateDocs.add(docId));
    }
  });
  candidateDocs.forEach((docId) => {
    const doc = documents[docId];
    if (!doc) return;
    if (!matches.has(docId)) {
      matches.set(docId, {
        word: doc.word,
        normalized: query,
        matchType: "ngram",
        language,
        docId
      });
    }
  });
}
function findFuzzyMatchesInverted(query, invertedIndex, documents, matches, processor, maxDistance, config) {
  const queryLen = query.length;
  const minLen = queryLen - maxDistance;
  const maxLen = queryLen + maxDistance;
  const useTranspositions = config.features?.includes("transpositions");
  const datasetSize = invertedIndex.termToPostings.size;
  const MAX_FUZZY_CANDIDATES = datasetSize > 1e5 ? 1e3 : datasetSize > 5e4 ? 1500 : datasetSize > 2e4 ? 3e3 : datasetSize > 1e4 ? 5e3 : 8e3;
  let candidatesChecked = 0;
  let termsArray;
  if (datasetSize > 5e4 && query.length >= 2 && invertedIndex.termTrie) {
    const prefixLength = datasetSize > 1e5 ? Math.min(3, query.length) : Math.min(2, query.length);
    const prefix = query.substring(0, prefixLength);
    const prefixMatches = invertedIndex.termTrie.findWithPrefix(prefix);
    termsArray = prefixMatches.map(([term, _docIds]) => [term, invertedIndex.termToPostings.get(term)]).filter((entry) => entry[1] !== void 0);
    if (termsArray.length < 100) {
      termsArray = Array.from(invertedIndex.termToPostings.entries());
    }
  } else {
    termsArray = Array.from(invertedIndex.termToPostings.entries());
  }
  termsArray.sort((a, b) => {
    const aDiff = Math.abs(a[0].length - queryLen);
    const bDiff = Math.abs(b[0].length - queryLen);
    return aDiff - bDiff;
  });
  for (const [term, posting] of termsArray) {
    const termLen = term.length;
    if (termLen < minLen || termLen > maxLen) {
      continue;
    }
    if (candidatesChecked >= MAX_FUZZY_CANDIDATES) {
      break;
    }
    candidatesChecked++;
    const earlyTerminationThreshold = datasetSize > 5e4 ? config.maxResults * 2 : config.maxResults * 3;
    if (matches.size >= earlyTerminationThreshold) {
      break;
    }
    if (query.length > 0 && term.length > 0) {
      const firstCharDiff = Math.abs(query.charCodeAt(0) - term.charCodeAt(0));
      if (firstCharDiff > 10 && maxDistance < 2) {
        continue;
      }
    }
    const distance = useTranspositions ? levenshtein.calculateDamerauLevenshteinDistance(query, term, maxDistance) : levenshtein.calculateLevenshteinDistance(query, term, maxDistance);
    if (distance <= maxDistance) {
      posting.docIds.forEach((docId) => {
        const doc = documents[docId];
        if (!doc) return;
        const existingMatch = matches.get(docId);
        if (!existingMatch || (existingMatch.editDistance || Infinity) > distance) {
          matches.set(docId, {
            word: doc.word,
            normalized: term,
            matchType: "fuzzy",
            editDistance: distance,
            language: processor.language,
            docId
          });
        }
      });
    }
  }
}
function calculateBM25Scores(matches, queryTerms, invertedIndex, documents, config) {
  if (!config.useBM25 || !invertedIndex.bm25Stats) {
    return matches;
  }
  const bm25Config = {
    ...bm25.DEFAULT_BM25_CONFIG,
    ...config.bm25Config
  };
  const corpusStats = {
    totalDocs: invertedIndex.totalDocs,
    avgDocLength: invertedIndex.avgDocLength,
    documentFrequencies: invertedIndex.bm25Stats.documentFrequencies
  };
  return matches.map((match) => {
    if (match.docId === void 0) {
      return match;
    }
    const doc = documents[match.docId];
    if (!doc) {
      return match;
    }
    const termFrequencies = /* @__PURE__ */ new Map();
    const normalizedTerms = doc.normalized.toLowerCase().split(/\s+/);
    for (const term of normalizedTerms) {
      termFrequencies.set(term, (termFrequencies.get(term) || 0) + 1);
    }
    const docStats = {
      docId: doc.id,
      length: normalizedTerms.length,
      termFrequencies
    };
    const bm25Score = bm25.calculateBM25Score(queryTerms, docStats, corpusStats, bm25Config);
    const normalizedBM25 = bm25.normalizeBM25Score(bm25Score);
    return {
      ...match,
      bm25Score: normalizedBM25
    };
  });
}
exports.buildInvertedIndex = buildInvertedIndex;
exports.calculateBM25Scores = calculateBM25Scores;
exports.searchInvertedIndex = searchInvertedIndex;
//# sourceMappingURL=inverted-index.cjs.map
