/**
 * Optimized Levenshtein distance calculation with early termination
 * Performance-focused implementation for fuzzy matching
 */
/**
 * Calculate Levenshtein distance with maximum threshold
 * Returns early if distance exceeds maxDistance for performance
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
 */
export declare function calculateNgramSimilarity(str1: string, str2: string, n?: number): number;
/**
 * Generate n-grams from a string
 */
export declare function generateNgrams(str: string, n: number): string[];
/**
 * Calculate similarity score (0-1) from edit distance
 */
export declare function distanceToSimilarity(distance: number, maxLength: number): number;
/**
 * Check if strings are similar within threshold using fast approximation
 */
export declare function areStringsSimilar(str1: string, str2: string, threshold?: number, maxDistance?: number): boolean;
//# sourceMappingURL=levenshtein.d.ts.map