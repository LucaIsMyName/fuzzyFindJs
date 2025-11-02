const DEFAULT_STOP_WORDS = {
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
    "how"
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
    "aus"
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
    "entre"
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
    "entre"
  ]
};
function filterStopWords(query, stopWords) {
  const stopWordsSet = stopWords instanceof Set ? stopWords : new Set(stopWords.map((w) => w.toLowerCase()));
  const words = query.split(/\s+/);
  const filtered = words.filter((word) => !stopWordsSet.has(word.toLowerCase()));
  if (filtered.length === 0) {
    return query;
  }
  return filtered.join(" ");
}
function getStopWordsForLanguages(languages) {
  const stopWords = /* @__PURE__ */ new Set();
  for (const lang of languages) {
    const langStopWords = DEFAULT_STOP_WORDS[lang.toLowerCase()];
    if (langStopWords) {
      langStopWords.forEach((word) => stopWords.add(word));
    }
  }
  return stopWords;
}
function isStopWord(word, stopWords) {
  const stopWordsSet = stopWords instanceof Set ? stopWords : new Set(stopWords.map((w) => w.toLowerCase()));
  return stopWordsSet.has(word.toLowerCase());
}
export {
  DEFAULT_STOP_WORDS,
  filterStopWords,
  getStopWordsForLanguages,
  isStopWord
};
//# sourceMappingURL=stop-words.js.map
