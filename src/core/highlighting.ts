/**
 * Match Highlighting Utilities
 * Calculates positions of matched characters for UI highlighting
 */

import type { MatchHighlight, MatchType, SearchMatch } from "./types.js";

/**
 * Calculate highlights for a search match
 */
export function calculateHighlights(
  match: SearchMatch,
  query: string,
  displayText: string
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  const normalizedDisplay = displayText.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  switch (match.matchType) {
    case "exact":
      // Highlight the entire word
      highlights.push({
        start: 0,
        end: displayText.length,
        type: "exact",
      });
      break;

    case "prefix":
      // Highlight the matching prefix
      const prefixEnd = Math.min(normalizedQuery.length, displayText.length);
      highlights.push({
        start: 0,
        end: prefixEnd,
        type: "prefix",
      });
      break;

    case "substring":
      // Find where the query appears in the display text
      const substringIndex = normalizedDisplay.indexOf(normalizedQuery);
      if (substringIndex !== -1) {
        highlights.push({
          start: substringIndex,
          end: substringIndex + normalizedQuery.length,
          type: "substring",
        });
      }
      break;

    case "fuzzy":
      // For fuzzy matches, highlight matching characters
      highlights.push(...calculateFuzzyHighlights(normalizedQuery, normalizedDisplay, "fuzzy"));
      break;

    case "ngram":
      // Highlight n-gram matches
      highlights.push(...calculateNgramHighlights(normalizedQuery, normalizedDisplay));
      break;

    case "phonetic":
    case "synonym":
    case "compound":
      // For phonetic/synonym/compound, highlight the whole word
      highlights.push({
        start: 0,
        end: displayText.length,
        type: match.matchType,
      });
      break;
  }

  return mergeOverlappingHighlights(highlights);
}

/**
 * Calculate highlights for fuzzy matches using edit distance alignment
 */
function calculateFuzzyHighlights(
  query: string,
  text: string,
  type: MatchType
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  let queryIdx = 0;
  let textIdx = 0;

  // Simple greedy matching - find matching characters
  while (queryIdx < query.length && textIdx < text.length) {
    if (query[queryIdx] === text[textIdx]) {
      // Found a match
      const start = textIdx;
      let end = textIdx + 1;

      // Extend the match as far as possible
      queryIdx++;
      textIdx++;
      while (queryIdx < query.length && textIdx < text.length && query[queryIdx] === text[textIdx]) {
        end++;
        queryIdx++;
        textIdx++;
      }

      highlights.push({ start, end, type });
    } else {
      textIdx++;
    }
  }

  return highlights;
}

/**
 * Calculate highlights for n-gram matches
 */
function calculateNgramHighlights(
  query: string,
  text: string
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  const ngramSize = 3;

  // Find all n-grams from query that appear in text
  for (let i = 0; i <= query.length - ngramSize; i++) {
    const ngram = query.slice(i, i + ngramSize);
    let searchStart = 0;

    // Find all occurrences of this n-gram
    while (true) {
      const index = text.indexOf(ngram, searchStart);
      if (index === -1) break;

      highlights.push({
        start: index,
        end: index + ngramSize,
        type: "ngram",
      });

      searchStart = index + 1;
    }
  }

  return highlights;
}

/**
 * Merge overlapping highlights to avoid duplicate highlighting
 */
function mergeOverlappingHighlights(highlights: MatchHighlight[]): MatchHighlight[] {
  if (highlights.length === 0) return [];

  // Sort by start position
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged: MatchHighlight[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping - merge them
      last.end = Math.max(last.end, current.end);
      // Keep the more specific match type
      if (getMatchTypePriority(current.type) > getMatchTypePriority(last.type)) {
        last.type = current.type;
      }
    } else {
      // No overlap - add as new highlight
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Get priority for match types (higher = more specific)
 */
function getMatchTypePriority(type: MatchType): number {
  const priorities: Record<MatchType, number> = {
    exact: 10,
    prefix: 9,
    substring: 8,
    fuzzy: 7,
    ngram: 6,
    phonetic: 5,
    compound: 4,
    synonym: 3,
  };
  return priorities[type] || 0;
}

/**
 * Format highlighted text for HTML rendering
 */
export function formatHighlightedHTML(
  text: string,
  highlights: MatchHighlight[],
  className: string = "highlight"
): string {
  if (!highlights || highlights.length === 0) {
    return escapeHTML(text);
  }

  let result = "";
  let lastEnd = 0;

  for (const highlight of highlights) {
    // Add text before highlight
    if (highlight.start > lastEnd) {
      result += escapeHTML(text.slice(lastEnd, highlight.start));
    }

    // Add highlighted text
    const highlightedText = text.slice(highlight.start, highlight.end);
    result += `<mark class="${className} ${className}--${highlight.type}">${escapeHTML(highlightedText)}</mark>`;

    lastEnd = highlight.end;
  }

  // Add remaining text
  if (lastEnd < text.length) {
    result += escapeHTML(text.slice(lastEnd));
  }

  return result;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for Node.js
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
