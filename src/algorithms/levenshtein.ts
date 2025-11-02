/**
 * Optimized Levenshtein distance calculation with early termination
 * Performance-focused implementation for fuzzy matching
 */

/**
 * Calculate Levenshtein distance with maximum threshold
 * Returns early if distance exceeds maxDistance for performance
 */
export function calculateLevenshteinDistance(str1: string, str2: string, maxDistance: number = Infinity): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Quick checks for performance
  if (Math.abs(len1 - len2) > maxDistance) {
    return maxDistance + 1;
  }

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  if (str1 === str2) return 0;

  // Use single array optimization for memory efficiency
  let previousRow = new Array(len2 + 1);
  let currentRow = new Array(len2 + 1);

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    previousRow[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currentRow[0] = i;
    let minInRow = i;

    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      currentRow[j] = Math.min(
        currentRow[j - 1] + 1, // insertion
        previousRow[j] + 1, // deletion
        previousRow[j - 1] + cost // substitution
      );

      minInRow = Math.min(minInRow, currentRow[j]);
    }

    // Early termination if minimum in row exceeds threshold
    if (minInRow > maxDistance) {
      return maxDistance + 1;
    }

    // Swap arrays
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[len2];
}

/**
 * Calculate Damerau-Levenshtein distance (includes transpositions)
 * More expensive but handles character swaps
 */
export function calculateDamerauLevenshteinDistance(str1: string, str2: string, maxDistance: number = Infinity): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (Math.abs(len1 - len2) > maxDistance) {
    return maxDistance + 1;
  }

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  if (str1 === str2) return 0;

  const maxLen = Math.max(len1, len2);
  const H: number[][] = [];
  const INF = maxLen + 1;

  // Initialize H matrix
  for (let i = 0; i <= len1 + 1; i++) {
    H[i] = new Array(len2 + 2).fill(INF);
  }

  H[0][0] = INF;
  for (let i = 0; i <= len1; i++) {
    H[i + 1][0] = INF;
    H[i + 1][1] = i;
  }
  for (let j = 0; j <= len2; j++) {
    H[0][j + 1] = INF;
    H[1][j + 1] = j;
  }

  const charMap = new Map<string, number>();

  for (let i = 1; i <= len1; i++) {
    let lastMatchCol = 0;

    for (let j = 1; j <= len2; j++) {
      const char1 = str1[i - 1];
      const char2 = str2[j - 1];
      const lastMatchRow = charMap.get(char2) || 0;

      let cost = 1;
      if (char1 === char2) {
        cost = 0;
        lastMatchCol = j;
      }

      H[i + 1][j + 1] = Math.min(
        H[i][j] + cost, // substitution
        H[i + 1][j] + 1, // insertion
        H[i][j + 1] + 1, // deletion
        H[lastMatchRow][lastMatchCol] + (i - lastMatchRow - 1) + 1 + (j - lastMatchCol - 1) // transposition
      );
    }

    charMap.set(str1[i - 1], i);
  }

  const result = H[len1 + 1][len2 + 1];
  return result > maxDistance ? maxDistance + 1 : result;
}

/**
 * Fast approximate string matching using n-gram similarity
 * Much faster than edit distance for initial filtering
 */
export function calculateNgramSimilarity(str1: string, str2: string, n: number = 3): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const ngrams1 = generateNgrams(str1, n);
  const ngrams2 = generateNgrams(str2, n);

  if (ngrams1.length === 0 && ngrams2.length === 0) return 1.0;
  if (ngrams1.length === 0 || ngrams2.length === 0) return 0.0;

  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Generate n-grams from a string
 */
export function generateNgrams(str: string, n: number): string[] {
  if (str.length < n) return [str];

  const ngrams: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Calculate similarity score (0-1) from edit distance
 */
export function distanceToSimilarity(distance: number, maxLength: number): number {
  if (maxLength === 0) return distance === 0 ? 1.0 : 0.0;
  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Check if strings are similar within threshold using fast approximation
 */
export function areStringsSimilar(str1: string, str2: string, threshold: number = 0.8, maxDistance: number = 2): boolean {
  // Quick exact match
  if (str1 === str2) return true;

  // Quick length check
  const maxLen = Math.max(str1.length, str2.length);
  if (Math.abs(str1.length - str2.length) > maxDistance) return false;

  // Use n-gram similarity for fast approximation
  const ngramSim = calculateNgramSimilarity(str1, str2);
  if (ngramSim < threshold - 0.2) return false; // Early rejection

  // Calculate actual edit distance only if n-gram similarity is promising
  const distance = calculateLevenshteinDistance(str1, str2, maxDistance);
  const similarity = distanceToSimilarity(distance, maxLen);

  return similarity >= threshold;
}
