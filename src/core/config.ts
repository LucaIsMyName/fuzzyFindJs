import type {
  //
  FuzzyConfig,
  FuzzyFeature,
  MatchTypeScores,
  ScoringModifiers,
} from "./types.js";

/**
 * Default match type scores
 * These values determine the base score for each match type
 * Updated to provide more granular scoring like Fuse.js
 */
export const DEFAULT_MATCH_TYPE_SCORES: MatchTypeScores = {
  exact: 1.0,
  prefix: 0.9,        // High score for prefix matches - very relevant
  substring: 0.8,     // Exact substrings should rank high
  phonetic: 0.35,     // Much lower - phonetic is weak signal
  fuzzy: 0.65,        // Reasonable fuzzy score
  fuzzyMin: 0.3,      // Higher minimum to filter weak fuzzy matches
  synonym: 0.4,       // Keep synonyms lower
  compound: 0.75,     // Boost compound matches
  ngram: 0.3,         // Very low - n-grams are weakest signal
};

/**
 * Default scoring modifiers
 * These values control additional scoring behavior
 */
export const DEFAULT_SCORING_MODIFIERS: ScoringModifiers = {
  baseScore: 0.0,           // Don't add base score - let match types determine score
  shortWordBoost: 0.0,      // Disable boost - was inflating weak matches
  shortWordMaxDiff: 3,
  prefixLengthPenalty: false,
};

/**
 * Default configuration for FuzzyFindJS
 * Provides sensible defaults that work out of the box
 */
export const DEFAULT_CONFIG: FuzzyConfig = {
  languages: ["english"],
  features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
  performance: "balanced",
  maxResults: 10,
  minQueryLength: 2,
  fuzzyThreshold: 0.55,     // Balanced threshold - allows fuzzy matches, substring penalty filters garbage
  maxEditDistance: 2,
  ngramSize: 3,
  enableAlphanumericSegmentation: true, // Enabled by default - opt-out for performance if needed
  alphanumericAlphaWeight: 0.7,
  alphanumericNumericWeight: 0.3,
  alphanumericNumericEditDistanceMultiplier: 1.5,
  matchTypeScores: DEFAULT_MATCH_TYPE_SCORES,
  scoringModifiers: DEFAULT_SCORING_MODIFIERS,
};

/**
 * Performance-optimized configurations
 */
export const PERFORMANCE_CONFIGS: Record<string, Partial<FuzzyConfig>> = {
  fast: {
    performance: "fast",
    features: ["partial-words", "missing-letters"],
    maxEditDistance: 1,
    fuzzyThreshold: 0.70,     // Higher threshold in fast mode for quality
    maxResults: 3,
    enableAlphanumericSegmentation: true, // Enabled in fast mode
    matchTypeScores: {
      exact: 1.0,
      prefix: 0.8,      // Higher than default but still granular
      substring: 0.5,    // Lower - less important
      fuzzy: 0.7,
      fuzzyMin: 0.2,     // Higher minimum than default but still low
    },
  },
  balanced: {
    performance: "balanced",
    features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
    maxEditDistance: 2,
    fuzzyThreshold: 0.55,     // Balanced mode - good quality/recall tradeoff
    maxResults: 10,
    enableAlphanumericSegmentation: true,
    // Uses default scoring for balanced performance
  },
  comprehensive: {
    performance: "comprehensive",
    features: ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters", "transpositions"],
    maxEditDistance: 3,
    fuzzyThreshold: 0.50,     // Comprehensive mode - lower for better recall
    maxResults: 20,
    enableAlphanumericSegmentation: true,
    matchTypeScores: {
      exact: 1.0,
      prefix: 0.6,      // Lower for more comprehensive results
      substring: 0.7,    // Higher than prefix - prioritize substring matching
      fuzzy: 0.5,
      fuzzyMin: 0.05,    // Very low for maximum recall
      phonetic: 0.6,     // Higher for comprehensive matching
      synonym: 0.5,
      compound: 0.7,
      ngram: 0.6,
    },
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
    
    // Deep merge scoring configs from performance preset
    if (performanceConfig.matchTypeScores) {
      baseConfig.matchTypeScores = {
        ...DEFAULT_MATCH_TYPE_SCORES,
        ...performanceConfig.matchTypeScores,
      };
    }
    if (performanceConfig.scoringModifiers) {
      baseConfig.scoringModifiers = {
        ...DEFAULT_SCORING_MODIFIERS,
        ...performanceConfig.scoringModifiers,
      };
    }
  }

  // Apply user overrides
  const mergedConfig = { ...baseConfig, ...userConfig };

  // Deep merge user scoring configs
  if (userConfig.matchTypeScores) {
    mergedConfig.matchTypeScores = {
      ...baseConfig.matchTypeScores,
      ...userConfig.matchTypeScores,
    };
  }
  if (userConfig.scoringModifiers) {
    mergedConfig.scoringModifiers = {
      ...baseConfig.scoringModifiers,
      ...userConfig.scoringModifiers,
    };
  }

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
