import { BaseLanguageProcessor } from "../base/LanguageProcessor.js";
import type { FuzzyFeature } from "../../core/types.js";
/**
 * German language processor with specialized features:
 * - Umlaut normalization (ä, ö, ü, ß)
 * - Compound word splitting
 * - German-specific phonetic matching (Kölner Phonetik)
 * - Common German word endings
 */
export declare class GermanProcessor extends BaseLanguageProcessor {
    readonly language = "german";
    readonly displayName = "Deutsch";
    readonly supportedFeatures: FuzzyFeature[];
    /**
     * German text normalization with umlaut handling
     */
    normalize(text: string): string;
    /**
     * Kölner Phonetik algorithm for German phonetic matching
     */
    getPhoneticCode(word: string): string;
    /**
     * German compound word splitting
     * Uses common German compound patterns and a dictionary approach
     */
    splitCompoundWords(word: string): string[];
    /**
     * German word variants including common endings
     * Uses optimized base implementation with German-specific additions
     */
    getWordVariants(word: string, performanceMode?: string): string[];
    /**
     * German word endings
     */
    protected getCommonEndings(): string[];
    /**
     * German synonyms for common words
     */
    getSynonyms(word: string): string[];
    /**
     * German keyboard layout (QWERTZ)
     */
    protected getKeyboardNeighbors(): Record<string, string[]>;
    /**
     * Common German prefixes for compound word splitting
     */
    private getCommonPrefixes;
    /**
     * Common German suffixes for compound word splitting
     */
    private getCommonSuffixes;
    /**
     * Common German words for compound splitting
     */
    private getCommonWords;
}
//# sourceMappingURL=GermanProcessor.d.ts.map