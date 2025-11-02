import { calculateDamerauLevenshteinDistance, calculateLevenshteinDistance } from "../algorithms/levenshtein.js";
function buildInvertedIndex(words, languageProcessors, config, featureSet) {
  const documents = [];
  const invertedIndex = {
    termToPostings: /* @__PURE__ */ new Map(),
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
      addToPostingList(invertedIndex.termToPostings, trimmedWord.toLowerCase(), docId);
      if (featureSet.has("partial-words")) {
        const variants = processor.getWordVariants(trimmedWord);
        variants.forEach((variant) => {
          addToPostingList(invertedIndex.termToPostings, variant, docId);
        });
      }
      if (phoneticCode) {
        addToPostingList(invertedIndex.phoneticToPostings, phoneticCode, docId);
      }
      const ngrams = generateNgrams(normalized, config.ngramSize);
      ngrams.forEach((ngram) => {
        addToPostingList(invertedIndex.ngramToPostings, ngram, docId);
      });
      if (compoundParts && compoundParts.length > 1) {
        compoundParts.forEach((part) => {
          const normalizedPart = processor.normalize(part);
          addToPostingList(invertedIndex.termToPostings, normalizedPart, docId);
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
    if (featureSet.has("missing-letters") || featureSet.has("extra-letters") || featureSet.has("transpositions")) {
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
function generateNgrams(str, n) {
  if (str.length < n) return [str];
  const ngrams = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}
function findExactMatchesInverted(query, invertedIndex, documents, matches, language) {
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
        language
      });
    }
  });
}
function findPrefixMatchesInverted(query, invertedIndex, documents, matches, language) {
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
            language
          });
        }
      });
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
        language: processor.language
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
        language: "synonym"
      });
    }
  });
}
function findNgramMatchesInverted(query, invertedIndex, documents, matches, language, ngramSize) {
  if (query.length < ngramSize) return;
  const queryNgrams = generateNgrams(query, ngramSize);
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
        language
      });
    }
  });
}
function findFuzzyMatchesInverted(query, invertedIndex, documents, matches, processor, maxDistance, config) {
  for (const [term, posting] of invertedIndex.termToPostings.entries()) {
    if (Math.abs(term.length - query.length) > maxDistance) continue;
    const useTranspositions = config.features?.includes("transpositions");
    const distance = useTranspositions ? calculateDamerauLevenshteinDistance(query, term, maxDistance) : calculateLevenshteinDistance(query, term, maxDistance);
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
            language: processor.language
          });
        }
      });
    }
  }
}
export {
  buildInvertedIndex,
  searchInvertedIndex
};
//# sourceMappingURL=inverted-index.js.map
