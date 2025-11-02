/**
 * Inverted Index Implementation
 * Optimized for large datasets (1M+ words)
 *
 * Architecture:
 * - Token → [docId1, docId2, ...] (posting lists)
 * - Fast intersection/union operations
 * - BM25-like scoring for relevance
 * - Parallel to existing hash-based index (backwards compatible)
 */

import type {
  //
  InvertedIndex,
  DocumentMetadata,
  PostingList,
  FuzzyConfig,
  LanguageProcessor,
  SearchMatch,
} from "./types.js";
import {
  //
  calculateLevenshteinDistance,
  calculateDamerauLevenshteinDistance,
} from "../algorithms/levenshtein.js";

/**
 * Build inverted index from documents
 * This runs ALONGSIDE the existing index building
 */
export function buildInvertedIndex(words: string[], languageProcessors: LanguageProcessor[], config: FuzzyConfig, featureSet: Set<string>): { invertedIndex: InvertedIndex; documents: DocumentMetadata[] } {
  const documents: DocumentMetadata[] = [];
  const invertedIndex: InvertedIndex = {
    termToPostings: new Map(),
    phoneticToPostings: new Map(),
    ngramToPostings: new Map(),
    synonymToPostings: new Map(),
    fieldIndices: new Map(),
    totalDocs: 0,
    avgDocLength: 0,
  };

  let totalLength = 0;
  let docId = 0;

  // Build documents and posting lists
  for (const word of words) {
    if (!word || word.trim().length < config.minQueryLength) continue;

    const trimmedWord = word.trim();

    // Process with each language processor
    for (const processor of languageProcessors) {
      const normalized = processor.normalize(trimmedWord);
      const phoneticCode = featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic") ? processor.getPhoneticCode(trimmedWord) : undefined;

      const compoundParts = featureSet.has("compound") && processor.supportedFeatures.includes("compound") ? processor.splitCompoundWords(trimmedWord) : undefined;

      // Create document metadata
      const doc: DocumentMetadata = {
        id: docId,
        word: trimmedWord,
        normalized,
        phoneticCode,
        language: processor.language,
        compoundParts: compoundParts && compoundParts.length > 1 ? compoundParts : undefined,
      };

      documents.push(doc);
      totalLength += normalized.length;

      // Index the normalized term
      addToPostingList(invertedIndex.termToPostings, normalized, docId);

      // Index original word (for exact matching)
      addToPostingList(invertedIndex.termToPostings, trimmedWord.toLowerCase(), docId);

      // Index word variants (prefixes)
      if (featureSet.has("partial-words")) {
        const variants = processor.getWordVariants(trimmedWord);
        variants.forEach((variant) => {
          addToPostingList(invertedIndex.termToPostings, variant, docId);
        });
      }

      // Index phonetic code
      if (phoneticCode) {
        addToPostingList(invertedIndex.phoneticToPostings, phoneticCode, docId);
      }

      // Index n-grams
      const ngrams = generateNgrams(normalized, config.ngramSize);
      ngrams.forEach((ngram) => {
        addToPostingList(invertedIndex.ngramToPostings, ngram, docId);
      });

      // Index compound parts
      if (compoundParts && compoundParts.length > 1) {
        compoundParts.forEach((part) => {
          const normalizedPart = processor.normalize(part);
          addToPostingList(invertedIndex.termToPostings, normalizedPart, docId);
        });
      }

      // Index synonyms
      if (featureSet.has("synonyms")) {
        const synonyms = processor.getSynonyms(normalized);
        synonyms.forEach((synonym) => {
          addToPostingList(invertedIndex.synonymToPostings, synonym, docId);
        });

        // Custom synonyms
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

/**
 * Search using inverted index
 * Much faster than hash-based approach for large datasets
 */
export function searchInvertedIndex(invertedIndex: InvertedIndex, documents: DocumentMetadata[], query: string, processors: LanguageProcessor[], config: FuzzyConfig): SearchMatch[] {
  const matches = new Map<number, SearchMatch>();
  const featureSet = new Set(config.features);

  // Process query with each language processor
  for (const processor of processors) {
    const normalizedQuery = processor.normalize(query.trim());

    // 1. Exact term lookup (fastest)
    findExactMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor.language);

    // 2. Prefix matches
    findPrefixMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor.language);

    // 3. Phonetic matches
    if (featureSet.has("phonetic") && processor.supportedFeatures.includes("phonetic")) {
      findPhoneticMatchesInverted(normalizedQuery, processor, invertedIndex, documents, matches);
    }

    // 4. Synonym matches
    if (featureSet.has("synonyms")) {
      findSynonymMatchesInverted(normalizedQuery, invertedIndex, documents, matches);
    }

    // 5. N-gram matches
    findNgramMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor.language, config.ngramSize);

    // 6. Fuzzy matches (most expensive, do last)
    if (featureSet.has("missing-letters") || featureSet.has("extra-letters") || featureSet.has("transpositions")) {
      findFuzzyMatchesInverted(normalizedQuery, invertedIndex, documents, matches, processor, config.maxEditDistance, config);
    }
  }

  // Convert to array and return
  return Array.from(matches.values());
}

/**
 * Helper: Add document to posting list
 */
function addToPostingList(postings: Map<string, PostingList>, term: string, docId: number): void {
  let posting = postings.get(term);
  if (!posting) {
    posting = { term, docIds: [] };
    postings.set(term, posting);
  }

  // Avoid duplicates
  if (!posting.docIds.includes(docId)) {
    posting.docIds.push(docId);
  }
}

/**
 * Helper: Generate n-grams
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
 * Find exact matches in inverted index
 */
function findExactMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, language: string): void {
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
      });
    }
  });
}

