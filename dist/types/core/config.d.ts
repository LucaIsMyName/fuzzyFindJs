import type { FuzzyConfig, FuzzyFeature, MatchTypeScores, ScoringModifiers } from "./types.js";
/**
 * Default match type scores
 * These values determine the base score for each match type
 * Updated to provide more granular scoring like Fuse.js
 */
export declare const DEFAULT_MATCH_TYPE_SCORES: MatchTypeScores;
/**
 * Default scoring modifiers
 * These values control additional scoring behavior
 */
export declare const DEFAULT_SCORING_MODIFIERS: ScoringModifiers;
/**
 * Default configuration for FuzzyFindJS
 * Provides sensible defaults that work out of the box
 */
export declare const DEFAULT_CONFIG: FuzzyConfig;
/**
 * Performance-optimized configurations
 */
export declare const PERFORMANCE_CONFIGS: Record<string, Partial<FuzzyConfig>>;
/**
 * Language-specific feature recommendations
 */
export declare const LANGUAGE_FEATURES: Record<string, FuzzyFeature[]>;
/**
 * Merge user configuration with defaults
 */
export declare function mergeConfig(userConfig?: Partial<FuzzyConfig>): FuzzyConfig;
/**
 * Validate configuration
 */
export declare function validateConfig(config: FuzzyConfig): void;
//# sourceMappingURL=config.d.ts.map