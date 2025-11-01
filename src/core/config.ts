import type { FuzzyConfig, FuzzyFeature } from "./types.js";

/**
 * Default configuration for FuzzyFindJS
 * Provides sensible defaults that work out of the box
 */
export const DEFAULT_CONFIG: FuzzyConfig = {
  languages: ["german"],
  features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
  performance: "balanced",
  maxResults: 5,
  minQueryLength: 2,
  fuzzyThreshold: 0.8,
  maxEditDistance: 2,
  ngramSize: 3,
};

/**
 * Performance-optimized configurations
 */
export const PERFORMANCE_CONFIGS: Record<string, Partial<FuzzyConfig>> = {
  fast: {
    performance: "fast",
    features: ["partial-words", "missing-letters"],
    maxEditDistance: 1,
    fuzzyThreshold: 0.9,
    maxResults: 3,
  },
  balanced: {
    performance: "balanced",
    features: ["phonetic", "partial-words", "missing-letters", "keyboard-neighbors"],
    maxEditDistance: 2,
    fuzzyThreshold: 0.8,
    maxResults: 5,
  },
  comprehensive: {
    performance: "comprehensive",
    features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
    maxEditDistance: 3,
    fuzzyThreshold: 0.7,
    maxResults: 10,
  },
};

/**
 * Language-specific feature recommendations
 */
export const LANGUAGE_FEATURES: Record<string, FuzzyFeature[]> = {
  german: [
    //
    "phonetic",
    "compound",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
    "extra-letters",
  ],
  english: [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
    "transpositions",
  ],
  spanish: [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
  ],
  french: [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
  ],
};

/**
 * Merge user configuration with defaults
 */
export function mergeConfig(userConfig: Partial<FuzzyConfig> = {}): FuzzyConfig {
  const baseConfig = { ...DEFAULT_CONFIG };

  // Apply performance preset if specified
  if (userConfig.performance && userConfig.performance !== "balanced") {
    const performanceConfig = PERFORMANCE_CONFIGS[userConfig.performance];
    Object.assign(baseConfig, performanceConfig);
  }

  // Apply user overrides
  const mergedConfig = { ...baseConfig, ...userConfig };

  // Auto-adjust features based on languages if not explicitly set
  if (!userConfig.features && userConfig.languages) {
    const recommendedFeatures = new Set<FuzzyFeature>();

    for (const lang of userConfig.languages) {
      const langFeatures = LANGUAGE_FEATURES[lang] || LANGUAGE_FEATURES.english;
      langFeatures.forEach((feature) => recommendedFeatures.add(feature));
    }

    mergedConfig.features = Array.from(recommendedFeatures);
  }

  return mergedConfig;
}

/**
 * Validate configuration
 */
export function validateConfig(config: FuzzyConfig): void {
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
