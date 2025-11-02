/**
 * Accent Normalization Utilities
 * Removes diacritics and accents from text for better matching
 */

/**
 * Comprehensive accent/diacritic mapping
 * Maps accented characters to their base forms
 */
const ACCENT_MAP: Record<string, string> = {
  // Latin Extended-A
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  ā: "a",
  ă: "a",
  ą: "a",
  À: "A",
  Á: "A",
  Â: "A",
  Ã: "A",
  Ä: "A",
  Å: "A",
  Ā: "A",
  Ă: "A",
  Ą: "A",

  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ē: "e",
  ĕ: "e",
  ė: "e",
  ę: "e",
  ě: "e",
  È: "E",
  É: "E",
  Ê: "E",
  Ë: "E",
  Ē: "E",
  Ĕ: "E",
  Ė: "E",
  Ę: "E",
  Ě: "E",

  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ĩ: "i",
  ī: "i",
  ĭ: "i",
  į: "i",
  Ì: "I",
  Í: "I",
  Î: "I",
  Ï: "I",
  Ĩ: "I",
  Ī: "I",
  Ĭ: "I",
  Į: "I",

  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ō': 'o', 'ŏ': 'o', 'ő': 'o',
  'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ō': 'O', 'Ŏ': 'O', 'Ő': 'O',

  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ũ': 'u', 'ū': 'u', 'ŭ': 'u', 'ů': 'u', 'ű': 'u', 'ų': 'u',
  'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ũ': 'U', 'Ū': 'U', 'Ŭ': 'U', 'Ů': 'U', 'Ű': 'U', 'Ų': 'U',

  ý: "y",
  ÿ: "y",
  ŷ: "y",
  Ý: "Y",
  Ÿ: "Y",
  Ŷ: "Y",

  ñ: "n",
  ń: "n",
  ņ: "n",
  ň: "n",
  Ñ: "N",
  Ń: "N",
  Ņ: "N",
  Ň: "N",

  ç: "c",
  ć: "c",
  ĉ: "c",
  ċ: "c",
  č: "c",
  Ç: "C",
  Ć: "C",
  Ĉ: "C",
  Ċ: "C",
  Č: "C",

  ß: "ss", // German sharp s

  ð: "d",
  đ: "d",
  Ð: "D",
  Đ: "D",

  ĝ: "g",
  ğ: "g",
  ġ: "g",
  ģ: "g",
  Ĝ: "G",
  Ğ: "G",
  Ġ: "G",
  Ģ: "G",

  ĥ: "h",
  ħ: "h",
  Ĥ: "H",
  Ħ: "H",

  ĵ: "j",
  Ĵ: "J",

  ķ: "k",
  Ķ: "K",

  ĺ: "l",
  ļ: "l",
  ľ: "l",
  ŀ: "l",
  ł: "l",
  Ĺ: "L",
  Ļ: "L",
  Ľ: "L",
  Ŀ: "L",
  Ł: "L",

  ŕ: "r",
  ŗ: "r",
  ř: "r",
  Ŕ: "R",
  Ŗ: "R",
  Ř: "R",

  ś: "s",
  ŝ: "s",
  ş: "s",
  š: "s",
  Ś: "S",
  Ŝ: "S",
  Ş: "S",
  Š: "S",

  ţ: "t",
  ť: "t",
  ŧ: "t",
  Ţ: "T",
  Ť: "T",
  Ŧ: "T",

  ŵ: "w",
  Ŵ: "W",

  ź: "z",
  ż: "z",
  ž: "z",
  Ź: "Z",
  Ż: "Z",
  Ž: "Z",

  æ: "ae",
  œ: "oe",
  Æ: "AE",
  Œ: "OE",

  þ: "th",
  Þ: "TH",
};

/**
 * Cache for accent removal results
 * Dramatically speeds up repeated accent normalization
 */
const accentCache = new Map<string, string>();
const MAX_CACHE_SIZE = 10000; // TODO: Adjust based on memory constraints

/**
 * Remove accents and diacritics from a string
 * Uses both custom mapping and Unicode normalization with caching
 */
export function removeAccents(text: string): string {
  if (!text) return text;

  // Check cache first (massive speedup for repeated words)
  const cached = accentCache.get(text);
  if (cached !== undefined) {
    return cached;
  }

  // OPTIMIZATION: Use array join instead of string concatenation
  const chars: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    chars.push(ACCENT_MAP[char] || char);
  }
  let result = chars.join('');

  // Second pass: Use Unicode normalization for any remaining accents
  // NFD = Canonical Decomposition (separates base char from combining marks)
  // Then remove combining diacritical marks (Unicode range \u0300-\u036f)
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Cache the result (with size limit)
  if (accentCache.size < MAX_CACHE_SIZE) {
    accentCache.set(text, result);
  } else if (accentCache.size === MAX_CACHE_SIZE) {
    // Clear cache when it gets too large (keep most recent)
    accentCache.clear();
    accentCache.set(text, result);
  }

  return result;
}

/**
 * Check if a string contains any accented characters
 * Optimized with early return
 */
export function hasAccents(text: string): boolean {
  if (!text) return false;

  // OPTIMIZATION: Check custom map first (fast path)
  for (let i = 0; i < text.length; i++) {
    if (ACCENT_MAP[text[i]]) {
      return true;
    }
  }

  // OPTIMIZATION: Only normalize if we didn't find accents in map
  // Check for combining diacritical marks
  return /[\u0300-\u036f]/.test(text.normalize("NFD"));
}

/**
 * Normalize text for accent-insensitive comparison
 * Converts to lowercase and removes accents
 */
export function normalizeForComparison(text: string): string {
  return removeAccents(text.toLowerCase());
}

/**
 * Create accent-insensitive variants of a word
 * Returns both original and accent-free version
 */
export function getAccentVariants(word: string): string[] {
  const normalized = removeAccents(word);

  // If word has accents, return both versions
  if (normalized !== word) {
    return [word, normalized];
  }

  // Otherwise just return original
  return [word];
}
