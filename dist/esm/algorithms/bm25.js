const DEFAULT_BM25_CONFIG = {
  k1: 1.2,
  b: 0.75,
  minIDF: 0.1
};
function calculateIDF(term, corpusStats, config = DEFAULT_BM25_CONFIG) {
  const df = corpusStats.documentFrequencies.get(term) || 0;
  const N = corpusStats.totalDocs;
  if (df === 0 || N === 0) {
    return config.minIDF;
  }
  const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
  return Math.max(idf, config.minIDF);
}
function calculateTermScore(term, docStats, corpusStats, config = DEFAULT_BM25_CONFIG) {
  const tf = docStats.termFrequencies.get(term) || 0;
  if (tf === 0) {
    return 0;
  }
  const idf = calculateIDF(term, corpusStats, config);
  const docLength = docStats.length;
  const avgDocLength = corpusStats.avgDocLength;
  const numerator = tf * (config.k1 + 1);
  const denominator = tf + config.k1 * (1 - config.b + config.b * (docLength / avgDocLength));
  return idf * (numerator / denominator);
}
function calculateBM25Score(queryTerms, docStats, corpusStats, config = DEFAULT_BM25_CONFIG) {
  let totalScore = 0;
  for (const term of queryTerms) {
    totalScore += calculateTermScore(term, docStats, corpusStats, config);
  }
  return totalScore;
}
function buildCorpusStats(documents) {
  const totalDocs = documents.length;
  let totalLength = 0;
  const documentFrequencies = /* @__PURE__ */ new Map();
  for (const doc of documents) {
    totalLength += doc.length;
    const uniqueTerms = new Set(doc.termFrequencies.keys());
    for (const term of uniqueTerms) {
      documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
    }
  }
  const avgDocLength = totalDocs > 0 ? totalLength / totalDocs : 0;
  return {
    totalDocs,
    avgDocLength,
    documentFrequencies
  };
}
function normalizeBM25Score(score, maxScore = 10) {
  if (maxScore === 0) return 0;
  const scaledScore = score / maxScore * 6 - 3;
  return 1 / (1 + Math.exp(-scaledScore));
}
function combineScores(bm25Score, fuzzyScore, bm25Weight = 0.6, fuzzyWeight = 0.4) {
  const totalWeight = bm25Weight + fuzzyWeight;
  const normalizedBM25Weight = bm25Weight / totalWeight;
  const normalizedFuzzyWeight = fuzzyWeight / totalWeight;
  return normalizedBM25Weight * bm25Score + normalizedFuzzyWeight * fuzzyScore;
}
export {
  DEFAULT_BM25_CONFIG,
  buildCorpusStats,
  calculateBM25Score,
  calculateIDF,
  calculateTermScore,
  combineScores,
  normalizeBM25Score
};
//# sourceMappingURL=bm25.js.map
