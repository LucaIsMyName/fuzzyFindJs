const DEFAULT_CONFIG = {
  languages: ["english"],
  features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
  performance: "balanced",
  maxResults: 10,
  minQueryLength: 2,
  fuzzyThreshold: 0.75,
  maxEditDistance: 2,
  ngramSize: 3,
  enableAlphanumericSegmentation: true,
  // Enabled by default - opt-out for performance if needed
  alphanumericAlphaWeight: 0.7,
  alphanumericNumericWeight: 0.3,
  alphanumericNumericEditDistanceMultiplier: 1.5
};
const PERFORMANCE_CONFIGS = {
  fast: {
    performance: "fast",
    features: ["partial-words", "missing-letters"],
    maxEditDistance: 1,
    fuzzyThreshold: 0.9,
    maxResults: 3,
    enableAlphanumericSegmentation: true
    // Enabled in fast mode
  },
  balanced: {
    performance: "balanced",
    features: ["phonetic", "partial-words", "missing-letters", "keyboard-neighbors"],
    maxEditDistance: 2,
    fuzzyThreshold: 0.75,
    maxResults: 5,
    enableAlphanumericSegmentation: true
    // Enabled in balanced mode
  },
  comprehensive: {
    performance: "comprehensive",
    features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
    maxEditDistance: 3,
    fuzzyThreshold: 0.7,
    maxResults: 10,
    enableAlphanumericSegmentation: true
    // Enabled in comprehensive mode
  }
};
const LANGUAGE_FEATURES = {
  german: [
    //
    "phonetic",
    "compound",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
    "extra-letters"
  ],
  english: [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
    "transpositions"
  ],
  spanish: [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters"
  ],
  french: [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters"
  ]
};
function mergeConfig(userConfig = {}) {
  const baseConfig = { ...DEFAULT_CONFIG };
  if (userConfig.performance && userConfig.performance !== "balanced") {
    const performanceConfig = PERFORMANCE_CONFIGS[userConfig.performance];
    Object.assign(baseConfig, performanceConfig);
  }
  const mergedConfig = { ...baseConfig, ...userConfig };
  if (!userConfig.features && userConfig.languages) {
    const recommendedFeatures = /* @__PURE__ */ new Set();
    for (const lang of userConfig.languages) {
      const langFeatures = LANGUAGE_FEATURES[lang] || LANGUAGE_FEATURES.english;
      langFeatures.forEach((feature) => recommendedFeatures.add(feature));
    }
    mergedConfig.features = Array.from(recommendedFeatures);
  }
  return mergedConfig;
}
function validateConfig(config) {
  if (config.maxResults < 1) {
    throw new Error("maxResults must be at least 1");
  }
  if (config.minQueryLength < 1) {
    throw new Error("minQueryLength must be at least 1");
  }
  if (config.fuzzyThreshold < 0 || config.fuzzyThreshold > 1) {
    throw new Error("fuzzyThreshold must be between 0 and 1");
  }
  if (config.maxEditDistance < 0) {
    throw new Error("maxEditDistance must be non-negative");
  }
  if (config.ngramSize < 2) {
    throw new Error("ngramSize must be at least 2");
  }
  if (config.languages.length === 0) {
    throw new Error("At least one language must be specified");
  }
}
export {
  DEFAULT_CONFIG,
  LANGUAGE_FEATURES,
  PERFORMANCE_CONFIGS,
  mergeConfig,
  validateConfig
};
//# sourceMappingURL=config.js.map
