import { calculateDamerauLevenshteinDistance, calculateLevenshteinDistance } from "../algorithms/levenshtein.js";
const DEFAULT_OPTIONS = {
  exactMatch: false,
  maxEditDistance: 1,
  proximityBonus: 1.5,
  maxProximityDistance: 3,
  useTranspositions: false
};
function matchPhrase(text, phrase, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!text || !phrase) {
    return { matched: false, score: 0, matchType: "none" };
  }
  const normalizedText = text.toLowerCase();
  const normalizedPhrase = phrase.toLowerCase();
  const exactMatch = findExactPhrase(normalizedText, normalizedPhrase);
  if (exactMatch.matched) {
    return { ...exactMatch, score: 1, matchType: "exact" };
  }
  if (opts.exactMatch) {
    return { matched: false, score: 0, matchType: "none" };
  }
  const fuzzyMatch = findFuzzyPhrase(normalizedText, normalizedPhrase, opts.maxEditDistance, opts.useTranspositions);
  if (fuzzyMatch.matched) {
    return { ...fuzzyMatch, matchType: "fuzzy" };
  }
  const proximityMatch = findProximityMatch(normalizedText, normalizedPhrase, opts.maxProximityDistance);
  if (proximityMatch.matched) {
    return { ...proximityMatch, matchType: "proximity" };
  }
  return { matched: false, score: 0, matchType: "none" };
}
function findExactPhrase(text, phrase) {
  const index = text.indexOf(phrase);
  if (index !== -1) {
    return {
      matched: true,
      score: 1,
      matchType: "exact",
      startPos: index,
      endPos: index + phrase.length
    };
  }
  return { matched: false, score: 0, matchType: "none" };
}
function findFuzzyPhrase(text, phrase, maxEditDistance, useTranspositions) {
  const phraseWords = phrase.split(/\s+/);
  const textWords = text.split(/\s+/);
  for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
    const segment = textWords.slice(i, i + phraseWords.length);
    let totalDistance = 0;
    let allMatch = true;
    for (let j = 0; j < phraseWords.length; j++) {
      const distance = useTranspositions ? calculateDamerauLevenshteinDistance(phraseWords[j], segment[j], maxEditDistance) : calculateLevenshteinDistance(phraseWords[j], segment[j], maxEditDistance);
      if (distance > maxEditDistance) {
        allMatch = false;
        break;
      }
      totalDistance += distance;
    }
    if (allMatch) {
      const maxPossibleDistance = phraseWords.length * maxEditDistance;
      const score = maxPossibleDistance > 0 ? 0.7 + 0.2 * (1 - totalDistance / maxPossibleDistance) : 0.9;
      return {
        matched: true,
        score,
        matchType: "fuzzy",
        matchedWords: segment
      };
    }
  }
  return { matched: false, score: 0, matchType: "none" };
}
function findProximityMatch(text, phrase, maxDistance) {
  const phraseWords = phrase.split(/\s+/);
  const textWords = text.split(/\s+/);
  const positions = phraseWords.map(() => []);
  textWords.forEach((word, index) => {
    phraseWords.forEach((phraseWord, phraseIndex) => {
      if (word === phraseWord || word.includes(phraseWord) || phraseWord.includes(word)) {
        positions[phraseIndex].push(index);
      }
    });
  });
  if (positions.some((p) => p.length === 0)) {
    return { matched: false, score: 0, matchType: "none" };
  }
  let bestDistance = Infinity;
  let bestPositions = [];
  function findBestCombination(wordIndex, currentPositions) {
    if (wordIndex === phraseWords.length) {
      const sorted = [...currentPositions].sort((a, b) => a - b);
      const distance = sorted[sorted.length - 1] - sorted[0];
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPositions = [...currentPositions];
      }
      return;
    }
    for (const pos of positions[wordIndex]) {
      findBestCombination(wordIndex + 1, [...currentPositions, pos]);
    }
  }
  findBestCombination(0, []);
  if (bestDistance <= maxDistance) {
    const score = 0.5 + 0.2 * (1 - bestDistance / maxDistance);
    return {
      matched: true,
      score,
      matchType: "proximity",
      matchedWords: bestPositions.map((i) => textWords[i])
    };
  }
  return { matched: false, score: 0, matchType: "none" };
}
export {
  matchPhrase
};
//# sourceMappingURL=phrase-matching.js.map