/**
 * Find prefix matches in inverted index
 */
function findPrefixMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, language: string): void {
  // Iterate through all terms and check for prefix
  // Note: This could be optimized with a Trie, but for now we keep it simple
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
          });
        }
      });
    }
  }
}

/**
 * Find phonetic matches in inverted index
 */
function findPhoneticMatchesInverted(query: string, processor: LanguageProcessor, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>): void {
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
      });
    }
  });
}

/**
 * Find synonym matches in inverted index
 */
function findSynonymMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>): void {
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
      });
    }
  });
}

/**
 * Find n-gram matches in inverted index
 */
function findNgramMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, language: string, ngramSize: number): void {
  if (query.length < ngramSize) return;

  const queryNgrams = generateNgrams(query, ngramSize);
  const candidateDocs = new Set<number>();

  // Collect all documents that contain at least one n-gram
  queryNgrams.forEach((ngram) => {
    const posting = invertedIndex.ngramToPostings.get(ngram);
    if (posting) {
      posting.docIds.forEach((docId) => candidateDocs.add(docId));
    }
  });

  // Add to matches
  candidateDocs.forEach((docId) => {
    const doc = documents[docId];
    if (!doc) return;

    if (!matches.has(docId)) {
      matches.set(docId, {
        word: doc.word,
        normalized: query,
        matchType: "ngram",
        language,
      });
    }
  });
}

/**
 * Find fuzzy matches in inverted index
 * This is still O(n) but with better cache locality
 */
function findFuzzyMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, processor: LanguageProcessor, maxDistance: number, config: FuzzyConfig): void {
  // Iterate through all terms
  for (const [term, posting] of invertedIndex.termToPostings.entries()) {
    // Quick length check
    if (Math.abs(term.length - query.length) > maxDistance) continue;

    // Use Damerau-Levenshtein if transpositions feature is enabled
    const useTranspositions = config.features?.includes('transpositions');
    const distance = useTranspositions
      ? calculateDamerauLevenshteinDistance(query, term, maxDistance)
      : calculateLevenshteinDistance(query, term, maxDistance);
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
          });
        }
      });
    }
  }
}
