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

import type { InvertedIndex, DocumentMetadata, PostingList, FuzzyConfig, LanguageProcessor, SearchMatch } from "./types.js";
import { generateNgrams, calculateLevenshteinDistance, calculateDamerauLevenshteinDistance } from "../algorithms/levenshtein.js";
import { Trie } from "./trie.js";
import { calculateBM25Score, normalizeBM25Score, DEFAULT_BM25_CONFIG, type DocumentStats, type CorpusStats } from "../algorithms/bm25.js";
import { BloomFilter } from "../algorithms/bloom-filter.js";

/**
 * Build inverted index from documents
 * This runs ALONGSIDE the existing index building
 */
export function buildInvertedIndex(words: string[], languageProcessors: LanguageProcessor[], config: FuzzyConfig, featureSet: Set<string>): { invertedIndex: InvertedIndex; documents: DocumentMetadata[] } {
  const documents: DocumentMetadata[] = [];
  const invertedIndex: InvertedIndex = {
    termToPostings: new Map(),
    termTrie: new Trie(), // Initialize Trie for fast prefix matching
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
      invertedIndex.termTrie!.insert(normalized, [docId]);

      // Index original word (for exact matching)
      const lowerWord = trimmedWord.toLowerCase();
      addToPostingList(invertedIndex.termToPostings, lowerWord, docId);
      invertedIndex.termTrie!.insert(lowerWord, [docId]);

      // Index word variants (prefixes)
      if (featureSet.has("partial-words")) {
        const variants = processor.getWordVariants(trimmedWord);
        variants.forEach((variant) => {
          addToPostingList(invertedIndex.termToPostings, variant, docId);
          invertedIndex.termTrie!.insert(variant, [docId]);
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
          invertedIndex.termTrie!.insert(normalizedPart, [docId]);
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

  // Build BM25 statistics if enabled
  if (config.useBM25) {
    const documentFrequencies = new Map<string, number>();
    const documentLengths = new Map<number, number>();

    // Calculate document frequencies (how many docs contain each term)
    for (const [term, posting] of invertedIndex.termToPostings.entries()) {
      documentFrequencies.set(term, posting.docIds.length);
    }

    // Store document lengths
    documents.forEach((doc) => {
      documentLengths.set(doc.id, doc.normalized.length);
    });

    invertedIndex.bm25Stats = {
      documentFrequencies,
      documentLengths,
    };
  }

  // Build Bloom Filter if enabled or auto-enable for large datasets
  const shouldUseBloomFilter = config.useBloomFilter || words.length >= 10000;
  
  if (shouldUseBloomFilter) {
    const falsePositiveRate = config.bloomFilterFalsePositiveRate || 0.01;
    const bloomFilter = new BloomFilter({
      expectedElements: invertedIndex.termToPostings.size,
      falsePositiveRate,
    });
    
    // Add all terms to bloom filter
    for (const term of invertedIndex.termToPostings.keys()) {
      bloomFilter.add(term);
    }
    
    invertedIndex.bloomFilter = bloomFilter;
  }

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
    // OPTIMIZATION: Skip fuzzy matching for very large datasets in fast mode if we have enough good matches
    const shouldSkipFuzzy = config.performance === 'fast' && 
                           invertedIndex.termToPostings.size > 100000 && 
                           matches.size >= config.maxResults * 2;
    
    if (!shouldSkipFuzzy && (featureSet.has("missing-letters") || featureSet.has("extra-letters") || featureSet.has("transpositions"))) {
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
 * Find exact matches in inverted index
 */
function findExactMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, language: string): void {
  // BLOOM FILTER: Fast negative lookup
  if (invertedIndex.bloomFilter && !invertedIndex.bloomFilter.mightContain(query)) {
    return; // Definitely not in index, skip expensive lookup
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
        docId,
      });
    }
  });
}

/**
 * Find prefix matches in inverted index
 * Now uses Trie for O(k) lookup instead of O(n) iteration!
 */
function findPrefixMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, language: string): void {
  // Use Trie for fast prefix matching (100-1000x faster!)
  if (invertedIndex.termTrie) {
    const prefixMatches = invertedIndex.termTrie.findWithPrefix(query);
    
    for (const [term, docIds] of prefixMatches) {
      if (term !== query) { // Exclude exact matches (handled separately)
        docIds.forEach((docId: number) => {
          const doc = documents[docId];
          if (!doc) return;

          if (!matches.has(docId)) {
            matches.set(docId, {
              word: doc.word,
              normalized: term,
              matchType: "prefix",
              language,
              docId,
            });
          }
        });
      }
    }
  } else {
    // Fallback to old O(n) method if Trie not available
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
              docId,
            });
          }
        });
      }
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
        docId,
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
        docId,
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
        docId,
      });
    }
  });
}

/**
 * Find fuzzy matches in inverted index
 * Optimized with length-based pre-filtering (5-10x faster)
 */
