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
export function isAlphanumeric(str: string): boolean {
  const hasLetters = /[a-zA-Z]/.test(str);
  const hasNumbers = /[0-9]/.test(str);
  return hasLetters && hasNumbers;
}

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
export function segmentString(str: string): Segment[] {
  const segments: Segment[] = [];
  let currentType: SegmentType | null = null;
  let currentValue = '';
  let currentStart = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let charType: SegmentType;

    if (/[a-zA-Z]/.test(char)) {
      charType = 'alpha';
    } else if (/[0-9]/.test(char)) {
      charType = 'numeric';
    } else {
      charType = 'other';
    }

    if (currentType === null) {
      // Start first segment
      currentType = charType;
      currentValue = char;
      currentStart = i;
    } else if (currentType === charType) {
      // Continue current segment
      currentValue += char;
    } else {
      // End current segment and start new one
      segments.push({
        type: currentType,
        value: currentValue,
        start: currentStart,
        end: i,
      });
      currentType = charType;
      currentValue = char;
      currentStart = i;
    }
  }

  // Add final segment
  if (currentType !== null && currentValue.length > 0) {
    segments.push({
      type: currentType,
      value: currentValue,
      start: currentStart,
      end: str.length,
    });
  }

  return segments;
}

/**
 * Get only alphabetic segments from a string
 * 
 * @param str - String to segment
 * @returns Array of alphabetic segments
 */
export function getAlphaSegments(str: string): Segment[] {
  return segmentString(str).filter(s => s.type === 'alpha');
}

/**
 * Get only numeric segments from a string
 * 
 * @param str - String to segment
 * @returns Array of numeric segments
 */
export function getNumericSegments(str: string): Segment[] {
  return segmentString(str).filter(s => s.type === 'numeric');
}

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
export function extractAlphaPart(str: string): string {
  return getAlphaSegments(str).map(s => s.value).join('');
}

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
export function extractNumericPart(str: string): string {
  return getNumericSegments(str).map(s => s.value).join('');
}

/**
 * Compare two strings segment by segment
 * Returns similarity scores for alpha and numeric parts separately
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Object with alpha and numeric similarity scores (0-1)
 */
export function compareSegments(
  str1: string,
  str2: string
): {
  alphaSimilarity: number;
  numericSimilarity: number;
  hasAlpha: boolean;
  hasNumeric: boolean;
} {
  const alpha1 = extractAlphaPart(str1);
  const alpha2 = extractAlphaPart(str2);
  const numeric1 = extractNumericPart(str1);
  const numeric2 = extractNumericPart(str2);

  const hasAlpha = alpha1.length > 0 || alpha2.length > 0;
  const hasNumeric = numeric1.length > 0 || numeric2.length > 0;

  // Calculate alpha similarity (exact match for now, can be enhanced with edit distance)
  let alphaSimilarity = 0;
  if (hasAlpha) {
    if (alpha1 === alpha2) {
      alphaSimilarity = 1.0;
    } else if (alpha1.length === 0 || alpha2.length === 0) {
      alphaSimilarity = 0;
    } else {
      // Basic similarity based on common prefix
      let commonLength = 0;
      const minLen = Math.min(alpha1.length, alpha2.length);
      for (let i = 0; i < minLen; i++) {
        if (alpha1[i].toLowerCase() === alpha2[i].toLowerCase()) {
          commonLength++;
        } else {
          break;
        }
      }
      const maxLen = Math.max(alpha1.length, alpha2.length);
      alphaSimilarity = commonLength / maxLen;
    }
  }

  // Calculate numeric similarity
  let numericSimilarity = 0;
  if (hasNumeric) {
    if (numeric1 === numeric2) {
      numericSimilarity = 1.0;
    } else if (numeric1.length === 0 || numeric2.length === 0) {
      numericSimilarity = 0;
    } else {
      // For numbers, we're more lenient - partial match is ok
      const longer = numeric1.length > numeric2.length ? numeric1 : numeric2;
      const shorter = numeric1.length > numeric2.length ? numeric2 : numeric1;
      if (longer.includes(shorter)) {
        numericSimilarity = shorter.length / longer.length;
      } else {
        // Count matching digits
        let matchingDigits = 0;
        const minLen = Math.min(numeric1.length, numeric2.length);
        for (let i = 0; i < minLen; i++) {
          if (numeric1[i] === numeric2[i]) {
            matchingDigits++;
          }
        }
        numericSimilarity = matchingDigits / Math.max(numeric1.length, numeric2.length);
      }
    }
  }

  return {
    alphaSimilarity,
    numericSimilarity,
    hasAlpha,
    hasNumeric,
  };
}
