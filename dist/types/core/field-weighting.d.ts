/**
 * Field Weighting Utilities
 * Support for multi-field search with weighted scoring
 */
/**
 * Extract field values from an object or string
 */
export declare function extractFieldValues(item: any, fields?: string[]): Record<string, string> | null;
/**
 * Get all searchable text from field values
 */
export declare function getSearchableText(fieldValues: Record<string, string>): string[];
/**
 * Normalize field weights (ensure all fields have a weight)
 */
export declare function normalizeFieldWeights(fields: string[], fieldWeights?: Record<string, number>): Record<string, number>;
/**
 * Apply field weight to a score
 */
export declare function applyFieldWeight(baseScore: number, fieldWeight: number): number;
//# sourceMappingURL=field-weighting.d.ts.map