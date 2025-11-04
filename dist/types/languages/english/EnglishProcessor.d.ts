import { BaseLanguageProcessor } from "../base/LanguageProcessor.js";
import type { FuzzyFeature } from "../../core/types.js";
/**
 * English language processor with specialized features:
 * - Metaphone phonetic algorithm
 * - Common English contractions
 * - English-specific word endings
 * - Comprehensive synonym support
 */
export declare class EnglishProcessor extends BaseLanguageProcessor {
    readonly language = "english";
    readonly displayName = "English";
    readonly supportedFeatures: FuzzyFeature[];
    /**
     * English text normalization with contraction handling
     */
    normalize(text: string): string;
    /**
     * Simplified Metaphone algorithm for English phonetic matching
     */
    getPhoneticCode(word: string): string;
    /**
     * English word variants
     * Uses optimized base implementation with English-specific additions
     */
    getWordVariants(word: string, performanceMode?: string): string[];
    /**
     * English word endings
     */
    protected getCommonEndings(): string[];
    /**
     * English synonyms for common words
     */
    getSynonyms(word: string): string[];
}
//# sourceMappingURL=EnglishProcessor.d.ts.map