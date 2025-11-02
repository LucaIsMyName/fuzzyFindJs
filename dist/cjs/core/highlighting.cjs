"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function calculateHighlights(match, query, displayText) {
  const highlights = [];
  const normalizedDisplay = displayText.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  switch (match.matchType) {
    case "exact":
      highlights.push({
        start: 0,
        end: displayText.length,
        type: "exact"
      });
      break;
    case "prefix":
      const prefixEnd = Math.min(normalizedQuery.length, displayText.length);
      highlights.push({
        start: 0,
        end: prefixEnd,
        type: "prefix"
      });
      break;
    case "substring":
      const substringIndex = normalizedDisplay.indexOf(normalizedQuery);
      if (substringIndex !== -1) {
        highlights.push({
          start: substringIndex,
          end: substringIndex + normalizedQuery.length,
          type: "substring"
        });
      }
      break;
    case "fuzzy":
      highlights.push(...calculateFuzzyHighlights(normalizedQuery, normalizedDisplay, "fuzzy"));
      break;
    case "ngram":
      highlights.push(...calculateNgramHighlights(normalizedQuery, normalizedDisplay));
      break;
    case "phonetic":
    case "synonym":
    case "compound":
      highlights.push({
        start: 0,
        end: displayText.length,
        type: match.matchType
      });
      break;
  }
  return mergeOverlappingHighlights(highlights);
}
function calculateFuzzyHighlights(query, text, type) {
  const highlights = [];
  let queryIdx = 0;
  let textIdx = 0;
  while (queryIdx < query.length && textIdx < text.length) {
    if (query[queryIdx] === text[textIdx]) {
      const start = textIdx;
      let end = textIdx + 1;
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
function calculateNgramHighlights(query, text) {
  const highlights = [];
  const ngramSize = 3;
  for (let i = 0; i <= query.length - ngramSize; i++) {
    const ngram = query.slice(i, i + ngramSize);
    let searchStart = 0;
    while (true) {
      const index = text.indexOf(ngram, searchStart);
      if (index === -1) break;
      highlights.push({
        start: index,
        end: index + ngramSize,
        type: "ngram"
      });
      searchStart = index + 1;
    }
  }
  return highlights;
}
function mergeOverlappingHighlights(highlights) {
  if (highlights.length === 0) return [];
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      if (getMatchTypePriority(current.type) > getMatchTypePriority(last.type)) {
        last.type = current.type;
      }
    } else {
      merged.push(current);
    }
  }
  return merged;
}
function getMatchTypePriority(type) {
  const priorities = {
    exact: 10,
    prefix: 9,
    substring: 8,
    fuzzy: 7,
    ngram: 6,
    phonetic: 5,
    compound: 4,
    synonym: 3
  };
  return priorities[type] || 0;
}
function formatHighlightedHTML(text, highlights, className = "highlight") {
  if (!highlights || highlights.length === 0) {
    return escapeHTML(text);
  }
  let result = "";
  let lastEnd = 0;
  for (const highlight of highlights) {
    if (highlight.start > lastEnd) {
      result += escapeHTML(text.slice(lastEnd, highlight.start));
    }
    const highlightedText = text.slice(highlight.start, highlight.end);
    result += `<mark class="${className} ${className}--${highlight.type}">${escapeHTML(highlightedText)}</mark>`;
    lastEnd = highlight.end;
  }
  if (lastEnd < text.length) {
    result += escapeHTML(text.slice(lastEnd));
  }
  return result;
}
function escapeHTML(text) {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
exports.calculateHighlights = calculateHighlights;
exports.formatHighlightedHTML = formatHighlightedHTML;
//# sourceMappingURL=highlighting.cjs.map
