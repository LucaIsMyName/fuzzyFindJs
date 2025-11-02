/**
 * BM25 (Best Matching 25) Scoring Algorithm
 * Industry-standard probabilistic ranking function used by search engines
 * 
 * BM25 considers:
 * - Term frequency (TF): How often does the term appear?
 * - Inverse document frequency (IDF): How rare is the term?
 * - Document length normalization: Penalize very long documents
 * 
 * Formula: BM25(D, Q) = Σ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
 * 
 * Where:
 * - D = document
 * - Q = query
 * - qi = query term i
 * - f(qi, D) = frequency of qi in D
 * - |D| = length of document D
 * - avgdl = average document length
 * - k1 = term frequency saturation parameter (default: 1.2)
 * - b = length normalization parameter (default: 0.75)
 */

export interface BM25Config {
  /** Term frequency saturation parameter (typical: 1.2-2.0) */
  k1: number;
  /** Length normalization parameter (typical: 0.5-0.8) */
  b: number;
  /** Minimum IDF value to prevent negative scores */
  minIDF: number;
}

export const DEFAULT_BM25_CONFIG: BM25Config = {
  k1: 1.2,
  b: 0.75,
  minIDF: 0.1,
};

/**
 * Document statistics for BM25 calculation
 */
export interface DocumentStats {
  /** Document ID */
  docId: number;
  /** Document length (number of terms) */
  length: number;
  /** Term frequencies in this document */
  termFrequencies: Map<string, number>;
}

/**
 * Corpus statistics for BM25 calculation
 */
export interface CorpusStats {
  /** Total number of documents */
  totalDocs: number;
  /** Average document length */
  avgDocLength: number;
  /** Document frequency for each term (how many docs contain the term) */
  documentFrequencies: Map<string, number>;
}

/**
 * Calculate IDF (Inverse Document Frequency) for a term
 * IDF = log((N - df + 0.5) / (df + 0.5) + 1)
 * 
 * Where:
 * - N = total number of documents
 * - df = document frequency (number of documents containing the term)
 */
export function calculateIDF(
  term: string,
  corpusStats: CorpusStats,
  config: BM25Config = DEFAULT_BM25_CONFIG
): number {
  const df = corpusStats.documentFrequencies.get(term) || 0;
  const N = corpusStats.totalDocs;

  // Prevent division by zero and negative IDF
  if (df === 0 || N === 0) {
    return config.minIDF;
  }

  // BM25 IDF formula with smoothing
  const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

  // Ensure minimum IDF
  return Math.max(idf, config.minIDF);
}

/**
 * Calculate BM25 score for a single term in a document
 */
export function calculateTermScore(
  term: string,
  docStats: DocumentStats,
  corpusStats: CorpusStats,
  config: BM25Config = DEFAULT_BM25_CONFIG
): number {
  const tf = docStats.termFrequencies.get(term) || 0;

  // If term not in document, score is 0
  if (tf === 0) {
    return 0;
  }

  const idf = calculateIDF(term, corpusStats, config);
  const docLength = docStats.length;
  const avgDocLength = corpusStats.avgDocLength;

  // BM25 formula
  const numerator = tf * (config.k1 + 1);
  const denominator = tf + config.k1 * (1 - config.b + config.b * (docLength / avgDocLength));

  return idf * (numerator / denominator);
}

/**
 * Calculate BM25 score for a query against a document
 * Returns the sum of BM25 scores for all query terms
 */
export function calculateBM25Score(
  queryTerms: string[],
  docStats: DocumentStats,
  corpusStats: CorpusStats,
  config: BM25Config = DEFAULT_BM25_CONFIG
): number {
  let totalScore = 0;

  for (const term of queryTerms) {
    totalScore += calculateTermScore(term, docStats, corpusStats, config);
  }

  return totalScore;
}

/**
 * Build corpus statistics from documents
 * This should be called once during index building
 */
export function buildCorpusStats(documents: DocumentStats[]): CorpusStats {
  const totalDocs = documents.length;
  let totalLength = 0;
  const documentFrequencies = new Map<string, number>();

  for (const doc of documents) {
    totalLength += doc.length;

    // Count unique terms per document (for document frequency)
    const uniqueTerms = new Set(doc.termFrequencies.keys());
    for (const term of uniqueTerms) {
      documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
    }
  }

  const avgDocLength = totalDocs > 0 ? totalLength / totalDocs : 0;

  return {
    totalDocs,
    avgDocLength,
    documentFrequencies,
  };
}

/**
 * Normalize BM25 score to 0-1 range for consistency with existing scoring
 * Uses sigmoid function for smooth normalization
 */
export function normalizeBM25Score(score: number, maxScore: number = 10): number {
  if (maxScore === 0) return 0;

  // Sigmoid normalization: 1 / (1 + e^(-x))
  // Scale score to reasonable range first
  const scaledScore = (score / maxScore) * 6 - 3; // Map to [-3, 3] range
  return 1 / (1 + Math.exp(-scaledScore));
}

/**
 * Combine BM25 score with fuzzy match score
 * Provides a hybrid scoring approach
 */
export function combineScores(
  bm25Score: number,
  fuzzyScore: number,
  bm25Weight: number = 0.6,
  fuzzyWeight: number = 0.4
): number {
  // Normalize weights
  const totalWeight = bm25Weight + fuzzyWeight;
  const normalizedBM25Weight = bm25Weight / totalWeight;
  const normalizedFuzzyWeight = fuzzyWeight / totalWeight;

  // Weighted combination
  return normalizedBM25Weight * bm25Score + normalizedFuzzyWeight * fuzzyScore;
}
