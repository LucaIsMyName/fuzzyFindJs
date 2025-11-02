/**
 * Optimized Levenshtein distance calculation with early termination
 * Performance-focused implementation for fuzzy matching
 * Uses memory pooling to reduce GC pressure by 30-50%
 */
/**
 * Calculate Levenshtein distance with maximum threshold
 * Returns early if distance exceeds maxDistance for performance
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param maxDistance - Maximum allowed distance (default: Infinity)
 * @returns Edit distance between strings, or maxDistance + 1 if exceeded
 *
 * @example
 * ```typescript
 * calculateLevenshteinDistance('kitten', 'sitting'); // 3
 * calculateLevenshteinDistance('hello', 'helo', 2); // 1
 * calculateLevenshteinDistance('abc', 'xyz', 1); // 2 (exceeds max)
 * ```
 */
export declare function calculateLevenshteinDistance(str1: string, str2: string, maxDistance?: number): number;
/**
 * Calculate Damerau-Levenshtein distance (includes transpositions)
 * More expensive but handles character swaps
 */
export declare function calculateDamerauLevenshteinDistance(str1: string, str2: string, maxDistance?: number): number;
/**
 * Fast approximate string matching using n-gram similarity
 * Much faster than edit distance for initial filtering
 * Uses memory pooling for Set objects to reduce GC pressure
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param n - N-gram size (default: 3)
 * @returns Similarity score between 0 and 1
 *
 * @example
 * ```typescript
 * calculateNgramSimilarity('hello', 'hallo'); // ~0.6
 * calculateNgramSimilarity('test', 'test'); // 1.0
 * ```
 */
export declare function calculateNgramSimilarity(str1: string, str2: string, n?: number): number;
/**
 * Generate n-grams from a string
 * Pre-allocates array for better performance
 *
 * @param str - Input string
 * @param n - N-gram size
 * @returns Array of n-grams
 *
 * @example
 * ```typescript
 * generateNgrams('hello', 3); // ['hel', 'ell', 'llo']
 * generateNgrams('hi', 3); // ['hi']
 * ```
 */
export declare function generateNgrams(str: string, n: number): string[];
/**
 * Calculate similarity score (0-1) from edit distance
 *
 * @param distance - Edit distance between strings
 * @param maxLength - Maximum length of the two strings
 * @returns Similarity score from 0 to 1 (1 = identical)
 *
 * @example
 * ```typescript
 * distanceToSimilarity(0, 5); // 1.0 (no edits)
 * distanceToSimilarity(2, 10); // 0.8 (2 edits in 10 chars)
 * ```
 */
export declare function distanceToSimilarity(distance: number, maxLength: number): number;
/**
 * Check if strings are similar within threshold using fast approximation
 * Uses n-gram pre-filtering before expensive Levenshtein calculation
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param threshold - Similarity threshold (0-1, default: 0.8)
 * @param maxDistance - Maximum edit distance allowed (default: 2)
 * @returns True if strings are similar enough
 *
 * @example
 * ```typescript
 * areStringsSimilar('hello', 'helo'); // true
 * areStringsSimilar('hello', 'world'); // false
 * ```
 */
export declare function areStringsSimilar(str1: string, str2: string, threshold?: number, maxDistance?: number): boolean;
//# sourceMappingURL=levenshtein.d.ts.map