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
export declare const DEFAULT_BM25_CONFIG: BM25Config;
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
export declare function calculateIDF(term: string, corpusStats: CorpusStats, config?: BM25Config): number;
/**
 * Calculate BM25 score for a single term in a document
 */
export declare function calculateTermScore(term: string, docStats: DocumentStats, corpusStats: CorpusStats, config?: BM25Config): number;
/**
 * Calculate BM25 score for a query against a document
 * Returns the sum of BM25 scores for all query terms
 */
export declare function calculateBM25Score(queryTerms: string[], docStats: DocumentStats, corpusStats: CorpusStats, config?: BM25Config): number;
/**
 * Build corpus statistics from documents
 * This should be called once during index building
 */
export declare function buildCorpusStats(documents: DocumentStats[]): CorpusStats;
/**
 * Normalize BM25 score to 0-1 range for consistency with existing scoring
 * Uses sigmoid function for smooth normalization
 */
export declare function normalizeBM25Score(score: number, maxScore?: number): number;
/**
 * Combine BM25 score with fuzzy match score
 * Provides a hybrid scoring approach
 */
export declare function combineScores(bm25Score: number, fuzzyScore: number, bm25Weight?: number, fuzzyWeight?: number): number;
//# sourceMappingURL=bm25.d.ts.map