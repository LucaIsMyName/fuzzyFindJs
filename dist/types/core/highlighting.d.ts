/**
 * Match Highlighting Utilities
 * Calculates positions of matched characters for UI highlighting
 */
import type { MatchHighlight, SearchMatch } from "./types.js";
/**
 * Calculate highlights for a search match
 */
export declare function calculateHighlights(match: SearchMatch, query: string, displayText: string): MatchHighlight[];
/**
 * Format highlighted text for HTML rendering
 */
export declare function formatHighlightedHTML(text: string, highlights: MatchHighlight[], className?: string): string;
//# sourceMappingURL=highlighting.d.ts.map