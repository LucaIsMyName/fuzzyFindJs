/**
 * Field Weighting Utilities
 * Support for multi-field search with weighted scoring
 */

/**
 * Extract field values from an object or string
 */
export function extractFieldValues(
  item: any,
  fields?: string[]
): Record<string, string> | null {
  // If no fields specified, treat item as simple string
  if (!fields || fields.length === 0) {
    return null;
  }

  // If item is a string, can't extract fields
  if (typeof item === 'string') {
    return null;
  }

  // If item is an object, extract field values
  if (typeof item === 'object' && item !== null) {
    const fieldValues: Record<string, string> = {};
    
    for (const field of fields) {
      const value = item[field];
      if (value !== undefined && value !== null) {
        fieldValues[field] = String(value);
      }
    }
    
    return Object.keys(fieldValues).length > 0 ? fieldValues : null;
  }

  return null;
}

/**
 * Get all searchable text from field values
 */
export function getSearchableText(fieldValues: Record<string, string>): string[] {
  return Object.values(fieldValues).filter(v => v && v.trim().length > 0);
}

/**
 * Normalize field weights (ensure all fields have a weight)
 */
export function normalizeFieldWeights(
  fields: string[],
  fieldWeights?: Record<string, number>
): Record<string, number> {
  const normalized: Record<string, number> = {};
  
  for (const field of fields) {
    normalized[field] = fieldWeights?.[field] ?? 1.0;
  }
  
  return normalized;
}

/**
 * Apply field weight to a score
 */
export function applyFieldWeight(
  baseScore: number,
  fieldWeight: number
): number {
  return Math.min(1.0, baseScore * fieldWeight);
}
