/**
 * Accent Normalization Utilities
 * Removes diacritics and accents from text for better matching
 */
/**
 * Remove accents and diacritics from a string
 * Uses both custom mapping and Unicode normalization with caching
 */
export declare function removeAccents(text: string): string;
/**
 * Check if a string contains any accented characters
 * Optimized with early return
 */
export declare function hasAccents(text: string): boolean;
/**
 * Normalize text for accent-insensitive comparison
 * Converts to lowercase and removes accents
 */
export declare function normalizeForComparison(text: string): string;
/**
 * Create accent-insensitive variants of a word
 * Returns both original and accent-free version
 */
export declare function getAccentVariants(word: string): string[];
//# sourceMappingURL=accent-normalization.d.ts.map