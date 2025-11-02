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
import type { InvertedIndex, DocumentMetadata, FuzzyConfig, LanguageProcessor, SearchMatch } from "./types.js";
/**
 * Build inverted index from documents
 * This runs ALONGSIDE the existing index building
 */
export declare function buildInvertedIndex(words: string[], languageProcessors: LanguageProcessor[], config: FuzzyConfig, featureSet: Set<string>): {
    invertedIndex: InvertedIndex;
    documents: DocumentMetadata[];
};
/**
 * Search using inverted index
 * Much faster than hash-based approach for large datasets
 */
export declare function searchInvertedIndex(invertedIndex: InvertedIndex, documents: DocumentMetadata[], query: string, processors: LanguageProcessor[], config: FuzzyConfig): SearchMatch[];
/**
 * Calculate BM25 scores for search matches
 * Enhances relevance ranking with statistical scoring
 */
export declare function calculateBM25Scores(matches: SearchMatch[], queryTerms: string[], invertedIndex: InvertedIndex, documents: DocumentMetadata[], config: FuzzyConfig): SearchMatch[];
//# sourceMappingURL=inverted-index.d.ts.map