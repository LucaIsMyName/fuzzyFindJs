/**
 * Stop Words Filtering
 * Common words that should be ignored in search queries
 */

/**
 * Default stop words by language
 */
export const DEFAULT_STOP_WORDS: Record<string, string[]> = {
  english: [
    //
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
    "the",
    "this",
    "but",
    "they",
    "have",
    "had",
    "what",
    "when",
    "where",
    "who",
    "which",
    "why",
    "how",
  ],
  german: [
    //
    "der",
    "die",
    "das",
    "den",
    "dem",
    "des",
    "ein",
    "eine",
    "einer",
    "eines",
    "einem",
    "einen",
    "und",
    "oder",
    "aber",
    "ist",
    "sind",
    "war",
    "waren",
    "hat",
    "haben",
    "wird",
    "werden",
    "von",
    "zu",
    "im",
    "am",
    "um",
    "auf",
    "für",
    "mit",
    "nach",
    "bei",
    "aus",
  ],
  spanish: [
    //
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "de",
    "del",
    "y",
    "o",
    "pero",
    "es",
    "son",
    "era",
    "fueron",
    "ha",
    "han",
    "en",
    "a",
    "al",
    "con",
    "por",
    "para",
    "sin",
    "sobre",
    "entre",
  ],
  french: [
    //
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "du",
    "de",
    "et",
    "ou",
    "mais",
    "est",
    "sont",
    "était",
    "étaient",
    "a",
    "ont",
    "à",
    "au",
    "aux",
    "avec",
    "pour",
    "par",
    "dans",
    "sur",
    "sous",
    "entre",
  ],
};

/**
 * Filter stop words from a query
 */
export function filterStopWords(
  query: string,
  stopWords: string[] | Set<string>
): string {
  const stopWordsSet = stopWords instanceof Set ? stopWords : new Set(stopWords.map(w => w.toLowerCase()));
  
  // Split query into words, preserving original case
  const words = query.split(/\s+/);
  const filtered = words.filter(word => !stopWordsSet.has(word.toLowerCase()));
  
  // If all words are stop words, return original query to avoid empty search
  if (filtered.length === 0) {
    return query;
  }
  
  return filtered.join(' ');
}

/**
 * Get stop words for specific languages
 */
export function getStopWordsForLanguages(languages: string[]): Set<string> {
  const stopWords = new Set<string>();

  for (const lang of languages) {
    const langStopWords = DEFAULT_STOP_WORDS[lang.toLowerCase()];
    if (langStopWords) {
      langStopWords.forEach((word) => stopWords.add(word));
    }
  }

  return stopWords;
}

/**
 * Check if a word is a stop word
 */
export function isStopWord(word: string, stopWords: string[] | Set<string>): boolean {
  const stopWordsSet = stopWords instanceof Set ? stopWords : new Set(stopWords.map((w) => w.toLowerCase()));
  return stopWordsSet.has(word.toLowerCase());
}
