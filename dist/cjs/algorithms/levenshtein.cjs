"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function calculateLevenshteinDistance(str1, str2, maxDistance = Infinity) {
  const len1 = str1.length;
  const len2 = str2.length;
  if (Math.abs(len1 - len2) > maxDistance) {
    return maxDistance + 1;
  }
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  if (str1 === str2) return 0;
  let previousRow = new Array(len2 + 1);
  let currentRow = new Array(len2 + 1);
  for (let j = 0; j <= len2; j++) {
    previousRow[j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    currentRow[0] = i;
    let minInRow = i;
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        // insertion
        previousRow[j] + 1,
        // deletion
        previousRow[j - 1] + cost
        // substitution
      );
      minInRow = Math.min(minInRow, currentRow[j]);
    }
    if (minInRow > maxDistance) {
      return maxDistance + 1;
    }
    [previousRow, currentRow] = [currentRow, previousRow];
  }
  return previousRow[len2];
}
function calculateDamerauLevenshteinDistance(str1, str2, maxDistance = Infinity) {
  const len1 = str1.length;
  const len2 = str2.length;
  if (Math.abs(len1 - len2) > maxDistance) {
    return maxDistance + 1;
  }
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  if (str1 === str2) return 0;
  const maxLen = Math.max(len1, len2);
  const H = [];
  const INF = maxLen + 1;
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
  const charMap = /* @__PURE__ */ new Map();
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
        H[i][j] + cost,
        // substitution
        H[i + 1][j] + 1,
        // insertion
        H[i][j + 1] + 1,
        // deletion
        H[lastMatchRow][lastMatchCol] + (i - lastMatchRow - 1) + 1 + (j - lastMatchCol - 1)
        // transposition
      );
    }
    charMap.set(str1[i - 1], i);
  }
  const result = H[len1 + 1][len2 + 1];
  return result > maxDistance ? maxDistance + 1 : result;
}
function calculateNgramSimilarity(str1, str2, n = 3) {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  const ngrams1 = generateNgrams(str1, n);
  const ngrams2 = generateNgrams(str2, n);
  if (ngrams1.length === 0 && ngrams2.length === 0) return 1;
  if (ngrams1.length === 0 || ngrams2.length === 0) return 0;
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = /* @__PURE__ */ new Set([...set1, ...set2]);
  return intersection.size / union.size;
}
function generateNgrams(str, n) {
  if (str.length < n) return [str];
  const ngrams = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}
function distanceToSimilarity(distance, maxLength) {
  if (maxLength === 0) return distance === 0 ? 1 : 0;
  return Math.max(0, 1 - distance / maxLength);
}
function areStringsSimilar(str1, str2, threshold = 0.8, maxDistance = 2) {
  if (str1 === str2) return true;
  const maxLen = Math.max(str1.length, str2.length);
  if (Math.abs(str1.length - str2.length) > maxDistance) return false;
  const ngramSim = calculateNgramSimilarity(str1, str2);
  if (ngramSim < threshold - 0.2) return false;
  const distance = calculateLevenshteinDistance(str1, str2, maxDistance);
  const similarity = distanceToSimilarity(distance, maxLen);
  return similarity >= threshold;
}
exports.areStringsSimilar = areStringsSimilar;
exports.calculateDamerauLevenshteinDistance = calculateDamerauLevenshteinDistance;
exports.calculateLevenshteinDistance = calculateLevenshteinDistance;
exports.calculateNgramSimilarity = calculateNgramSimilarity;
exports.distanceToSimilarity = distanceToSimilarity;
exports.generateNgrams = generateNgrams;
//# sourceMappingURL=levenshtein.cjs.map
