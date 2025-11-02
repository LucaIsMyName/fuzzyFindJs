/**
 * Stop Words Filtering
 * Common words that should be ignored in search queries
 */
/**
 * Default stop words by language
 */
export declare const DEFAULT_STOP_WORDS: Record<string, string[]>;
/**
 * Filter stop words from a query
 */
export declare function filterStopWords(query: string, stopWords: string[] | Set<string>): string;
/**
 * Get stop words for specific languages
 */
export declare function getStopWordsForLanguages(languages: string[]): Set<string>;
/**
 * Check if a word is a stop word
 */
export declare function isStopWord(word: string, stopWords: string[] | Set<string>): boolean;
//# sourceMappingURL=stop-words.d.ts.map