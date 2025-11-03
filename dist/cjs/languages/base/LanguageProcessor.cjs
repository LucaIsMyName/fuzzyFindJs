"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
class BaseLanguageProcessor {
  /**
   * Basic text normalization (override for language-specific behavior)
   */
  normalize(text) {
    return text.toLowerCase().trim().replace(/\s+/g, " ");
  }
  /**
   * Default phonetic implementation (override for language-specific algorithms)
   */
  getPhoneticCode(word) {
    const normalized = this.normalize(word);
    if (normalized.length === 0) return "";
    let code = normalized[0].toUpperCase();
    const consonantMap = {
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
      r: "6"
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
  splitCompoundWords(word) {
    return [word];
  }
  /**
   * Generate common word variants
   * OPTIMIZATION 2: In fast mode, generate fewer prefixes to reduce index size
   */
  getWordVariants(word, performanceMode) {
    const variants = /* @__PURE__ */ new Set();
    const normalized = this.normalize(word);
    variants.add(normalized);
    variants.add(word);
    const commonEndings = this.getCommonEndings();
    for (const ending of commonEndings) {
      if (normalized.endsWith(ending) && normalized.length > ending.length + 2) {
        variants.add(normalized.slice(0, -ending.length));
      }
    }
    if (normalized.length > 4) {
      const step = performanceMode === "fast" ? 2 : 1;
      for (let i = 3; i < normalized.length; i += step) {
        variants.add(normalized.slice(0, i));
      }
    }
    return Array.from(variants);
  }
  /**
   * Get common word endings for this language (override for language-specific endings)
   */
  getCommonEndings() {
    return [
      //
      "s",
      "es",
      "ed",
      "ing",
      "er",
      "est"
    ];
  }
  /**
   * Default synonym lookup (override to provide language-specific synonyms)
   */
  getSynonyms(_word) {
    return [];
  }
  /**
   * Check if two characters are keyboard neighbors
   */
  isValidSubstitution(char1, char2) {
    const keyboardNeighbors = this.getKeyboardNeighbors();
    const neighbors = keyboardNeighbors[char1.toLowerCase()];
    return neighbors ? neighbors.includes(char2.toLowerCase()) : false;
  }
  /**
   * Get keyboard neighbor mappings (QWERTY layout by default)
   */
  getKeyboardNeighbors() {
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
      m: ["h", "j", "k", "n"]
    };
  }
  /**
   * Generate n-grams for partial matching
   */
  generateNgrams(word, n = 3) {
    const normalized = this.normalize(word);
    if (normalized.length < n) return [normalized];
    const ngrams = [];
    for (let i = 0; i <= normalized.length - n; i++) {
      ngrams.push(normalized.slice(i, i + n));
    }
    return ngrams;
  }
  /**
   * Calculate basic edit distance (Levenshtein)
   */
  calculateEditDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          // deletion
          matrix[i][j - 1] + 1,
          // insertion
          matrix[i - 1][j - 1] + cost
          // substitution
        );
      }
    }
    return matrix[len1][len2];
  }
}
exports.BaseLanguageProcessor = BaseLanguageProcessor;
//# sourceMappingURL=LanguageProcessor.cjs.map
