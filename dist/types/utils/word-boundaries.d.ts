/**
 * Word Boundary Utilities
 * Check if matches occur at word boundaries for more precise results
 */
/**
 * Check if a match is at a word boundary
 * A word boundary is:
 * - Start of string
 * - After whitespace
 * - After punctuation
 */
export declare function isWordBoundary(text: string, position: number): boolean;
/**
 * Check if a match occurs at word boundaries (both start and end)
 */
export declare function matchesAtWordBoundary(text: string, matchStart: number, matchLength: number): boolean;
/**
 * Find all word boundary matches of a pattern in text
 */
export declare function findWordBoundaryMatches(text: string, pattern: string, caseSensitive?: boolean): number[];
/**
 * Check if query matches word with word boundaries
 */
export declare function matchesWord(word: string, query: string, wordBoundaries: boolean): boolean;
/**
 * Check if a word starts with query (prefix match with word boundaries)
 */
export declare function startsWithWord(word: string, query: string, wordBoundaries: boolean): boolean;
/**
 * Parse wildcard pattern (supports * for any characters)
 */
export declare function parseWildcard(pattern: string): RegExp;
/**
 * Check if word matches wildcard pattern
 */
export declare function matchesWildcard(word: string, pattern: string): boolean;
//# sourceMappingURL=word-boundaries.d.ts.map