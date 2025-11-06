/**
 * Alphanumeric Segmentation Utilities
 *
 * Segments strings into alphabetic and numeric parts for better fuzzy matching
 * of identifiers like "servicehandler14568" or "api_manager_3254"
 */
export type SegmentType = 'alpha' | 'numeric' | 'other';
export interface Segment {
    /** Type of segment */
    type: SegmentType;
    /** The actual text content */
    value: string;
    /** Start position in original string */
    start: number;
    /** End position in original string */
    end: number;
}
/**
 * Check if a string contains both letters and numbers
 *
 * @param str - String to check
 * @returns True if string is alphanumeric (contains both letters and numbers)
 */
export declare function isAlphanumeric(str: string): boolean;
/**
 * Segment a string into alphabetic, numeric, and other parts
 *
 * @param str - String to segment
 * @returns Array of segments
 *
 * @example
 * ```typescript
 * segmentString("servicehandler14568")
 * // [
 * //   { type: 'alpha', value: 'servicehandler', start: 0, end: 14 },
 * //   { type: 'numeric', value: '14568', start: 14, end: 19 }
 * // ]
 *
 * segmentString("api_manager_3254")
 * // [
 * //   { type: 'alpha', value: 'api', start: 0, end: 3 },
 * //   { type: 'other', value: '_', start: 3, end: 4 },
 * //   { type: 'alpha', value: 'manager', start: 4, end: 11 },
 * //   { type: 'other', value: '_', start: 11, end: 12 },
 * //   { type: 'numeric', value: '3254', start: 12, end: 16 }
 * // ]
 * ```
 */
export declare function segmentString(str: string): Segment[];
/**
 * Get only alphabetic segments from a string
 *
 * @param str - String to segment
 * @returns Array of alphabetic segments
 */
export declare function getAlphaSegments(str: string): Segment[];
/**
 * Get only numeric segments from a string
 *
 * @param str - String to segment
 * @returns Array of numeric segments
 */
export declare function getNumericSegments(str: string): Segment[];
/**
 * Extract just the alphabetic parts of a string
 *
 * @param str - String to process
 * @returns Concatenated alphabetic parts
 *
 * @example
 * ```typescript
 * extractAlphaPart("servicehandler14568") // "servicehandler"
 * extractAlphaPart("api_manager_3254") // "apimanager"
 * ```
 */
export declare function extractAlphaPart(str: string): string;
/**
 * Extract just the numeric parts of a string
 *
 * @param str - String to process
 * @returns Concatenated numeric parts
 *
 * @example
 * ```typescript
 * extractNumericPart("servicehandler14568") // "14568"
 * extractNumericPart("api_manager_3254") // "3254"
 * ```
 */
export declare function extractNumericPart(str: string): string;
/**
 * Compare two strings segment by segment
 * Returns similarity scores for alpha and numeric parts separately
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Object with alpha and numeric similarity scores (0-1)
 */
export declare function compareSegments(str1: string, str2: string): {
    alphaSimilarity: number;
    numericSimilarity: number;
    hasAlpha: boolean;
    hasNumeric: boolean;
};
//# sourceMappingURL=alphanumeric-segmenter.d.ts.map