/**
 * Phrase matching algorithms for multi-word query support
 */
export interface PhraseMatchOptions {
    /** Require exact phrase match (no typos) */
    exactMatch?: boolean;
    /** Maximum edit distance per word in phrase */
    maxEditDistance?: number;
    /** Score multiplier for phrase matches */
    proximityBonus?: number;
    /** Maximum words between phrase words for proximity match */
    maxProximityDistance?: number;
    /** Use Damerau-Levenshtein (transpositions) */
    useTranspositions?: boolean;
}
export interface PhraseMatchResult {
    /** Whether phrase was found */
    matched: boolean;
    /** Match score (0-1) */
    score: number;
    /** Type of match */
    matchType: "exact" | "fuzzy" | "proximity" | "none";
    /** Start position in text */
    startPos?: number;
    /** End position in text */
    endPos?: number;
    /** Words that matched */
    matchedWords?: string[];
}
/**
 * Match a phrase in text with various strategies
 */
export declare function matchPhrase(text: string, phrase: string, options?: PhraseMatchOptions): PhraseMatchResult;
/**
 * Calculate phrase match score for a text
 * Returns 0 if no match, or a boosted score if phrase matches
 */
export declare function calculatePhraseScore(text: string, phrase: string, baseScore: number, options?: PhraseMatchOptions): number;
//# sourceMappingURL=phrase-matching.d.ts.map