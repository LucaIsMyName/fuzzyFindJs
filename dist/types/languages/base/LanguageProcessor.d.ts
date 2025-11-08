import type { LanguageProcessor, FuzzyFeature } from "../../core/types.js";
/**
 * Abstract base class for language processors
 * Provides common functionality and enforces interface
 */
export declare abstract class BaseLanguageProcessor implements LanguageProcessor {
    abstract readonly language: string;
    abstract readonly displayName: string;
    abstract readonly supportedFeatures: FuzzyFeature[];
    /**
     * Basic text normalization (override for language-specific behavior)
     */
    normalize(text: string): string;
    /**
     * Default phonetic implementation (override for language-specific algorithms)
     */
    getPhoneticCode(word: string): string;
    /**
     * Default compound word splitting (override for languages that support it)
     * Base implementation splits on spaces for multi-word phrases
     */
    splitCompoundWords(word: string): string[];
    /**
     * Generate common word variants
     * OPTIMIZATION 2: In fast mode, generate fewer prefixes to reduce index size
     */
    getWordVariants(word: string, performanceMode?: string): string[];
    /**
     * Get common word endings for this language (override for language-specific endings)
     */
    protected getCommonEndings(): string[];
    /**
     * Default synonym lookup (override to provide language-specific synonyms)
     */
    getSynonyms(_word: string): string[];
    /**
     * Check if two characters are keyboard neighbors
     */
    isValidSubstitution(char1: string, char2: string): boolean;
    /**
     * Get keyboard neighbor mappings (QWERTY layout by default)
     */
    protected getKeyboardNeighbors(): Record<string, string[]>;
    /**
     * Generate n-grams for partial matching
     */
    generateNgrams(word: string, n?: number): string[];
    /**
     * Calculate basic edit distance (Levenshtein)
     */
    calculateEditDistance(str1: string, str2: string): number;
}
//# sourceMappingURL=LanguageProcessor.d.ts.map