function findFuzzyMatchesInverted(query: string, invertedIndex: InvertedIndex, documents: DocumentMetadata[], matches: Map<number, SearchMatch>, processor: LanguageProcessor, maxDistance: number, config: FuzzyConfig): void {
  const queryLen = query.length;
  const minLen = queryLen - maxDistance;
  const maxLen = queryLen + maxDistance;
  
  // Pre-compute for performance
  const useTranspositions = config.features?.includes('transpositions');
  
  // OPTIMIZATION: Dynamic candidate limit based on dataset size
  // Smaller limit for larger datasets to maintain sub-10ms performance
  const datasetSize = invertedIndex.termToPostings.size;
  const MAX_FUZZY_CANDIDATES = datasetSize > 100000 ? 1000 :
                               datasetSize > 50000 ? 1500 : 
                               datasetSize > 20000 ? 3000 : 
                               datasetSize > 10000 ? 5000 : 8000;
  let candidatesChecked = 0;
  
  // OPTIMIZATION: For very large datasets (50K+), use Trie prefix filtering first
  let termsArray: [string, PostingList][];
  
  if (datasetSize > 50000 && query.length >= 2) {
    // Get prefix matches from Trie (much faster than iterating all terms)
    // Use longer prefix for 100K+ datasets for better filtering
    const prefixLength = datasetSize > 100000 ? Math.min(3, query.length) : Math.min(2, query.length);
    const prefix = query.substring(0, prefixLength);
    const prefixMatches = invertedIndex.termTrie.search(prefix);
    
    // Only check terms that share a prefix with the query
    termsArray = prefixMatches
      .map((term: string) => [term, invertedIndex.termToPostings.get(term)] as [string, PostingList | undefined])
      .filter((entry: [string, PostingList | undefined]): entry is [string, PostingList] => entry[1] !== undefined);
    
    // If prefix filtering gives us too few candidates, fall back to full search
    if (termsArray.length < 100) {
      termsArray = Array.from(invertedIndex.termToPostings.entries());
    }
  } else {
    termsArray = Array.from(invertedIndex.termToPostings.entries());
  }
  
  // Sort by length similarity for better early termination
  termsArray.sort((a, b) => {
    const aDiff = Math.abs(a[0].length - queryLen);
    const bDiff = Math.abs(b[0].length - queryLen);
    return aDiff - bDiff;
  });
  
  // Iterate through sorted terms with optimized filtering
  for (const [term, posting] of termsArray) {
    // OPTIMIZATION 1: Length-based pre-filter (O(1) check)
    // This eliminates 80-90% of candidates before expensive Levenshtein
    const termLen = term.length;
    if (termLen < minLen || termLen > maxLen) {
      continue;
    }
    
    // OPTIMIZATION 2: Limit candidates in large datasets
    if (candidatesChecked >= MAX_FUZZY_CANDIDATES) {
      break;
    }
    candidatesChecked++;
    
    // OPTIMIZATION 3: Early termination if we have enough high-quality matches
    // More aggressive for large datasets
    const earlyTerminationThreshold = datasetSize > 50000 ? config.maxResults * 2 : config.maxResults * 3;
    if (matches.size >= earlyTerminationThreshold) {
      break;
    }
    
    // OPTIMIZATION 4: Skip if first character is too different (cheap check)
    if (query.length > 0 && term.length > 0) {
      const firstCharDiff = Math.abs(query.charCodeAt(0) - term.charCodeAt(0));
      if (firstCharDiff > 10 && maxDistance < 2) { // Allow more variance for higher edit distance
        continue;
      }
    }
    
    // Now do expensive edit distance calculation
    const distance = useTranspositions
      ? calculateDamerauLevenshteinDistance(query, term, maxDistance)
      : calculateLevenshteinDistance(query, term, maxDistance);
      
    if (distance <= maxDistance) {
      posting.docIds.forEach((docId) => {
        const doc = documents[docId];
        if (!doc) return;

        const existingMatch = matches.get(docId);
        // Only update if this is a better match (lower edit distance)
        if (!existingMatch || (existingMatch.editDistance || Infinity) > distance) {
          matches.set(docId, {
            word: doc.word,
            normalized: term,
            matchType: "fuzzy",
            editDistance: distance,
            language: processor.language,
            docId,
          });
        }
      });
    }
  }
}

/**
 * Calculate BM25 scores for search matches
 * Enhances relevance ranking with statistical scoring
 */
export function calculateBM25Scores(
  matches: SearchMatch[],
  queryTerms: string[],
  invertedIndex: InvertedIndex,
  documents: DocumentMetadata[],
  config: FuzzyConfig
): SearchMatch[] {
  if (!config.useBM25 || !invertedIndex.bm25Stats) {
    return matches;
  }

  const bm25Config = {
    ...DEFAULT_BM25_CONFIG,
    ...config.bm25Config,
  };

  // Build corpus stats from inverted index
  const corpusStats: CorpusStats = {
    totalDocs: invertedIndex.totalDocs,
    avgDocLength: invertedIndex.avgDocLength,
    documentFrequencies: invertedIndex.bm25Stats.documentFrequencies,
  };

  // Calculate BM25 score for each match
  return matches.map((match) => {
    if (match.docId === undefined) {
      return match;
    }

    const doc = documents[match.docId];
    if (!doc) {
      return match;
    }

    // Build document stats
    const termFrequencies = new Map<string, number>();
    const normalizedTerms = doc.normalized.toLowerCase().split(/\s+/);
    
    for (const term of normalizedTerms) {
      termFrequencies.set(term, (termFrequencies.get(term) || 0) + 1);
    }

    const docStats: DocumentStats = {
      docId: doc.id,
      length: normalizedTerms.length,
      termFrequencies,
    };

    // Calculate BM25 score
    const bm25Score = calculateBM25Score(queryTerms, docStats, corpusStats, bm25Config);
    const normalizedBM25 = normalizeBM25Score(bm25Score);

    return {
      ...match,
      bm25Score: normalizedBM25,
    };
  });
}
