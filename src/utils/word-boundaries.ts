/**
 * Word Boundary Utilities
 * Check if matches occur at word boundaries for more precise results
 */

/**
 * Check if a match is at a word boundary
 * A word boundary is:
 * - Start of string
 * - After whitespace
 * - After punctuation
 */
export function isWordBoundary(text: string, position: number): boolean {
  // Start of string is always a word boundary
  if (position === 0) {
    return true;
  }

  // Check the character before the position
  const charBefore = text[position - 1];
  
  // Word boundary if previous character is whitespace or punctuation
  return /[\s\-_.,;:!?()[\]{}'"\/\\]/.test(charBefore);
}

/**
 * Check if a match occurs at word boundaries (both start and end)
 */
export function matchesAtWordBoundary(
  text: string,
  matchStart: number,
  matchLength: number
): boolean {
  const matchEnd = matchStart + matchLength;
  
  // Check start boundary
  const startBoundary = isWordBoundary(text, matchStart);
  
  // Check end boundary (either end of string or followed by boundary character)
  const endBoundary = matchEnd >= text.length || /[\s\-_.,;:!?()[\]{}'"\/\\]/.test(text[matchEnd]);
  
  return startBoundary && endBoundary;
}

/**
 * Find all word boundary matches of a pattern in text
 */
export function findWordBoundaryMatches(
  text: string,
  pattern: string,
  caseSensitive: boolean = false
): number[] {
  const positions: number[] = [];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
  
  let index = 0;
  while (index < searchText.length) {
    const found = searchText.indexOf(searchPattern, index);
    
    if (found === -1) {
      break;
    }
    
    // Check if this match is at a word boundary
    if (matchesAtWordBoundary(text, found, searchPattern.length)) {
      positions.push(found);
    }
    
    index = found + 1;
  }
  
  return positions;
}

/**
 * Check if query matches word with word boundaries
 */
export function matchesWord(word: string, query: string, wordBoundaries: boolean): boolean {
  if (!wordBoundaries) {
    // No word boundary checking - substring match is fine
    return word.toLowerCase().includes(query.toLowerCase());
  }
  
  // With word boundaries - must match at word boundary
  const positions = findWordBoundaryMatches(word, query, false);
  return positions.length > 0;
}

/**
 * Check if a word starts with query (prefix match with word boundaries)
 */
export function startsWithWord(word: string, query: string, wordBoundaries: boolean): boolean {
  const wordLower = word.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (!wordBoundaries) {
    return wordLower.startsWith(queryLower);
  }
  
  // With word boundaries - check if it starts at position 0 (which is always a boundary)
  return wordLower.startsWith(queryLower);
}

/**
 * Parse wildcard pattern (supports * for any characters)
 */
export function parseWildcard(pattern: string): RegExp {
  // Escape special regex characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  
  // Replace * with .*
  const regexPattern = escaped.replace(/\*/g, '.*');
  
  // Create regex with word boundaries if no wildcards
  return new RegExp(`^${regexPattern}$`, 'i');
}

/**
 * Check if word matches wildcard pattern
 */
export function matchesWildcard(word: string, pattern: string): boolean {
  const regex = parseWildcard(pattern);
  return regex.test(word);
}
