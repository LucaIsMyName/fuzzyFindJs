import type { LanguageProcessor, FuzzyFeature } from "../../core/types.js";

/**
 * Abstract base class for language processors
 * Provides common functionality and enforces interface
 */
export abstract class BaseLanguageProcessor implements LanguageProcessor {
  abstract readonly language: string;
  abstract readonly displayName: string;
  abstract readonly supportedFeatures: FuzzyFeature[];

  /**
   * Basic text normalization (override for language-specific behavior)
   */
  normalize(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, " ");
  }

  /**
   * Default phonetic implementation (override for language-specific algorithms)
   */
  getPhoneticCode(word: string): string {
    // Simple soundex-like algorithm as fallback
    const normalized = this.normalize(word);
    if (normalized.length === 0) return "";

    let code = normalized[0].toUpperCase();
    const consonantMap: Record<string, string> = {
      b: "1",
      f: "1",
      p: "1",
      v: "1",
      c: "2",
      g: "2",
      j: "2",
      k: "2",
      q: "2",
      s: "2",
      x: "2",
      z: "2",
      d: "3",
      t: "3",
      l: "4",
      m: "5",
      n: "5",
      r: "6",
    };

    for (let i = 1; i < normalized.length && code.length < 4; i++) {
      const char = normalized[i];
      const digit = consonantMap[char];
      if (digit && digit !== code[code.length - 1]) {
        code += digit;
      }
    }

    return code.padEnd(4, "0");
  }

  /**
   * Default compound word splitting (override for languages that support it)
   */
  splitCompoundWords(word: string): string[] {
    return [word]; // No splitting by default
  }

  /**
   * Generate common word variants with adaptive optimization
   * OPTIMIZATION: Dramatically reduced prefix generation based on word length and performance mode
   * - Fast mode: Only essential prefixes (60-70% reduction)
   * - Balanced mode: Adaptive stepping (40-50% reduction)
   * - Comprehensive mode: More prefixes but still optimized (20-30% reduction)
   */
  getWordVariants(word: string, performanceMode?: string): string[] {
    const variants = new Set<string>();
    const normalized = this.normalize(word);
    const len = normalized.length;

    variants.add(normalized);
    variants.add(word); // Original form

    // Add variants without common endings
    const commonEndings = this.getCommonEndings();
    for (const ending of commonEndings) {
      if (normalized.endsWith(ending) && len > ending.length + 2) {
        variants.add(normalized.slice(0, -ending.length));
      }
    }

    // OPTIMIZATION: Adaptive prefix generation based on word length and performance mode
    if (len > 4) {
      let step: number;
      let minPrefixLen: number;
      let maxPrefixes: number;

      switch (performanceMode) {
        case 'fast':
          // Fast mode: Exponential stepping for dramatic reduction
          // Only generate key prefixes: start, 1/3, 2/3, near-end
          step = Math.max(2, Math.floor(len / 4));
          minPrefixLen = 3;
          maxPrefixes = 4; // Limit to 4 prefixes max
          break;
        
        case 'comprehensive':
          // Comprehensive: More prefixes but still optimized
          step = len > 12 ? 2 : 1; // Step by 2 for very long words
          minPrefixLen = 3;
          maxPrefixes = Infinity;
          break;
        
        default: // 'balanced'
          // Balanced: Adaptive stepping based on word length
          if (len <= 6) {
            step = 1; // Short words: all prefixes
          } else if (len <= 10) {
            step = 2; // Medium words: every 2nd prefix
          } else {
            step = 2; // Long words: every 2nd prefix (more than fast mode)
          }
          minPrefixLen = 3;
          maxPrefixes = 10; // Reasonable limit, more than fast mode
      }

      let prefixCount = 0;
      for (let i = minPrefixLen; i < len && prefixCount < maxPrefixes; i += step) {
        const prefix = normalized.slice(0, i);
        variants.add(prefix);
        prefixCount++;
        
        // CRITICAL: If prefix ends with space, also add it without the space
        // This ensures we capture complete words like "laptop" from "laptop pro"
        if (prefix.endsWith(' ')) {
          variants.add(prefix.trimEnd());
        }
      }

      // Always include near-complete prefix for better matching
      if (len > 6 && !variants.has(normalized.slice(0, len - 1))) {
        variants.add(normalized.slice(0, len - 1));
      }
    }

    return Array.from(variants);
  }

  /**
   * Get common word endings for this language (override for language-specific endings)
   */
  protected getCommonEndings(): string[] {
    return [
      //
      "s",
      "es",
      "ed",
      "ing",
      "er",
      "est",
    ];
  }

  /**
   * Default synonym lookup (override to provide language-specific synonyms)
   */
  getSynonyms(_word: string): string[] {
    return []; // No built-in synonyms by default
  }

  /**
   * Check if two characters are keyboard neighbors
   */
  isValidSubstitution(char1: string, char2: string): boolean {
    const keyboardNeighbors = this.getKeyboardNeighbors();
    const neighbors = keyboardNeighbors[char1.toLowerCase()];
    return neighbors ? neighbors.includes(char2.toLowerCase()) : false;
  }

  /**
   * Get keyboard neighbor mappings (QWERTY layout by default)
   */
  protected getKeyboardNeighbors(): Record<string, string[]> {
    return {
      q: ["w", "a", "s"],
      w: ["q", "e", "a", "s", "d"],
      e: ["w", "r", "s", "d", "f"],
      r: ["e", "t", "d", "f", "g"],
      t: ["r", "y", "f", "g", "h"],
      y: ["t", "u", "g", "h", "j"],
      u: ["y", "i", "h", "j", "k"],
      i: ["u", "o", "j", "k", "l"],
      o: ["i", "p", "k", "l"],
      p: ["o", "l"],
      a: ["q", "w", "s", "z", "x"],
      s: ["q", "w", "e", "a", "d", "z", "x", "c"],
      d: ["w", "e", "r", "s", "f", "x", "c", "v"],
      f: ["e", "r", "t", "d", "g", "c", "v", "b"],
      g: ["r", "t", "y", "f", "h", "v", "b", "n"],
      h: ["t", "y", "u", "g", "j", "b", "n", "m"],
      j: ["y", "u", "i", "h", "k", "n", "m"],
      k: ["u", "i", "o", "j", "l", "m"],
      l: ["i", "o", "p", "k"],
      z: ["a", "s", "x"],
      x: ["a", "s", "d", "z", "c"],
      c: ["s", "d", "f", "x", "v"],
      v: ["d", "f", "g", "c", "b"],
      b: ["f", "g", "h", "v", "n"],
      n: ["g", "h", "j", "b", "m"],
      m: ["h", "j", "k", "n"],
    };
  }

  /**
   * Generate n-grams for partial matching
   */
  generateNgrams(word: string, n: number = 3): string[] {
    const normalized = this.normalize(word);
    if (normalized.length < n) return [normalized];

    const ngrams: string[] = [];
    for (let i = 0; i <= normalized.length - n; i++) {
      ngrams.push(normalized.slice(i, i + n));
    }
    return ngrams;
  }

  /**
   * Calculate basic edit distance (Levenshtein)
   */
  calculateEditDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }
}
