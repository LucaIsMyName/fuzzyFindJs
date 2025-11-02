function isWordBoundary(text, position) {
  if (position === 0) {
    return true;
  }
  const charBefore = text[position - 1];
  return /[\s\-_.,;:!?()[\]{}'"\/\\]/.test(charBefore);
}
function matchesAtWordBoundary(text, matchStart, matchLength) {
  const matchEnd = matchStart + matchLength;
  const startBoundary = isWordBoundary(text, matchStart);
  const endBoundary = matchEnd >= text.length || /[\s\-_.,;:!?()[\]{}'"\/\\]/.test(text[matchEnd]);
  return startBoundary && endBoundary;
}
function findWordBoundaryMatches(text, pattern, caseSensitive = false) {
  const positions = [];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
  let index = 0;
  while (index < searchText.length) {
    const found = searchText.indexOf(searchPattern, index);
    if (found === -1) {
      break;
    }
    if (matchesAtWordBoundary(text, found, searchPattern.length)) {
      positions.push(found);
    }
    index = found + 1;
  }
  return positions;
}
function matchesWord(word, query, wordBoundaries) {
  if (!wordBoundaries) {
    return word.toLowerCase().includes(query.toLowerCase());
  }
  const positions = findWordBoundaryMatches(word, query, false);
  return positions.length > 0;
}
function parseWildcard(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regexPattern = escaped.replace(/\*/g, ".*");
  return new RegExp(`^${regexPattern}$`, "i");
}
function matchesWildcard(word, pattern) {
  const regex = parseWildcard(pattern);
  return regex.test(word);
}
export {
  findWordBoundaryMatches,
  isWordBoundary,
  matchesAtWordBoundary,
  matchesWildcard,
  matchesWord,
  parseWildcard
};
//# sourceMappingURL=word-boundaries.js.map
