# 🔍 fuzzyfindjs



[![NPM Version](https://img.shields.io/npm/v/fuzzyfindjs)](https://www.npmjs.com/package/fuzzyfindjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/fuzzyfindjs)](https://bundlephobia.com/package/fuzzyfindjs)

## 🌞 Introduction

> **⚠️ BETA**: `fuzzyFindJS` is in Beta-State. Be aware of potential quality, security and performance concerns when using `fuzzyFindJS`.

A multi-language fuzzy search library with phonetic matching, compound word splitting, and intelligent synonym support.

### ✨ Features

- 🌍 **Multi-language Support**: German, English, Spanish, French with auto-detection and language-specific optimizations
- 🔊 **Phonetic Matching**: Kölner Phonetik (German), Soundex-like algorithms for other languages
- 🧩 **Compound Word Splitting**: Intelligent German compound word decomposition
- 📚 **Synonym Support**: Built-in synonyms + custom synonym dictionaries
- 🚀 **Inverted Index**: Auto-enabled for large datasets (10k+ words) - 10-100x faster for 1M+ words
- 🎨 **Match Highlighting**: Show WHERE matches occurred with position tracking
- 🔄 **Batch Search**: Search multiple queries at once with auto-deduplication
- 🌍 **Accent Normalization**: Automatic handling of accented characters (café ↔ cafe)
- ⚖️ **Field Weighting**: Multi-field search with weighted scoring (title > description)
- 🚫 **Stop Words Filtering**: Remove common words (the, a, an) for better search quality
- 📍 **Word Boundaries**: Precise matching with wildcard support (cat* matches category)
- 💬 **Phrase Search**: Multi-word queries with quotes ("new york" finds "New York City")
- 🎯 **Typo Tolerant**: Handles missing letters, extra letters, transpositions, keyboard neighbors
- 🔤 **N-gram Matching**: Fast partial substring matching
- 📊 **BM25 Scoring**: Industry-standard relevance ranking for better search results
- 🎯 **Bloom Filters**: 50-70% faster negative lookups for large datasets
- 🔍 **FQL (Fuzzy Query Language)**: Boolean operators (AND, OR, NOT) for complex queries
- 🔤 **Phrase Parsing**: Parse complex queries with quoted phrases ("new york")
- 🌍 **Language Detection**: Auto-detect languages from text with confidence scores
- 🔄 **Incremental Updates**: Add/remove items 10-100x faster than rebuilding
- 📊 **Configurable Scoring**: Customizable thresholds and edit distances
- 📦 **Zero Dependencies**: Lightweight and self-contained

## 📦 Installation

### NPM / Yarn / PNPM

```bash
npm install fuzzyfindjs
```

```bash
yarn add fuzzyfindjs
```

```bash
pnpm add fuzzyfindjs
```

### CDN (Browser)

For quick prototyping or simple projects, you can use FuzzyFindJS directly from a CDN:

```html
<!-- unpkg - latest version -->
<script src="https://unpkg.com/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>

<!-- unpkg - specific version (recommended for production) -->
<script src="https://unpkg.com/fuzzyfindjs@1.0.12/dist/umd/fuzzyfindjs.min.js"></script>

<!-- jsdelivr - latest version -->
<script src="https://cdn.jsdelivr.net/npm/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>

<!-- jsdelivr - specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/fuzzyfindjs@1.0.12/dist/umd/fuzzyfindjs.min.js"></script>
```

**Bundle Size:** 23.7 KB minified, 7.5 KB gzipped

The library will be available globally as `FuzzyFindJS`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>FuzzyFindJS CDN Example</title>
</head>
<body>
    <input type="text" id="search" placeholder="Search...">
    <ul id="results"></ul>

    <script src="https://unpkg.com/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>
    <script>
        // Access the library from the global FuzzyFindJS object
        const { createFuzzySearch } = FuzzyFindJS;
        
        // Create search instance
        const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];
        const search = createFuzzySearch(items, {
            languages: ['english'],
            performance: 'fast',
            maxResults: 5
        });
        
        // Handle search input
        document.getElementById('search').addEventListener('input', (e) => {
            const results = search.search(e.target.value);
            const resultsList = document.getElementById('results');
            
            resultsList.innerHTML = results
                .map(r => `<li>${r.display} (${r.score.toFixed(2)})</li>`)
                .join('');
        });
    </script>
</body>
</html>
```

## 🎮 Try the Interactive Demo

Want to test the library before installing? Run the interactive demo dashboard:

```bash
git clone https://github.com/LucaIsMyName/fuzzyfindjs.git
cd fuzzyfindjs
npm install
npm run dev
```

The demo opens at `http://localhost:3000` with:
- 🔍 Real-time fuzzy search testing
- 📚 5 pre-loaded dictionaries (German Healthcare, Cities, English Tech, Multi-language, Large Dataset)
- ⚙️ Live configuration controls (performance modes, features, thresholds)
- 📊 Performance metrics and debug information
- 💾 Auto-saves your settings to localStorage
- `apps/speed-test.html`: Comparison between different performance modes and with fuse.js
- `apps/ajax-search.html`: AJAX search example with a Shop-Like Interface
- `apps/search-text.html`: Search a large text corpus adn highlight matching Words. FQL is enabled.

## 🚀 Quick Start

```typescript
import { createFuzzySearch } from 'fuzzyfindjs';

// Create a search instance with your dictionary
const search = createFuzzySearch([
  'Hospital',
  'Pharmacy',
  'Doctor',
  'Dentist',
  'Kindergarten',
  // ...
]);

// Search with typos, partial words, phonetic similarity
const results = search.search('hospitl');
// [{ display: 'Hospital', score: 0.92, ... }]

const results2 = search.search('farmacy');
// [{ display: 'Pharmacy', score: 0.88, ... }]

// German example
const germanSearch = createFuzzySearch([
  'Krankenhaus',
  'Apotheke',
  'Zahnarzt'
], {
  languages: ['german']
});

const results3 = germanSearch.search('krankenh');
// [{ display: 'Krankenhaus', score: 0.95, ... }]
```

## 🎛️ API

### Core Functions

#### `buildFuzzyIndex(words, options?)`

Creates a searchable index from strings or objects. Supports multi-field indexing for complex data structures.

**Signature:**
```typescript
function buildFuzzyIndex(
  words: (string | object)[],
  options?: BuildIndexOptions
): FuzzyIndex
```

**Parameters:**
- `words` - Array of strings or objects to index
- `options.config` - Fuzzy search configuration (languages, features, performance)
- `options.fields` - Field names to index (required for objects)
- `options.fieldWeights` - Weight multipliers for each field
- `options.languageProcessors` - Custom language processors
- `options.onProgress` - Progress callback `(processed, total) => void`
- `options.useInvertedIndex` - Force inverted index (auto-enabled for 10k+ items)

**Returns:** `FuzzyIndex` object

**Example 1: Simple string array**
```typescript
import { buildFuzzyIndex } from 'fuzzyfindjs';

const cities = ['Berlin', 'München', 'Hamburg', 'Frankfurt'];
const index = buildFuzzyIndex(cities, {
  config: {
    languages: ['german'],
    performance: 'balanced'
  }
});
```

**Example 2: Multi-field objects**
```typescript
const products = [
  { name: 'iPhone 15', brand: 'Apple', price: 999, category: 'Phones' },
  { name: 'Galaxy S24', brand: 'Samsung', price: 899, category: 'Phones' },
  { name: 'MacBook Pro', brand: 'Apple', price: 1999, category: 'Laptops' }
];

const index = buildFuzzyIndex(products, {
  fields: ['name', 'brand', 'category', 'price'],
  fieldWeights: {
    name: 2.0,    // Name matches weighted 2x
    brand: 1.5,   // Brand matches weighted 1.5x
    category: 1.0 // Category normal weight
  }
});
```

**Example 3: Large dataset with progress**
```typescript
const largeDataset = [...]; // 100k items

const index = buildFuzzyIndex(largeDataset, {
  config: { performance: 'fast' },
  onProgress: (processed, total) => {
    console.log(`Progress: ${(processed/total*100).toFixed(1)}%`);
  }
});
```

---

#### `getSuggestions(index, query, maxResults?, options?)`

Searches the index and returns ranked results. Supports filtering, sorting, and advanced search options.

**Signature:**
```typescript
function getSuggestions(
  index: FuzzyIndex,
  query: string,
  maxResults?: number,
  options?: SearchOptions
): SuggestionResult[]
```

**Parameters:**
- `index` - The fuzzy index from `buildFuzzyIndex()`
- `query` - Search query string
- `maxResults` - Maximum results to return (default: from config)
- `options.fuzzyThreshold` - Override threshold (0-1, default: 0.75)
- `options.languages` - Filter by specific languages
- `options.matchTypes` - Filter by match types ('exact', 'fuzzy', 'phonetic', etc.)
- `options.debug` - Include debug information
- `options.includeHighlights` - Include match position highlights
- `options.enableFQL` - Enable Fuzzy Query Language (AND/OR/NOT operators)
- `options.filters` - E-commerce filters (range, term, boolean)
- `options.sort` - Custom sorting configuration

**Returns:** Array of `SuggestionResult` objects

**Example 1: Basic search**
```typescript
import { getSuggestions } from 'fuzzyfindjs';

const results = getSuggestions(index, 'berln', 5);
// Returns: [{ display: 'Berlin', score: 0.92, ... }]

results.forEach(r => {
  console.log(`${r.display} (${(r.score * 100).toFixed(0)}% match)`);
});
```

**Example 2: Search with filters and sorting**
```typescript
const results = getSuggestions(index, 'phone', 10, {
  filters: {
    ranges: [{ field: 'price', min: 500, max: 1500 }],
    terms: [{ field: 'brand', values: ['Apple', 'Samsung'] }],
    booleans: [{ field: 'inStock', value: true }]
  },
  sort: {
    primary: { field: 'price', order: 'asc' },
    secondary: { field: 'rating', order: 'desc' }
  }
});
```

**Example 3: Debug mode**
```typescript
const results = getSuggestions(index, 'hospitl', 5, {
  debug: true,
  includeHighlights: true
});

results.forEach(r => {
  console.log(r.display);
  console.log('Match type:', r._debug_matchType);
  console.log('Highlights:', r.highlights);
});
```

---

#### `batchSearch(index, queries, maxResults?)`

Searches multiple queries at once with automatic deduplication.

**Signature:**
```typescript
function batchSearch(
  index: FuzzyIndex,
  queries: string[],
  maxResults?: number
): Map<string, SuggestionResult[]>
```

**Parameters:**
- `index` - The fuzzy index
- `queries` - Array of search queries
- `maxResults` - Maximum results per query

**Returns:** Map of query → results

**Example:**
```typescript
import { batchSearch } from 'fuzzyfindjs';

const queries = ['berln', 'munchen', 'hambur'];
const results = batchSearch(index, queries, 3);

results.forEach((suggestions, query) => {
  console.log(`Query: "${query}"`);
  suggestions.forEach(s => console.log(`  - ${s.display}`));
});
```

---

#### `updateIndex(index, newWords)`

Incrementally adds new items to an existing index.

**Signature:**
```typescript
function updateIndex(
  index: FuzzyIndex,
  newWords: (string | object)[]
): FuzzyIndex
```

**Parameters:**
- `index` - Existing index to update
- `newWords` - New items to add

**Returns:** Updated index (mutates original)

**Example:**
```typescript
import { updateIndex } from 'fuzzyfindjs';

// Initial index
const index = buildFuzzyIndex(['Apple', 'Banana']);

// Add new items later
updateIndex(index, ['Cherry', 'Date', 'Elderberry']);

// Index now contains all 5 items
const results = getSuggestions(index, 'cherry');
```

---

#### `removeFromIndex(index, wordsToRemove)`

Removes items from an existing index.

**Signature:**
```typescript
function removeFromIndex(
  index: FuzzyIndex,
  wordsToRemove: string[]
): FuzzyIndex
```

**Parameters:**
- `index` - Existing index
- `wordsToRemove` - Items to remove (exact match)

**Returns:** Updated index (mutates original)

**Example:**
```typescript
import { removeFromIndex } from 'fuzzyfindjs';

const index = buildFuzzyIndex(['Apple', 'Banana', 'Cherry']);

// Remove items
removeFromIndex(index, ['Banana']);

// Index now only contains Apple and Cherry
const results = getSuggestions(index, 'ban'); // Returns empty
```

---

#### `createFuzzySearch(dictionary, options?)`

Wrapper that combines index building and searching into a single object.

**Signature:**
```typescript
function createFuzzySearch(
  dictionary: string[],
  options?: {
    languages?: string[];
    performance?: 'fast' | 'balanced' | 'comprehensive';
    maxResults?: number;
  }
): { search: (query: string, maxResults?: number) => SuggestionResult[]; index: FuzzyIndex }
```

**Parameters:**
- `dictionary` - Array of strings to search
- `options` - Quick configuration

**Returns:** Object with `search()` method and `index` property

**Example:**
```typescript
import { createFuzzySearch } from 'fuzzyfindjs';

const fuzzy = createFuzzySearch(['Berlin', 'München', 'Hamburg'], {
  languages: ['german'],
  performance: 'fast',
  maxResults: 5
});

// Search directly
const results = fuzzy.search('berln');

// Access underlying index
console.log(fuzzy.index.base.length); // 3
```

### Configuration

#### `FuzzyConfig`

Complete configuration interface:

```typescript
interface FuzzyConfig {
  // Languages to enable
  languages: string[];  // default: ['english']
  
  // Features to enable
  features: FuzzyFeature[];
  
  // Performance mode
  performance: 'fast' | 'balanced' | 'comprehensive';  // default: 'balanced'
  
  // Maximum results to return
  maxResults: number;  // default: 10
  
  // Minimum query length
  minQueryLength: number;  // default: 2
  
  // Fuzzy matching threshold (0-1)
  fuzzyThreshold: number;  // default: 0.75
  
  // Maximum edit distance
  maxEditDistance: number;  // default: 2
  
  // N-gram size for partial matching
  ngramSize: number;  // default: 3
  
  // Custom synonym dictionaries
  customSynonyms?: Record<string, string[]>;
  
  // Custom normalization function
  customNormalizer?: (word: string) => string;

  // Enable FQL
  enableFQL?: boolean;

  // Enable Inverted Index
  enableInvertedIndex?: boolean;

  // Enable Highlighting
  enableHighlighting?: boolean;

  // Enable Debugging
  debug?: boolean;

  // Enable Progress Callback
  onProgress?: (processed: number, total: number) => void;

}
```

#### Available Features

```typescript
type FuzzyFeature = 
  | 'phonetic'           // Phonetic matching (sounds-like)
  | 'compound'           // Compound word splitting (German)
  | 'synonyms'           // Synonym matching
  | 'keyboard-neighbors' // Keyboard typo tolerance
  | 'partial-words'      // Prefix/substring matching
  | 'missing-letters'    // Handle omitted characters
  | 'extra-letters'      // Handle extra characters
  | 'transpositions';    // Handle swapped characters
```

#### Performance Presets

```typescript
import { PERFORMANCE_CONFIGS } from 'fuzzyfindjs';

// Fast: Minimal features, quick searches
PERFORMANCE_CONFIGS.fast

// Balanced: Good mix of features and speed (default)
PERFORMANCE_CONFIGS.balanced

// Comprehensive: All features, best accuracy
PERFORMANCE_CONFIGS.comprehensive
```

### Types

#### `SuggestionResult`

```typescript
interface SuggestionResult {
  display: string;      // Formatted display text
  baseWord: string;     // Original matched word
  isSynonym: boolean;   // True if matched via synonym
  score: number;        // Confidence score (0-1)
  language?: string;    // Language that matched
}
```

#### `BuildIndexOptions`

```typescript
interface BuildIndexOptions {
  config?: Partial<FuzzyConfig>;
  languageProcessors?: LanguageProcessor[];
  onProgress?: (processed: number, total: number) => void;
}
```

#### `SearchOptions`

```typescript
interface SearchOptions {
  maxResults?: number;
  fuzzyThreshold?: number;
  languages?: string[];
  matchTypes?: MatchType[];
  debug?: boolean;
}
```

### Utility Functions

#### `serializeIndex(index)`

Converts index to JSON string for storage.

```typescript
import { serializeIndex } from 'fuzzyfindjs';

const index = buildFuzzyIndex(['Apple', 'Banana']);
const json = serializeIndex(index);
localStorage.setItem('search-index', json);
```

#### `deserializeIndex(json)`

Reconstructs index from JSON string.

```typescript
import { deserializeIndex } from 'fuzzyfindjs';

const json = localStorage.getItem('search-index');
const index = deserializeIndex(json);
const results = getSuggestions(index, 'aple');
```

#### `saveIndexToLocalStorage(index, key)`

Saves index to browser localStorage.

```typescript
import { saveIndexToLocalStorage } from 'fuzzyfindjs';

saveIndexToLocalStorage(index, 'my-search-index');
```

#### `loadIndexFromLocalStorage(key)`

Loads index from browser localStorage.

```typescript
import { loadIndexFromLocalStorage } from 'fuzzyfindjs';

const index = loadIndexFromLocalStorage('my-search-index');
if (index) {
  const results = getSuggestions(index, 'query');
}
```

#### `getSerializedSize(index)`

Returns size of serialized index in bytes.

```typescript
import { getSerializedSize } from 'fuzzyfindjs';

const sizeBytes = getSerializedSize(index);
console.log(`Index size: ${(sizeBytes / 1024).toFixed(2)} KB`);
```

#### `applyFilters(results, filters)`

Applies filters to search results.

```typescript
import { applyFilters } from 'fuzzyfindjs';

const allResults = getSuggestions(index, 'phone');
const filtered = applyFilters(allResults, {
  ranges: [{ field: 'price', min: 500, max: 1000 }],
  terms: [{ field: 'brand', values: ['Apple', 'Samsung'] }],
  booleans: [{ field: 'inStock', value: true }]
});
```

#### `applySorting(results, sortConfig)`

Applies custom sorting to results.

```typescript
import { applySorting } from 'fuzzyfindjs';

const results = getSuggestions(index, 'laptop');
const sorted = applySorting(results, {
  primary: { field: 'price', order: 'asc' },
  secondary: { field: 'rating', order: 'desc' },
  keepRelevance: true
});
```
#### `calculateHighlights(match, query, text)`

Calculates character positions where query matches text.

```typescript
import { calculateHighlights } from 'fuzzyfindjs';

const highlights = calculateHighlights(match, 'berln', 'Berlin');
// Returns: [{ start: 0, end: 3 }, { start: 4, end: 5 }]
```

#### `formatHighlightedHTML(text, highlights)`

Wraps highlighted portions in HTML tags.

```typescript
import { formatHighlightedHTML } from 'fuzzyfindjs';

const html = formatHighlightedHTML('Berlin', highlights);
// Returns: '<mark>Ber</mark>li<mark>n</mark>'
```
#### `removeAccents(text)`

Removes accents from text.

```typescript
import { removeAccents } from 'fuzzyfindjs';

removeAccents('café'); // 'cafe'
removeAccents('naïve'); // 'naive'
removeAccents('Müller'); // 'Muller'
```

#### `hasAccents(text)`

Checks if text contains accents.

```typescript
import { hasAccents } from 'fuzzyfindjs';

hasAccents('café'); // true
hasAccents('cafe'); // false
```

#### `normalizeForComparison(text)`

Normalizes text for comparison (lowercase + remove accents).

```typescript
import { normalizeForComparison } from 'fuzzyfindjs';

normalizeForComparison('Café'); // 'cafe'
normalizeForComparison('NAÏVE'); // 'naive'
```

#### `getAccentVariants(text)`

Generates all accent variants of text.

```typescript
import { getAccentVariants } from 'fuzzyfindjs';

getAccentVariants('cafe');
// Returns: ['cafe', 'café', 'cafè', 'cafê', ...]
```

#### `filterStopWords(text, stopWords)`

Removes stop words from text.

```typescript
import { filterStopWords } from 'fuzzyfindjs';

filterStopWords('the quick brown fox', ['the', 'a']);
// Returns: 'quick brown fox'
```

#### `isStopWord(word, stopWords)`

Checks if word is a stop word.

```typescript
import { isStopWord } from 'fuzzyfindjs';

isStopWord('the', ['the', 'a', 'an']); // true
isStopWord('fox', ['the', 'a', 'an']); // false
```

#### `getStopWordsForLanguages(languages)`

Gets stop words for specified languages.

```typescript
import { getStopWordsForLanguages } from 'fuzzyfindjs';

const stopWords = getStopWordsForLanguages(['english', 'german']);
// Returns: ['the', 'a', 'an', 'der', 'die', 'das', ...]
```

#### `DEFAULT_STOP_WORDS`

Pre-defined stop words for common languages.

```typescript
import { DEFAULT_STOP_WORDS } from 'fuzzyfindjs';

console.log(DEFAULT_STOP_WORDS.english);
// ['the', 'a', 'an', 'is', 'at', 'on', ...]
```

#### `isWordBoundary(char)`

Checks if character is a word boundary.

```typescript
import { isWordBoundary } from 'fuzzyfindjs';

isWordBoundary(' '); // true
isWordBoundary('-'); // true
isWordBoundary('a'); // false
```

#### `matchesAtWordBoundary(text, query)`

Checks if query matches at word boundary.

```typescript
import { matchesAtWordBoundary } from 'fuzzyfindjs';

matchesAtWordBoundary('hello world', 'world'); // true
matchesAtWordBoundary('hello world', 'orld'); // false
```

#### `findWordBoundaryMatches(text, query)`

Finds all word boundary matches.

```typescript
import { findWordBoundaryMatches } from 'fuzzyfindjs';

findWordBoundaryMatches('hello world hello', 'hello');
// Returns: [{ start: 0, end: 5 }, { start: 12, end: 17 }]
```

#### `matchesWord(text, word)`

Checks if text contains exact word.

```typescript
import { matchesWord } from 'fuzzyfindjs';

matchesWord('hello world', 'hello'); // true
matchesWord('hello world', 'hel'); // false
```

#### `matchesWildcard(text, pattern)`

Matches text against wildcard pattern.

```typescript
import { matchesWildcard } from 'fuzzyfindjs';

matchesWildcard('application', 'app*'); // true
matchesWildcard('category', 'cat*'); // true
matchesWildcard('dog', 'cat*'); // false
```

#### `dataToIndex(data, options)`

Extracts searchable text from structured data.

```typescript
import { dataToIndex } from 'fuzzyfindjs';

const html = '<div><h1>Title</h1><p>Content</p></div>';
const words = dataToIndex(html, { type: 'html' });
// Returns: ['Title', 'Content']

const json = { name: 'John', email: 'john@example.com' };
const words2 = dataToIndex(json, { type: 'json' });
// Returns: ['John', 'john@example.com']
```

#### `dataToIndexAsync(data, options)`

Async version of dataToIndex for large datasets.

```typescript
import { dataToIndexAsync } from 'fuzzyfindjs';

const largeHtml = '...'; // Large HTML document
const words = await dataToIndexAsync(largeHtml, {
  type: 'html',
  chunkSize: 1000
});
```
#### `parseQuery(query)`

Parses query into terms and phrases.

```typescript
import { parseQuery } from 'fuzzyfindjs';

const parsed = parseQuery('hello "new york" world');
// Returns: {
//   terms: ['hello', 'world'],
//   phrases: ['new york'],
//   hasPhrases: true
// }
```

#### `hasPhraseSyntax(query)`

Checks if query contains phrase syntax (quotes).

```typescript
import { hasPhraseSyntax } from 'fuzzyfindjs';

hasPhraseSyntax('"new york"'); // true
hasPhraseSyntax('new york'); // false
```

#### `normalizePhrase(phrase)`

Normalizes phrase for matching.

```typescript
import { normalizePhrase } from 'fuzzyfindjs';

normalizePhrase('"New York"'); // 'new york'
```

#### `splitPhraseWords(phrase)`

Splits phrase into individual words.

```typescript
import { splitPhraseWords } from 'fuzzyfindjs';

splitPhraseWords('new york city'); // ['new', 'york', 'city']
```
#### `detectLanguages(text)`

Detects languages in text.

```typescript
import { detectLanguages } from 'fuzzyfindjs';

const languages = detectLanguages('Hello Krankenhaus café');
// Returns: ['english', 'german', 'french']
```

#### `detectLanguagesWithConfidence(text)`

Detects languages with confidence scores.

```typescript
import { detectLanguagesWithConfidence } from 'fuzzyfindjs';

const results = detectLanguagesWithConfidence('Hello world');
// Returns: [{ language: 'english', confidence: 0.95 }]
```

#### `sampleTextForDetection(words, sampleSize)`

Samples text for language detection.

```typescript
import { sampleTextForDetection } from 'fuzzyfindjs';

const sample = sampleTextForDetection(largeArray, 100);
// Returns first 100 items concatenated
```

#### `isValidLanguage(language)`

Checks if language is supported.

```typescript
import { isValidLanguage } from 'fuzzyfindjs';

isValidLanguage('english'); // true
isValidLanguage('klingon'); // false
```

#### `normalizeLanguageCode(code)`

Normalizes language code.

```typescript
import { normalizeLanguageCode } from 'fuzzyfindjs';

normalizeLanguageCode('en'); // 'english'
normalizeLanguageCode('de'); // 'german'
```

#### `SearchCache`

LRU cache for search results.

```typescript
import { SearchCache } from 'fuzzyfindjs';

const cache = new SearchCache(100); // Max 100 entries

// Manual caching
cache.set('query', results, 10);
const cached = cache.get('query', 10);

// Stats
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

// Clear
cache.clear();
```

#### `LRUCache`

Generic LRU cache.

```typescript
import { LRUCache } from 'fuzzyfindjs';

const cache = new LRUCache<string, any>(50);

cache.set('key', { data: 'value' });
const value = cache.get('key');

console.log(cache.size); // 1
cache.clear();
```

#### `DEFAULT_CONFIG`

Default configuration object.

```typescript
import { DEFAULT_CONFIG } from 'fuzzyfindjs';

console.log(DEFAULT_CONFIG.languages); // ['english']
console.log(DEFAULT_CONFIG.performance); // 'balanced'
console.log(DEFAULT_CONFIG.fuzzyThreshold); // 0.75
```

#### `PERFORMANCE_CONFIGS`

Pre-defined performance configurations.

```typescript
import { PERFORMANCE_CONFIGS } from 'fuzzyfindjs';

// Fast mode
const fastConfig = PERFORMANCE_CONFIGS.fast;

// Balanced mode
const balancedConfig = PERFORMANCE_CONFIGS.balanced;

// Comprehensive mode
const comprehensiveConfig = PERFORMANCE_CONFIGS.comprehensive;
```

#### `mergeConfig(userConfig)`

Merges user config with defaults.

```typescript
import { mergeConfig } from 'fuzzyfindjs';

const config = mergeConfig({
  languages: ['german'],
  maxResults: 20
});
// Returns complete config with defaults filled in
```

## 💡 Usage Examples

### Browser: CDN Usage

#### Basic Search with Vanilla JavaScript

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FuzzyFindJS - Simple Search</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; }
        input { width: 100%; padding: 10px; font-size: 16px; }
        ul { list-style: none; padding: 0; }
        li { padding: 8px; border-bottom: 1px solid #eee; }
        .score { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🔍 Fuzzy Search Demo</h1>
    <input type="text" id="search" placeholder="Type to search..." autofocus>
    <ul id="results"></ul>

    <script src="https://unpkg.com/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>
    <script>
        const { createFuzzySearch } = FuzzyFindJS;
        
        const fruits = [
            'Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry',
            'Cherry', 'Coconut', 'Cranberry', 'Date', 'Dragonfruit',
            'Elderberry', 'Fig', 'Grape', 'Grapefruit', 'Guava',
            'Kiwi', 'Lemon', 'Lime', 'Mango', 'Orange', 'Papaya',
            'Peach', 'Pear', 'Pineapple', 'Plum', 'Raspberry',
            'Strawberry', 'Watermelon'
        ];
        
        const search = createFuzzySearch(fruits, {
            languages: ['english'],
            performance: 'fast',
            maxResults: 10
        });
        
        const searchInput = document.getElementById('search');
        const resultsList = document.getElementById('results');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            
            if (query.length < 2) {
                resultsList.innerHTML = '';
                return;
            }
            
            const results = search.search(query);
            
            if (results.length === 0) {
                resultsList.innerHTML = '<li>No results found</li>';
                return;
            }
            
            resultsList.innerHTML = results
                .map(r => `
                    <li>
                        <strong>${r.display}</strong>
                        <span class="score">Score: ${r.score.toFixed(2)}</span>
                    </li>
                `)
                .join('');
        });
    </script>
</body>
</html>
```

#### Multi-language Search

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Multi-language Fuzzy Search</title>
</head>
<body>
    <h1>🌍 Multi-language Search</h1>
    <input type="text" id="search" placeholder="Search in any language...">
    <div id="results"></div>

    <script src="https://unpkg.com/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>
    <script>
        const { createFuzzySearch } = FuzzyFindJS;
        
        // Dictionary with German, English, French, Spanish words
        const places = [
            'Krankenhaus', 'Hospital', 'Hôpital', 'Hospital',
            'Schule', 'School', 'École', 'Escuela',
            'Apotheke', 'Pharmacy', 'Pharmacie', 'Farmacia',
            'Bahnhof', 'Station', 'Gare', 'Estación',
            'Flughafen', 'Airport', 'Aéroport', 'Aeropuerto'
        ];
        
        const search = createFuzzySearch(places, {
            languages: ['german', 'english', 'french', 'spanish'],
            performance: 'comprehensive',
            features: ['phonetic', 'partial-words', 'synonyms'],
            maxResults: 15
        });
        
        document.getElementById('search').addEventListener('input', (e) => {
            const results = search.search(e.target.value);
            const output = document.getElementById('results');
            
            output.innerHTML = results.length 
                ? results.map(r => `<p>${r.display} (${r.score.toFixed(2)})</p>`).join('')
                : '<p>No results</p>';
        });
    </script>
</body>
</html>
```

#### Autocomplete Dropdown

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Autocomplete with FuzzyFindJS</title>
    <style>
        .autocomplete {
            position: relative;
            width: 400px;
            margin: 50px auto;
        }
        .autocomplete input {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 4px;
        }
        .autocomplete-items {
            position: absolute;
            border: 1px solid #ddd;
            border-top: none;
            z-index: 99;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 300px;
            overflow-y: auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .autocomplete-item {
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        }
        .autocomplete-item:hover {
            background-color: #e9e9e9;
        }
        .autocomplete-active {
            background-color: #4CAF50 !important;
            color: white;
        }
    </style>
</head>
<body>
    <div class="autocomplete">
        <input type="text" id="cityInput" placeholder="Search cities...">
        <div id="autocomplete-list" class="autocomplete-items"></div>
    </div>

    <script src="https://unpkg.com/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>
    <script>
        const { createFuzzySearch } = FuzzyFindJS;
        
        const cities = [
            'Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt',
            'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
            'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg'
        ];
        
        const search = createFuzzySearch(cities, {
            languages: ['german'],
            performance: 'fast',
            maxResults: 8
        });
        
        const input = document.getElementById('cityInput');
        const list = document.getElementById('autocomplete-list');
        
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            list.innerHTML = '';
            
            if (query.length < 2) return;
            
            const results = search.search(query);
            
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = result.display;
                item.addEventListener('click', () => {
                    input.value = result.display;
                    list.innerHTML = '';
                });
                list.appendChild(item);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete')) {
                list.innerHTML = '';
            }
        });
    </script>
</body>
</html>
```

### Frontend: Autocomplete Search

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// Build index once on app initialization
const cities = ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt'];
const cityIndex = buildFuzzyIndex(cities, {
  config: { languages: ['german'], performance: 'fast' }
});

// Use in search input handler
function handleSearchInput(query: string) {
  const results = getSuggestions(cityIndex, query, 5);
  updateAutocompleteDropdown(results);
}

// Handles: "munchen" → "München", "berln" → "Berlin"
```

### Backend: API Search Endpoint

```typescript
import express from 'express';
import { createFuzzySearch } from 'fuzzyfindjs';

const app = express();

// Load product catalog
const products = await loadProductsFromDatabase();
const productNames = products.map(p => p.name);

// Build search index
const search = createFuzzySearch(productNames, {
  languages: ['english', 'german'],
  performance: 'balanced',
  maxResults: 20
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const query = req.query.q as string;
  const results = search.search(query);
  
  // Map back to full product objects
  const products = results.map(r => 
    products.find(p => p.name === r.baseWord)
  );
  
  res.json(products);
});
```

### Async Dictionary Loading (Fetch from API/Database)

**The library is fully synchronous** - no async methods needed! This gives you complete control over when and how to load your dictionary.

#### Pattern 1: Load Once on App Startup

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// Fetch dictionary from API
async function initializeSearch() {
  // Load your dictionary from any source
  const response = await fetch('/api/dictionary');
  const words = await response.json();
  
  // Build index synchronously (fast!)
  const index = buildFuzzyIndex(words, {
    config: {
      languages: ['english'],
      performance: 'balanced'
    }
  });
  
  return index;
}

// Initialize once
let searchIndex;
initializeSearch().then(index => {
  searchIndex = index;
  console.log('Search ready!');
});

// Use in your app
function search(query) {
  if (!searchIndex) {
    return []; // Or show loading state
  }
  return getSuggestions(searchIndex, query);
}
```

#### Pattern 2: React with useState/useEffect

```typescript
import { useState, useEffect } from 'react';
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

function SearchComponent() {
  const [index, setIndex] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dictionary on mount
  useEffect(() => {
    async function loadDictionary() {
      try {
        const response = await fetch('/api/products');
        const products = await response.json();
        const words = products.map(p => p.name);
        
        // Build index (synchronous, fast)
        const searchIndex = buildFuzzyIndex(words, {
          config: { languages: ['english'], performance: 'fast' }
        });
        
        setIndex(searchIndex);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDictionary();
  }, []);

  const handleSearch = (query) => {
    if (!index || !query) {
      setResults([]);
      return;
    }
    
    const matches = getSuggestions(index, query, 10);
    setResults(matches);
  };

  if (loading) return <div>Loading search...</div>;
  
  return (
    <div>
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results.map(r => <li key={r.baseWord}>{r.display}</li>)}
      </ul>
    </div>
  );
}
```

#### Pattern 3: Node.js with Database

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';
import { MongoClient } from 'mongodb';

class ProductSearch {
  private index = null;
  
  async initialize() {
    // Connect to database
    const client = await MongoClient.connect(process.env.MONGO_URL);
    const db = client.db('myapp');
    
    // Fetch all product names
    const products = await db.collection('products')
      .find({}, { projection: { name: 1 } })
      .toArray();
    
    const words = products.map(p => p.name);
    
    // Build index synchronously
    this.index = buildFuzzyIndex(words, {
      config: {
        languages: ['english', 'german'],
        performance: 'balanced',
        maxResults: 20
      },
      onProgress: (processed, total) => {
        console.log(`Indexing: ${processed}/${total}`);
      }
    });
    
    console.log(`Indexed ${words.length} products`);
    await client.close();
  }
  
  search(query) {
    if (!this.index) {
      throw new Error('Search not initialized');
    }
    return getSuggestions(this.index, query);
  }
}

// Usage
const search = new ProductSearch();
await search.initialize();

app.get('/search', (req, res) => {
  const results = search.search(req.query.q);
  res.json(results);
});
```

#### Pattern 4: Dynamic Re-indexing

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

class DynamicSearch {
  private index = null;
  private lastUpdate = 0;
  private updateInterval = 5 * 60 * 1000; // 5 minutes
  
  async refreshIndex() {
    const now = Date.now();
    
    // Only refresh if enough time has passed
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }
    
    console.log('Refreshing search index...');
    
    // Fetch latest data
    const response = await fetch('/api/dictionary?updated_since=' + this.lastUpdate);
    const words = await response.json();
    
    // Rebuild index (fast, even for large dictionaries)
    this.index = buildFuzzyIndex(words, {
      config: { languages: ['english'], performance: 'fast' }
    });
    
    this.lastUpdate = now;
    console.log(`Index refreshed with ${words.length} words`);
  }
  
  async search(query) {
    // Auto-refresh if needed
    await this.refreshIndex();
    
    if (!this.index) {
      throw new Error('Index not initialized');
    }
    
    return getSuggestions(this.index, query);
  }
}
```

#### Key Points

✅ **No async needed in the library** - `buildFuzzyIndex()` is synchronous and fast

✅ **Fetch your dictionary however you want:**
- REST API (`fetch`, `axios`)
- Database (MongoDB, PostgreSQL, etc.)
- File system (`fs.readFile`)
- GraphQL
- WebSocket
- Any async source!

✅ **Index building is fast:**
- 1,000 words: ~10ms
- 10,000 words: ~50-250ms (depending on performance mode)
- 100,000 words: ~500ms-2s

✅ **Build once, search many times:**
- Building the index is the "expensive" operation
- Searching is extremely fast (<1ms per query)
- Cache the index in memory for best performance

✅ **Re-indexing strategies:**
- **Static**: Build once on app startup
- **Periodic**: Rebuild every N minutes/hours
- **On-demand**: Rebuild when data changes
- **Incremental**: Keep old index, build new one in background

### Multi-language Search

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

const multiLangDictionary = [
  'Hospital', 'Krankenhaus', 'Hôpital', 'Hospital',
  'School', 'Schule', 'École', 'Escuela',
  'Car', 'Auto', 'Voiture', 'Coche'
];

const index = buildFuzzyIndex(multiLangDictionary, {
  config: {
    languages: ['english', 'german', 'french', 'spanish'],
    performance: 'comprehensive',
    features: ['phonetic', 'partial-words', 'synonyms']
  }
});

// Search works across all languages
getSuggestions(index, 'kranken');  // Finds "Krankenhaus"
getSuggestions(index, 'hospit');   // Finds all hospital variants
getSuggestions(index, 'ecol');     // Finds "École", "Escuela", "School"
```

### Custom Synonyms

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

const medicalTerms = ['Physician', 'Nurse', 'Surgeon', 'Therapist'];

const index = buildFuzzyIndex(medicalTerms, {
  config: {
    languages: ['english'],
    features: ['synonyms', 'phonetic'],
    customSynonyms: {
      'physician': ['doctor', 'doc', 'md'],
      'nurse': ['rn', 'caregiver'],
      'surgeon': ['doctor', 'md', 'specialist']
    }
  }
});

// Synonym matching works
getSuggestions(index, 'doctor');  // Finds "Physician", "Surgeon"
getSuggestions(index, 'doc');     // Finds "Physician"
```

### Large Dataset with Progress

```typescript
import { buildFuzzyIndex } from 'fuzzyfindjs';

const largeDictionary = await loadMillionWords();

const index = buildFuzzyIndex(largeDictionary, {
  config: {
    languages: ['english'],
    performance: 'fast'  // Optimize for large datasets
  },
  onProgress: (processed, total) => {
    const percent = ((processed / total) * 100).toFixed(1);
    console.log(`Building index: ${percent}%`);
    updateProgressBar(percent);
  }
});
```

### React Hook Example

```typescript
import { useState, useMemo } from 'react';
import { createFuzzySearch } from 'fuzzyfindjs';

function useSearch(dictionary: string[]) {
  const [query, setQuery] = useState('');
  
  const search = useMemo(() => 
    createFuzzySearch(dictionary, {
      languages: ['english'],
      performance: 'fast',
      maxResults: 10
    }),
    [dictionary]
  );
  
  const results = useMemo(() => 
    query.length >= 2 ? search.search(query) : [],
    [query, search]
  );
  
  return { query, setQuery, results };
}

// Usage in component
function SearchComponent() {
  const { query, setQuery, results } = useSearch(myDictionary);
  
  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results.map(r => (
          <li key={r.baseWord}>
            {r.display} <span>({r.score.toFixed(2)})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Node.js CLI Tool

```typescript
#!/usr/bin/env node
import { createFuzzySearch } from 'fuzzyfindjs';
import * as readline from 'readline';

const dictionary = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
const search = createFuzzySearch(dictionary);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Fuzzy Search CLI - Type to search, Ctrl+C to exit\n');

rl.on('line', (query) => {
  const results = search.search(query);
  
  if (results.length === 0) {
    console.log('No results found\n');
  } else {
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.display} (${r.score.toFixed(2)})`);
    });
    console.log();
  }
});
```

### Advanced: Custom Language Processor

```typescript
import { 
  buildFuzzyIndex, 
  BaseLanguageProcessor,
  type FuzzyFeature 
} from 'fuzzyfindjs';

class ItalianProcessor extends BaseLanguageProcessor {
  readonly language = 'italian';
  readonly displayName = 'Italiano';
  readonly supportedFeatures: FuzzyFeature[] = [
    'phonetic', 'partial-words', 'synonyms'
  ];
  
  normalize(text: string): string {
    return text.toLowerCase()
      .replace(/à/g, 'a')
      .replace(/è/g, 'e')
      .replace(/é/g, 'e')
      .replace(/ì/g, 'i')
      .replace(/ò/g, 'o')
      .replace(/ù/g, 'u');
  }
  
  getSynonyms(word: string): string[] {
    const synonyms: Record<string, string[]> = {
      'ciao': ['salve', 'buongiorno'],
      'casa': ['abitazione', 'dimora']
    };
    return synonyms[this.normalize(word)] || [];
  }
}

// Use custom processor
const italianWords = ['Ciao', 'Casa', 'Città'];
const index = buildFuzzyIndex(italianWords, {
  languageProcessors: [new ItalianProcessor()]
});
```

## 🎯 Performance Tips

### 1. Choose the Right Performance Mode

```typescript
// For autocomplete (speed critical)
{ performance: 'fast' }

// For general search (balanced)
{ performance: 'balanced' }

// For critical searches (accuracy critical)
{ performance: 'comprehensive' }
```

### 2. Limit Features for Large Datasets

```typescript
// Faster indexing and searching
{
  features: ['partial-words', 'missing-letters'],
  maxEditDistance: 1
}
```

### 3. Build Index Once, Search Many Times

```typescript
// ❌ Bad: Rebuilding index on every search
function search(query) {
  const index = buildFuzzyIndex(dictionary);
  return getSuggestions(index, query);
}

// ✅ Good: Build once, reuse
const index = buildFuzzyIndex(dictionary);
function search(query) {
  return getSuggestions(index, query);
}
```

### 4. Use Appropriate Thresholds

```typescript
// Strict matching (fewer, more accurate results)
{ fuzzyThreshold: 0.9 }

// Lenient matching (more results, some false positives)
{ fuzzyThreshold: 0.6 }
```

### 5. Inverted Index for Large Datasets 

The library automatically uses an **inverted index** for datasets with 10,000+ words, providing 10-100x performance improvement:

```typescript
// Automatically uses inverted index for large datasets
const largeDictionary = Array.from({ length: 100000 }, (_, i) => `Word${i}`);
const index = buildFuzzyIndex(largeDictionary);
// ✨ Inverted index automatically enabled!

// Force inverted index for smaller datasets (optional)
const index = buildFuzzyIndex(smallDictionary, {
  useInvertedIndex: true  // Manual override
});

// Or via config
const index = buildFuzzyIndex(dictionary, {
  config: {
    useInvertedIndex: true
  }
});
```

**Performance comparison:**

| Dataset Size    | Classic Index | Inverted Index | Speedup |
| --------------- | ------------- | -------------- | ------- |
| 1,000 words     | 1ms           | 1ms            | 1x      |
| 10,000 words    | 5ms           | 2ms            | 2.5x    |
| 100,000 words   | 50ms          | 5ms            | **10x** |
| 1,000,000 words | 500ms         | 10ms           | **50x** |

**No code changes required** - the library automatically detects and uses the optimal index structure!

### 6. Match Highlighting 

Get exact positions of matched characters for UI highlighting:

```typescript
// Enable highlighting
const results = getSuggestions(index, 'app', 5, {
  includeHighlights: true
});

// Results include highlight positions
console.log(results[0].highlights);
// → [{ start: 0, end: 3, type: 'prefix' }]

// Format as HTML
import { formatHighlightedHTML } from 'fuzzyfindjs';
const html = formatHighlightedHTML(results[0].display, results[0].highlights);
// → '<mark class="highlight highlight--prefix">App</mark>lication'
```

**Perfect for:**
- Search result highlighting
- Autocomplete UI
- Showing users WHY something matched

### 7. Search Result Caching 

Automatic LRU cache for 10-100x faster repeated queries:

```typescript
// Cache is enabled by default!
const index = buildFuzzyIndex(dictionary);

// First search - cache miss
getSuggestions(index, 'app', 5); // ~5ms

// Second search - cache hit!
getSuggestions(index, 'app', 5); // ~0.1ms (50x faster!)

// Check cache stats
const stats = index._cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

// Disable cache if needed
const index = buildFuzzyIndex(dictionary, {
  config: { enableCache: false }
});

// Custom cache size
const index = buildFuzzyIndex(dictionary, {
  config: { cacheSize: 200 }  // Default: 100
});
```

**Ideal for:**
- Autocomplete (users type incrementally)
- Search-as-you-type
- Repeated queries

### 8. Index Serialization 

Save and load indices for 100x faster startup:

```typescript
import { serializeIndex, deserializeIndex } from 'fuzzyfindjs';

// Build index once
const index = buildFuzzyIndex(largeDictionary);

// Serialize to JSON
const serialized = serializeIndex(index);
localStorage.setItem('search-index', serialized);

// Later: Load instantly (100x faster!)
const loaded = await deserializeIndex(localStorage.getItem('search-index'));
const results = getSuggestions(loaded, 'query'); // Works immediately!

// Get serialized size
import { getSerializedSize } from 'fuzzyfindjs';
const sizeInBytes = getSerializedSize(index);
console.log(`Index size: ${(sizeInBytes / 1024).toFixed(2)} KB`);
```

**Perfect for:**
- Server-side apps (save to disk)
- Browser apps (save to localStorage)
- Skipping index rebuild on startup

**Performance:**
- Index building: ~250ms (10k words)
- Serialization: ~10ms
- Deserialization: ~5ms
- **50-100x faster** than rebuilding!

### 9. Batch Search API 

Search multiple queries at once with automatic deduplication:

```typescript
import { batchSearch } from 'fuzzyfindjs';

// Search multiple queries efficiently
const results = batchSearch(index, ['apple', 'banana', 'cherry']);
// → { apple: [...], banana: [...], cherry: [...] }

// Automatic deduplication
const results = batchSearch(index, ['app', 'app', 'ban', 'app']);
// → { app: [...], ban: [...] }  // Only 2 queries executed!

// Supports all search options
const results = batchSearch(index, ['app', 'ban'], 5, {
  includeHighlights: true,
  fuzzyThreshold: 0.8
});

// Perfect for multi-field forms
const formResults = batchSearch(index, [
  formData.name,
  formData.email,
  formData.phone
]);
```

**Benefits:**
- **Deduplicates** identical queries automatically
- **Cache-friendly** - repeated queries hit cache
- **Cleaner code** - one call instead of multiple
- **Type-safe** - full TypeScript support

**Use cases:**
- Multi-field search forms
- Batch processing
- Server-side batch queries
- Deduplicating search requests

### 10. Accent Normalization 

Automatic handling of accented characters for international support:

```typescript
import { buildFuzzyIndex, getSuggestions, removeAccents } from 'fuzzyfindjs';

// Utility function
removeAccents('café');   // → 'cafe'
removeAccents('José');   // → 'Jose'
removeAccents('Müller'); // → 'Muller'
removeAccents('naïve');  // → 'naive'

// Automatic in search - works bidirectionally!
const index = buildFuzzyIndex(['café', 'naïve', 'José', 'Müller']);

// Search without accents - finds accented words
getSuggestions(index, 'cafe');   // ✅ Finds 'café'
getSuggestions(index, 'naive');  // ✅ Finds 'naïve'
getSuggestions(index, 'Jose');   // ✅ Finds 'José'
getSuggestions(index, 'Muller'); // ✅ Finds 'Müller'

// Search with accents - also works!
const index2 = buildFuzzyIndex(['cafe', 'naive']);
getSuggestions(index2, 'café');  // ✅ Finds 'cafe'
getSuggestions(index2, 'naïve'); // ✅ Finds 'naive'
```

**Supported Languages:**
- 🇫🇷 French: café, crème, naïve, résumé, château
- 🇪🇸 Spanish: José, María, niño, señor, mañana
- 🇩🇪 German: Müller, Köln, Zürich, Straße, Äpfel
- 🇵🇹 Portuguese: São Paulo, açúcar, coração
- 🇵🇱 Polish: Łódź, Kraków, Gdańsk
- And 100+ more accented characters!

**Benefits:**
- **Automatic** - no configuration needed
- **Bidirectional** - café ↔ cafe both work
- **Preserves original** - display text keeps accents
- **Zero overhead** - indexed once, searched fast

**Perfect for:**
- International applications
- Multi-language search
- User-friendly input (users can't always type accents)
- E-commerce with international products

### 11. Field Weighting (Opt-In)

**⚠️ This is an opt-in feature** - By default, FuzzyFindJS works with simple string arrays. Field weighting is only activated when you explicitly provide the `fields` option.

Multi-field search with weighted scoring for better ranking:

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// ✅ DEFAULT: Simple string array (no field weighting)
const simpleIndex = buildFuzzyIndex(['Apple iPhone', 'Samsung Phone', 'Google Pixel']);
const results1 = getSuggestions(simpleIndex, 'phone');
// Works normally with fuzzy matching

// ✅ OPT-IN: Multi-field search with objects
const products = [
  { id: 1, title: 'Apple iPhone', description: 'Smartphone with great camera', category: 'Electronics' },
  { id: 2, title: 'Apple Pie Recipe', description: 'Delicious dessert', category: 'Food' },
  { id: 3, title: 'Samsung Phone', description: 'Apple-like design', category: 'Electronics' }
];

// You MUST specify fields when indexing objects
const index = buildFuzzyIndex(products, {
  fields: ['title', 'description', 'category'],  // Required for objects
  fieldWeights: {                                 // Optional: customize weights
    title: 2.0,        // Title matches worth 2x
    description: 1.0,  // Description matches normal weight
    category: 1.5      // Category matches worth 1.5x
  }
});

// Search for "apple"
const results = getSuggestions(index, 'apple');
// Result order (by weighted score):
// 1. Apple iPhone (title match - 2x weight)
// 2. Apple Pie Recipe (title match - 2x weight)
// 3. Samsung Phone (description match - 1x weight)

// Access field data in results
console.log(results[0].fields);
// → { title: 'Apple iPhone', description: 'Smartphone...', category: 'Electronics' }
```

**Important Notes:**
- 🔴 **Required**: When indexing objects, you **must** specify `fields` option
- ✅ **Optional**: `fieldWeights` are optional (defaults to 1.0 for all fields)
- ✅ **Backwards Compatible**: String arrays work exactly as before
- ⚡ **No Performance Impact**: Only activated when using objects with fields

**Use Cases:**
- 📱 **E-commerce**: Product name > description > tags
- 📄 **Documents**: Title > content > metadata
- 👤 **User Search**: Name > email > bio
- 🎵 **Music**: Song title > artist > album
- 🏢 **Companies**: Company name > industry > description

**Features:**
- ✅ **Weighted Scoring** - Boost important fields
- ✅ **Multi-Field Search** - Search across object properties
- ✅ **Field Preservation** - Results include all field data
- ✅ **Opt-In Only** - Doesn't affect simple string arrays
- ✅ **Automatic Defaults** - Unspecified fields default to 1.0

**Example: Document Search**
```typescript
const docs = [
  { title: 'TypeScript Guide', content: 'Learn TypeScript basics', tags: 'programming' },
  { title: 'JavaScript Intro', content: 'TypeScript is a superset', tags: 'tutorial' }
];

const index = buildFuzzyIndex(docs, {
  fields: ['title', 'content', 'tags'],  // Required!
  fieldWeights: {                         // Optional
    title: 3.0,    // Title most important
    content: 1.0,  // Content normal
    tags: 2.0      // Tags important
  }
});

const results = getSuggestions(index, 'typescript');
// "TypeScript Guide" ranks first (title match with 3x weight)
```

### 12. E-Commerce: Filtering & Sorting

Built-in support for e-commerce use cases with filtering and custom sorting:

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// Index products with multiple fields
const products = [
  { name: "Nike Air Max", brand: "Nike", price: 120, rating: 4.5, inStock: true },
  { name: "Adidas Ultraboost", brand: "Adidas", price: 180, rating: 4.8, inStock: true },
  { name: "Nike React", brand: "Nike", price: 90, rating: 4.2, inStock: false },
  { name: "Puma RS-X", brand: "Puma", price: 110, rating: 4.0, inStock: true },
];

const index = buildFuzzyIndex(products, {
  fields: ["name", "brand", "price", "rating", "inStock"],
});

// Search with filters and sorting
const results = getSuggestions(index, "nike", 10, {
  filters: {
    // Range filters (numeric fields)
    ranges: [
      { field: "price", min: 80, max: 150 },
      { field: "rating", min: 4.0 }
    ],
    // Term filters (categorical fields)
    terms: [
      { field: "brand", values: ["Nike", "Adidas"] }
    ],
    // Boolean filters
    booleans: [
      { field: "inStock", value: true }
    ]
  },
  sort: {
    // Primary sort: price ascending
    primary: { field: "price", order: "asc" },
    // Secondary sort: rating descending (tie-breaker)
    secondary: { field: "rating", order: "desc" },
    // Keep relevance as final tie-breaker (default: true)
    keepRelevance: true
  }
});

// Results are filtered and sorted
results.forEach(result => {
  console.log(result.display);           // "Nike Air Max"
  console.log(result.fields?.price);     // 120
  console.log(result.fields?.rating);    // 4.5
  console.log(result.fields?.inStock);   // true
});
```

**Filter Types:**

```typescript
// Range Filter - Numeric comparisons
interface RangeFilter {
  field: string;
  min?: number;  // Minimum value (inclusive)
  max?: number;  // Maximum value (inclusive)
}

// Term Filter - Categorical matching
interface TermFilter {
  field: string;
  values: any[];           // Values to match
  operator?: "AND" | "OR"; // Default: "OR"
}

// Boolean Filter - True/false matching
interface BooleanFilter {
  field: string;
  value: boolean;
}
```

**Sorting Options:**

```typescript
interface SortConfig {
  primary: SortOption;      // Primary sort field
  secondary?: SortOption;   // Tie-breaker
  keepRelevance?: boolean;  // Use relevance as final tie-breaker (default: true)
}

interface SortOption {
  field: string;
  order: "asc" | "desc";
  type?: "number" | "string" | "date";  // Auto-detected if not specified
}
```

**Real-World E-Commerce Example:**

```typescript
// Product catalog search
const catalog = [
  { name: "iPhone 15 Pro", category: "Phones", price: 999, rating: 4.8, inStock: true },
  { name: "Samsung Galaxy S24", category: "Phones", price: 899, rating: 4.7, inStock: true },
  { name: "iPad Air", category: "Tablets", price: 599, rating: 4.6, inStock: false },
  { name: "MacBook Pro", category: "Laptops", price: 1999, rating: 4.9, inStock: true },
];

const index = buildFuzzyIndex(catalog, {
  fields: ["name", "category", "price", "rating", "inStock"],
});

// User searches "phone" with filters
const results = getSuggestions(index, "phone", 10, {
  filters: {
    ranges: [{ field: "price", max: 1000 }],
    terms: [{ field: "category", values: ["Phones"] }],
    booleans: [{ field: "inStock", value: true }]
  },
  sort: {
    primary: { field: "price", order: "asc" }
  }
});

// Returns: Samsung Galaxy S24 ($899), iPhone 15 Pro ($999)
// Filtered by: price ≤ $1000, category = Phones, inStock = true
// Sorted by: price ascending
```

**Use Cases:**
- 🛒 **Product Search** - Filter by price, category, brand, availability
- 📱 **Marketplace** - Sort by price, rating, popularity
- 🏨 **Booking Sites** - Filter by price range, ratings, availability
- 🍔 **Food Delivery** - Filter by cuisine, price, rating, delivery time
- 🏠 **Real Estate** - Filter by price, bedrooms, location

### 13. Stop Words Filtering

Filter common words that add noise to search results:

```typescript
import { buildFuzzyIndex, getSuggestions, DEFAULT_STOP_WORDS } from 'fuzzyfindjs';

// Enable stop words filtering
const index = buildFuzzyIndex(dictionary, {
  config: {
    stopWords: ['the', 'a', 'an', 'is', 'at', 'on', 'in'],
    enableStopWords: true
  }
});

// Search with automatic filtering
getSuggestions(index, 'the hospital');
// Searches for: "hospital" (stop word "the" removed)

getSuggestions(index, 'a school in the city');
// Searches for: "school city" (stop words filtered)

// Use built-in stop words for any language
const index2 = buildFuzzyIndex(dictionary, {
  config: {
    stopWords: DEFAULT_STOP_WORDS.english,  // 38 common English stop words
    enableStopWords: true
  }
});

// Available languages
DEFAULT_STOP_WORDS.english   // the, a, an, is, at, on, in, to, for...
DEFAULT_STOP_WORDS.german    // der, die, das, ein, eine, und, oder...
DEFAULT_STOP_WORDS.spanish   // el, la, los, las, un, una, de, en...
DEFAULT_STOP_WORDS.french    // le, la, les, un, une, de, à, et...
```

**Benefits:**
- ✅ **Better Quality** - Focus on meaningful words
- ✅ **Faster Search** - Fewer words to process
- ✅ **Case Preserved** - Original text case maintained
- ✅ **Multi-language** - Built-in stop words for 4 languages
- ✅ **Safe Fallback** - Returns original query if all words are stop words

**Use Cases:**
- 🏥 **Medical Search**: "the hospital" → "hospital"
- 📚 **Document Search**: "a guide to programming" → "guide programming"
- 🏢 **Business Search**: "the company in london" → "company london"
- 🔍 **General Search**: Remove noise from user queries

**Manual Filtering:**
```typescript
import { filterStopWords, isStopWord } from 'fuzzyfindjs';

// Filter stop words from any text
filterStopWords('the quick brown fox', ['the', 'a']);
// → 'quick brown fox'

// Check if a word is a stop word
isStopWord('the', DEFAULT_STOP_WORDS.english);
// → true
```

### 13. Word Boundaries 

Precise matching with word boundary detection and wildcard support:

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// Enable word boundaries for more precise results
const index = buildFuzzyIndex(dictionary, {
  config: {
    wordBoundaries: true
  }
});

// Without word boundaries (default)
const index1 = buildFuzzyIndex(['cat', 'category', 'scatter', 'concatenate']);
getSuggestions(index1, 'cat');
// Matches: "cat", "category", "scatter", "concatenate" (all contain 'cat')

// With word boundaries
const index2 = buildFuzzyIndex(['cat', 'category', 'scatter', 'concatenate'], {
  config: { wordBoundaries: true }
});
getSuggestions(index2, 'cat');
// Matches: "cat", "category" (starts with 'cat')
// Doesn't match: "scatter", "concatenate" (cat in middle)

// Wildcard support
getSuggestions(index, 'cat*');
// Matches: "cat", "cats", "category"

getSuggestions(index, 'app*tion');
// Matches: "application", "appreciation"
```

**Benefits:**
- ✅ **More Precise** - Reduce false positives
- ✅ **Wildcard Support** - Flexible pattern matching with `*`
- ✅ **User Control** - Choose exact vs substring matching
- ✅ **Professional** - Standard search engine behavior
- ✅ **Backwards Compatible** - Disabled by default

**Use Cases:**
- 🔍 **Exact Search**: Find "cat" without matching "scatter"
- 📝 **Autocomplete**: Match word prefixes only
- 🎯 **Pattern Matching**: Use wildcards for flexible queries
- 📚 **Dictionary Search**: Match whole words only

**Manual Boundary Checking:**
```typescript
import { isWordBoundary, matchesAtWordBoundary, matchesWildcard } from 'fuzzyfindjs';

// Check if position is at word boundary
isWordBoundary('hello world', 6); // → true (after space)
isWordBoundary('hello', 2);       // → false (middle of word)

// Check if match is at word boundary
matchesAtWordBoundary('the cat sat', 4, 3); // → true ('cat')
matchesAtWordBoundary('scatter', 1, 3);     // → false ('cat' in middle)

// Wildcard matching
matchesWildcard('category', 'cat*');     // → true
matchesWildcard('application', 'app*');  // → true
```

### 14. Data Indexing Utilities

Easily extract searchable words from unstructured data sources like HTML, JSON, or text dumps:

```typescript
import { dataToIndex, createFuzzySearch } from 'fuzzyfindjs';

// ✅ Simple text
const text = "The quick brown fox jumps over the lazy dog.";
const words = dataToIndex(text, {
  minLength: 3,
  stopWords: ['the', 'a', 'an']
});
// → ['quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog']

// ✅ HTML content (strips tags automatically)
const html = `
  <html>
    <body>
      <h1>Welcome to Our Store</h1>
      <p>We sell <strong>amazing</strong> products!</p>
    </body>
  </html>
`;
const htmlWords = dataToIndex(html, { format: 'html' });
// → ['welcome', 'our', 'store', 'we', 'sell', 'amazing', 'products']

// ✅ JSON data (extracts string values only)
const products = [
  { name: 'iPhone 15', category: 'Electronics', price: 999 },
  { name: 'MacBook Pro', category: 'Computers', price: 2499 }
];
const jsonWords = dataToIndex(JSON.stringify(products), { format: 'json' });
// → ['iphone', '15', 'electronics', 'macbook', 'pro', 'computers']

// ✅ Base64 encoded content
const base64 = btoa("Hello World");
const base64Words = dataToIndex(base64, { format: 'base64' });
// → ['hello', 'world']

// ✅ Direct integration with fuzzy search
const htmlContent = "<h1>Coffee</h1><p>Kaffee is German for coffee</p>";
const dictionary = dataToIndex(htmlContent, { format: 'html' });
const search = createFuzzySearch(dictionary);

search.search('kaffee');
// → [{ display: 'kaffee', score: 1.0, ... }]
```

**Options:**
```typescript
interface DataToIndexOptions {
  minLength?: number;        // Minimum word length (default: 2)
  splitWords?: boolean;      // Split into words (default: true)
  stopWords?: string[];      // Remove stop words (default: false)
  overlap?: number;          // Chunk overlap (default: 0)
  chunkSize?: number;        // Chunk size (default: 0 = no chunking)
  splitOn?: 'word' | 'sentence' | 'paragraph';  // Split strategy
  format?: 'string' | 'html' | 'json' | 'base64' | 'url';
  removeNumbers?: boolean;   // Remove numeric values (default: false)
  caseSensitive?: boolean;   // Preserve case (default: false)
}
```

**Async URL Fetching:**
```typescript
import { dataToIndexAsync } from 'fuzzyfindjs';

// Fetch and index a webpage
const words = await dataToIndexAsync('https://example.com', { 
  format: 'url',
  minLength: 3,
  stopWords: ['the', 'a', 'an', 'and', 'or']
});
```

**Real-World Example:**
```typescript
// Index a blog post
const blogHTML = await fetch('/api/posts/123').then(r => r.text());
const dictionary = dataToIndex(blogHTML, {
  format: 'html',
  minLength: 3,
  stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
});

const search = createFuzzySearch(dictionary, {
  languages: ['english'],
  performance: 'balanced'
});

// Search the blog content
const results = search.search('typescript');
```

**Benefits:**
- ✅ **One-Liner Indexing** - Extract words from any format
- ✅ **Automatic Cleanup** - Removes HTML tags, decodes entities
- ✅ **Deduplication** - Returns unique words only
- ✅ **Flexible Options** - Customize extraction behavior
- ✅ **Zero Dependencies** - Pure JavaScript implementation

**Use Cases:**
- 📄 **Content Search** - Index blog posts, articles, documentation
- 🛍️ **Product Search** - Extract from product descriptions (HTML/JSON)
- 📧 **Email Search** - Index email content
- 📱 **App Content** - Search within app screens/pages
- 🌐 **Web Scraping** - Index scraped web content

### 15. BM25 Relevance Scoring

Probabilistic ranking for better search relevance. <br>
More Info: [Okapi BM25 - Wikipedia](https://en.wikipedia.org/wiki/Okapi_BM25)

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

const documents = [
  'search engine optimization',
  'search search search',  // Contains "search" 3 times
  'advanced search techniques'
];

const index = buildFuzzyIndex(documents, {
  config: {
    languages: ['english'],
    useBM25: true,  // Enable BM25 scoring
    fuzzyThreshold: 0.3,
    bm25Config: {
      k1: 1.2,      // Term frequency saturation (default: 1.2)
      b: 0.75,      // Length normalization (default: 0.75)
      minIDF: 0.1   // Minimum IDF value (default: 0.1)
    },
    bm25Weight: 0.6  // Weight in hybrid scoring (default: 0.6)
  }
});

const results = getSuggestions(index, 'search', 5);
// Documents ranked by relevance using BM25
```

**How BM25 Works:**
- **Term Frequency (TF)**: How often does the term appear?
- **Inverse Document Frequency (IDF)**: How rare is the term?
- **Document Length Normalization**: Penalizes very long documents
- **Hybrid Scoring**: Combines BM25 (60%) + Fuzzy matching (40%)

**Benefits:**
- ✅ **Better Ranking** - Industry-standard relevance scoring
- ✅ **Multi-word Queries** - Excels at ranking multi-term searches
- ✅ **Automatic** - Works with inverted index (auto-enabled for 10k+ words)
- ✅ **Configurable** - Tune k1, b, and weight parameters
- ✅ **Hybrid Mode** - Combines with fuzzy matching for typo tolerance

**Use Cases:**
- 📄 **Document Search** - Rank articles, blog posts, documentation
- 🛍️ **Product Search** - Better relevance for product descriptions
- 📧 **Email Search** - Rank emails by relevance
- 🔍 **Full-Text Search** - Any scenario requiring relevance ranking

### 16. Bloom Filters for Performance

Probabilistic data structure for 50-70% faster negative lookups<br> More Info: [Bloom Filters - Wikipedia](https://en.wikipedia.org/wiki/Bloom_filter)

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// Auto-enabled for large datasets (10k+ words)
const largeDictionary = Array.from({ length: 15000 }, (_, i) => `word_${i}`);

const index = buildFuzzyIndex(largeDictionary, {
  config: {
    languages: ['english'],
    // Bloom filter automatically enabled for 10k+ words
  }
});

// Manual enable for smaller datasets
const smallIndex = buildFuzzyIndex(['apple', 'banana'], {
  config: {
    useBloomFilter: true,  // Force enable
    bloomFilterFalsePositiveRate: 0.01  // 1% false positive rate
  }
});
```

**How Bloom Filters Work:**
- **Fast Negative Lookups**: O(1) check if term doesn't exist
- **Space Efficient**: Uses bit arrays (much smaller than Set/Map)
- **No False Negatives**: If it says "no", it's definitely not there
- **Small False Positives**: Configurable rate (default: 1%)

**Performance Impact:**
```typescript
// Without Bloom Filter
getSuggestions(index, 'nonexistent_term');  // ~10ms (checks all terms)

// With Bloom Filter
getSuggestions(index, 'nonexistent_term');  // ~0.5ms (fast rejection)
```

**Benefits:**
- ✅ **50-70% Faster** - For non-existent term lookups
- ✅ **Memory Efficient** - 10x smaller than Set
- ✅ **Automatic** - Enabled for 10k+ word datasets
- ✅ **Configurable** - Tune false positive rate
- ✅ **Serializable** - Save/load with index

**Use Cases:**
- 🚀 **Large Datasets** - 10k+ words benefit most
- 🔍 **Autocomplete** - Fast rejection of invalid prefixes
- 📊 **Analytics** - Quick membership testing
- 🎯 **Negative Caching** - Remember what doesn't exist

### 18. Memory Pooling for Performance

Reduce garbage collection overhead by reusing objects and arrays<br> More Info: [Memory Pooling - Wikipedia](https://en.wikipedia.org/wiki/Memory_pooling):

```typescript
import { ObjectPool, ArrayPool, MapPool, SetPool, withPooledArray } from 'fuzzyfindjs';

// Object pooling - reuse objects
const objectPool = new ObjectPool(
  () => ({ value: 0, name: '' }),
  1000, // max pool size
  (obj) => { obj.value = 0; obj.name = ''; } // reset function
);

const obj = objectPool.acquire();
obj.value = 42;
obj.name = 'test';
// ... use object ...
objectPool.release(obj); // Return to pool for reuse

// Array pooling - reuse arrays
const arrayPool = new ArrayPool<number>(500);
const arr = arrayPool.acquire();
arr.push(1, 2, 3);
// ... use array ...
arrayPool.release(arr); // Cleared and returned to pool

// Helper for automatic cleanup
const result = withPooledArray<number, number>(100, (arr) => {
  arr.push(1, 2, 3, 4, 5);
  return arr.reduce((a, b) => a + b, 0);
}); // Array automatically returned to pool

// Map and Set pooling
const mapPool = new MapPool<string, number>(100);
const setPool = new SetPool<string>(100);

const map = mapPool.acquire();
map.set('key', 42);
mapPool.release(map); // Cleared and returned

const set = setPool.acquire();
set.add('value');
setPool.release(set); // Cleared and returned

// Global pools for convenience
import { globalArrayPool, globalMapPool, globalSetPool } from 'fuzzyfindjs';
```

**How It Works:**
1. **Object Reuse**: Instead of creating new objects, reuse existing ones
2. **Reduced GC**: Fewer allocations = less garbage collection
3. **Auto-Cleanup**: Helper functions ensure objects are returned to pool
4. **Type Safe**: Full TypeScript support with generics

**Benefits:**
- ✅ **30-50% Less GC Pressure** - Fewer allocations
- ✅ **10-20% Faster Queries** - Reduced memory overhead
- ✅ **Lower Memory Usage** - Reuse instead of allocate
- ✅ **Automatic Management** - Pools handle cleanup

**Use Cases:**
- 🚀 **High-Frequency Operations** - Repeated searches
- 💾 **Memory-Constrained Environments** - Mobile, embedded
- ⚡ **Performance-Critical Code** - Real-time applications
- 🎮 **Game Development** - Frame-rate sensitive code

**Best Practices:**
```typescript
// DO: Use pools for temporary objects in hot paths
function hotPath() {
  const arr = globalArrayPool.acquire();
  try {
    // ... use array ...
  } finally {
    globalArrayPool.release(arr);
  }
}

// BETTER: Use helper for automatic cleanup
function betterHotPath() {
  return withPooledArray(100, (arr) => {
    // ... use array ...
    return result;
  });
}

// DON'T: Pool long-lived objects
const cache = objectPool.acquire(); // Bad - will never be released
```

### 19. Phrase Parsing Utilities

Parse complex search queries with quoted phrases:

```typescript
import { parseQuery, hasPhraseSyntax, normalizePhrase, splitPhraseWords } from 'fuzzyfindjs';

// Parse query with phrases
const parsed = parseQuery('"new york" city');
console.log(parsed);
// → {
//   phrases: ['new york'],
//   terms: ['city'],
//   original: '"new york" city',
//   hasPhrases: true
// }

// Check if query has phrase syntax
const hasQuotes = hasPhraseSyntax('"hello world"');
console.log(hasQuotes); // → true

// Normalize a phrase (lowercase, trim, normalize spaces)
const normalized = normalizePhrase('  New  York  ');
console.log(normalized); // → 'new york'

// Split phrase into words
const words = splitPhraseWords('hello world');
console.log(words); // → ['hello', 'world']

// Supports both single and double quotes
parseQuery("'react framework' OR \"vue framework\"");
// → { phrases: ['react framework', 'vue framework'], terms: ['OR'], ... }
```

**How It Works:**
1. **Quote Detection**: Finds text within `"..."` or `'...'`
2. **Phrase Extraction**: Extracts phrases (max 10 words each)
3. **Term Extraction**: Remaining words become individual terms
4. **Validation**: Ensures phrases are valid and not empty

**Use Cases:**
- 🔍 **Advanced Search UIs** - Build Google-like search boxes
- 🎯 **Query Pre-processing** - Parse before sending to search
- 📝 **Custom Query Languages** - Build your own query syntax
- 🧪 **Testing** - Validate query parsing logic

### 20. Language Detection Utilities

Automatically detect languages in text for optimal search configuration:

```typescript
import { 
  detectLanguages, 
  detectLanguagesWithConfidence, 
  sampleTextForDetection,
  isValidLanguage,
  normalizeLanguageCode 
} from 'fuzzyfindjs';

// Simple language detection
const languages = detectLanguages('Müller café hello');
console.log(languages); // → ['english', 'german', 'french']

// Detection with confidence scores
const result = detectLanguagesWithConfidence('Schöne Grüße aus München');
console.log(result);
// → {
//   languages: ['german', 'english'],
//   confidence: { german: 0.85, english: 0.5 },
//   primary: 'german'
// }

// Sample text from large dataset for detection
const dataset = ['Krankenhaus', 'Schule', 'Kindergarten', /* ... 10000 more */];
const sample = sampleTextForDetection(dataset, 100); // Sample first 100
const detectedLangs = detectLanguages(sample);

// Validate language code
console.log(isValidLanguage('german')); // → true
console.log(isValidLanguage('klingon')); // → false

// Normalize language codes (handles ISO codes and aliases)
console.log(normalizeLanguageCode('de')); // → 'german'
console.log(normalizeLanguageCode('en')); // → 'english'
console.log(normalizeLanguageCode('fr')); // → 'french'
console.log(normalizeLanguageCode('es')); // → 'spanish'
console.log(normalizeLanguageCode('eng')); // → 'english'
console.log(normalizeLanguageCode('deu')); // → 'german'
```

**Detection Indicators:**
- **German**: `ä, ö, ü, ß, Ä, Ö, Ü`
- **French**: `à, â, ä, æ, ç, é, è, ê, ë, ï, î, ô, ù, û, ü, ÿ, œ`
- **Spanish**: `á, é, í, ó, ú, ñ, ü, ¿, ¡`
- **English**: Default/base language

**Use Cases:**
- 🌍 **Auto-Configuration** - Automatically set optimal language settings
- 📊 **Dataset Analysis** - Understand your data's language composition
- 🎯 **Smart Defaults** - Choose best processor for user's content
- 🔄 **Multi-Language Apps** - Adapt to user's language dynamically

**Example: Auto-Configure Index**
```typescript
import { buildFuzzyIndex, detectLanguages, sampleTextForDetection } from 'fuzzyfindjs';

function buildSmartIndex(data: string[]) {
  // Auto-detect languages from sample
  const sample = sampleTextForDetection(data, 100);
  const languages = detectLanguages(sample);
  
  console.log(`Detected languages: ${languages.join(', ')}`);
  
  // Build index with detected languages
  return buildFuzzyIndex(data, {
    config: {
      languages: languages,
      performance: 'balanced'
    }
  });
}

const germanData = ['Krankenhaus', 'Schule', 'Kindergarten'];
const index = buildSmartIndex(germanData);
// → Detected languages: english, german
```

### 21. Incremental Index Updates

Update indices dynamically without rebuilding - perfect for real-time applications:

```typescript
import { buildFuzzyIndex, updateIndex, removeFromIndex, getSuggestions } from 'fuzzyfindjs';

// Initial product catalog
const index = buildFuzzyIndex([
  'Laptop Pro 15',
  'Laptop Air 13',
  'Desktop Tower',
  'Monitor 27"'
]);

// ✅ Add new products (much faster than rebuilding)
updateIndex(index, [
  'Laptop Pro 16',
  'Tablet 10"',
  'Keyboard Wireless'
]);

console.log(index.base.length); // → 7 items

// ✅ Remove discontinued products
removeFromIndex(index, ['Laptop Pro 15']);

console.log(index.base.length); // → 6 items

// ✅ Search still works perfectly
const results = getSuggestions(index, 'laptop', 10);
console.log(results);
// → [
//   { display: 'Laptop Pro 16', score: 1.0, ... },
//   { display: 'Laptop Air 13', score: 1.0, ... }
// ]

// ❌ Old model no longer appears
const hasOldModel = results.some(r => r.display === 'Laptop Pro 15');
console.log(hasOldModel); // → false
```

**How It Works:**
1. **`updateIndex`**: Adds new items to existing index
   - Reuses existing configuration and language processors
   - Skips duplicates automatically
   - Updates all internal mappings (variants, phonetic, ngrams)
   - Rebuilds inverted index if present
   - Clears cache to ensure fresh results

2. **`removeFromIndex`**: Removes items from index
   - Case-insensitive matching
   - Cleans up all internal mappings
   - Rebuilds inverted index if present
   - Clears cache to ensure fresh results

**Performance Benefits:**
- ✅ **10-100x Faster** than rebuilding for small updates
- ✅ **Memory Efficient** - Only processes new/removed items
- ✅ **Zero Downtime** - Index remains searchable during updates
- ✅ **Automatic Cleanup** - All mappings stay consistent

**Use Cases:**
- 🛒 **E-commerce**: Add/remove products in real-time
- 📝 **Content Management**: Update articles, posts, documents
- 👥 **User Directories**: Add/remove users dynamically
- 🎮 **Gaming**: Update item databases, player lists
- 📊 **Analytics**: Maintain live data indices

**Multi-Field Support:**
```typescript
// Works with multi-field objects too
const index = buildFuzzyIndex(
  [
    { title: 'iPhone 15', category: 'Phones', price: 999 },
    { title: 'MacBook Pro', category: 'Laptops', price: 2499 }
  ],
  { fields: ['title', 'category'] }
);

// Add new product
updateIndex(index, [
  { title: 'iPad Air', category: 'Tablets', price: 599 }
]);

// Remove product
removeFromIndex(index, ['iPhone 15']);
```

**Real-World Example: Live Product Catalog**
```typescript
class ProductCatalog {
  private index: FuzzyIndex;

  constructor(initialProducts: Product[]) {
    this.index = buildFuzzyIndex(initialProducts, {
      fields: ['name', 'description', 'category'],
      config: { performance: 'fast' }
    });
  }

  addProduct(product: Product) {
    updateIndex(this.index, [product]);
    console.log(`✅ Added: ${product.name}`);
  }

  removeProduct(productName: string) {
    removeFromIndex(this.index, [productName]);
    console.log(`🗑️ Removed: ${productName}`);
  }

  search(query: string) {
    return getSuggestions(this.index, query, 20);
  }

  bulkUpdate(newProducts: Product[], removedNames: string[]) {
    // Efficient batch operations
    if (removedNames.length > 0) {
      removeFromIndex(this.index, removedNames);
    }
    if (newProducts.length > 0) {
      updateIndex(this.index, newProducts);
    }
    console.log(`📦 Updated: +${newProducts.length}, -${removedNames.length}`);
  }
}

// Usage
const catalog = new ProductCatalog(initialProducts);

// Real-time updates
catalog.addProduct({ name: 'New Product', category: 'Electronics' });
catalog.removeProduct('Old Product');

// Batch updates (more efficient)
catalog.bulkUpdate(
  [newProduct1, newProduct2],
  ['discontinued1', 'discontinued2']
);
```

**Best Practices:**
```typescript
// ✅ DO: Batch updates when possible
updateIndex(index, [item1, item2, item3]); // Better
removeFromIndex(index, ['a', 'b', 'c']);   // Better

// ❌ DON'T: Update one at a time in a loop
for (const item of items) {
  updateIndex(index, [item]); // Slower - rebuilds inverted index each time
}

// ✅ DO: Use for small updates (< 10% of index size)
if (newItems.length < index.base.length * 0.1) {
  updateIndex(index, newItems);
} else {
  // Rebuild entire index for large updates
  index = buildFuzzyIndex([...index.base, ...newItems]);
}

// ✅ DO: Handle errors gracefully
try {
  updateIndex(index, newItems);
} catch (error) {
  console.error('Update failed:', error);
  // Index remains in previous valid state
}
```

## 🍥 FQL (Fuzzy Query Language)

> **⚠️ BETA FEATURE**: FQL is currently in beta. Be aware of potential security and performance concerns when using FQL with untrusted user input.

FQL allows complex boolean searches with AND, OR, NOT operators combined with fuzzy matching. Enable it via `options.enableFQL` in your search calls.

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

const index = buildFuzzyIndex(['JavaScript programming', 'Python development']);

// Enable FQL for complex boolean searches
const results = getSuggestions(index, 'javascript AND programming', 10, {
  enableFQL: true,
  fqlOptions: {
    allowRegex: false,  // Security: prevent regex attacks
    timeout: 5000       // Performance: fail fast
  }
});
```

**Basic Operators:**
- `AND` - Both terms must match
- `OR` - Either term can match  
- `NOT` - Exclude matches
- `( )` - Group expressions
- `" "` - Exact phrase matching

📖 **For detailed documentation, examples, and advanced features, see the [FQL Documentation](./FQL.md) tab.**


## 🧪 Algorithm Details

### Indexing Strategies: HashMap vs Inverted Index

FuzzyFindJS uses **two different indexing strategies** depending on dataset size:

- **< 10,000 items**: HashMap-based indexing (simple, fast for small datasets)
- **≥ 10,000 items**: Inverted Index (optimized for large datasets, 10-100x faster)

#### 📊 HashMap Indexing (< 10K items)

**How it works:**
The HashMap approach stores all words in simple JavaScript objects (hash maps) for direct O(1) lookup. Each word is processed and stored with its variants (phonetic codes, n-grams, synonyms) as keys pointing to the original words.

**ASCII Diagram:**
```
Dictionary: ["apple", "application", "apply"]

┌─────────────────────────────────────────────────────────┐
│                    HashMap Index                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  base: Map {                                           │
│    "apple"       → ["apple"]                           │
│    "application" → ["application"]                     │
│    "apply"       → ["apply"]                           │
│  }                                                      │
│                                                         │
│  normalized: Map {                                     │
│    "apple"       → ["apple"]                           │
│    "application" → ["application"]                     │
│    "apply"       → ["apply"]                           │
│  }                                                      │
│                                                         │
│  phonetic: Map {                                       │
│    "APL"  → ["apple", "apply"]    ← same sound!       │
│    "APLK" → ["application"]                            │
│  }                                                      │
│                                                         │
│  ngrams: Map {                                         │
│    "app" → ["apple", "application", "apply"]          │
│    "ppl" → ["apple", "apply"]                         │
│    "lic" → ["application"]                            │
│    "cat" → ["application"]                            │
│    ...                                                 │
│  }                                                      │
│                                                         │
│  synonyms: Map {                                       │
│    "fruit" → ["apple"]                                 │
│    "app"   → ["application"]                           │
│    "software" → ["application"]                        │
│  }                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

Search Query: "aple" (typo)
  ↓
1. Check exact match in base → ❌ not found
2. Check phonetic "APL" → ✅ ["apple", "apply"]
3. Check n-grams "apl", "ple" → ✅ ["apple", "apply"]
4. Calculate edit distance → "apple" (distance: 1)
  ↓
Result: "apple" (score: 0.92)
```

**JSON Example:**
```json
{
  "base": {
    "apple": ["apple"],
    "application": ["application"],
    "apply": ["apply"]
  },
  "normalized": {
    "apple": ["apple"],
    "application": ["application"],
    "apply": ["apply"]
  },
  "phonetic": {
    "APL": ["apple", "apply"],
    "APLK": ["application"]
  },
  "ngrams": {
    "app": ["apple", "application", "apply"],
    "ppl": ["apple", "apply"],
    "pli": ["application", "apply"],
    "lic": ["application"],
    "cat": ["application"],
    "ati": ["application"],
    "tio": ["application"],
    "ion": ["application"]
  },
  "synonyms": {
    "fruit": ["apple"],
    "app": ["application"],
    "software": ["application"]
  },
  "config": {
    "languages": ["english"],
    "maxEditDistance": 2,
    "fuzzyThreshold": 0.75
  }
}
```

**Characteristics:**
- ✅ **Simple**: Easy to understand and debug
- ✅ **Fast for small datasets**: O(1) lookups
- ✅ **Low memory overhead**: Minimal data structures
- ❌ **Scales poorly**: O(n) fuzzy matching requires checking all words
- ❌ **Slow for large datasets**: 100K+ items become sluggish

---

#### 🚀 Inverted Index (≥ 10K items)

**How it works:**
The Inverted Index approach builds a sophisticated data structure that maps **terms to document IDs** (posting lists). Instead of storing full words, it creates a reverse lookup where each term points to all documents containing it. This enables **sub-linear search time** for large datasets.

**ASCII Diagram:**
```
Documents: 
  Doc 0: "apple pie recipe"
  Doc 1: "apple juice fresh"
  Doc 2: "application development"
  Doc 3: "apply for job"

┌──────────────────────────────────────────────────────────────┐
│                    Inverted Index                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  termToPostings: Map {                     ← Posting Lists  │
│    "apple"       → [0, 1]          ┐                        │
│    "pie"         → [0]             │ Documents containing   │
│    "recipe"      → [0]             │ each term              │
│    "juice"       → [1]             │                        │
│    "fresh"       → [1]             │                        │
│    "application" → [2]             │                        │
│    "development" → [2]             │                        │
│    "apply"       → [3]             │                        │
│    "job"         → [3]             ┘                        │
│  }                                                           │
│                                                              │
│  termTrie: Trie {                          ← Prefix Search  │
│    a → p → p → l → e → [0, 1]                              │
│         │                                                    │
│         └─→ l → y → [3]                                     │
│              │                                               │
│              └─→ i → c → a → t → i → o → n → [2]          │
│  }                                                           │
│                                                              │
│  documentStore: Array [              ← Original Documents   │
│    { id: 0, text: "apple pie recipe", ... },               │
│    { id: 1, text: "apple juice fresh", ... },              │
│    { id: 2, text: "application development", ... },        │
│    { id: 3, text: "apply for job", ... }                   │
│  ]                                                           │
│                                                              │
│  documentFrequency: Map {            ← BM25 Scoring         │
│    "apple"       → 2,  // appears in 2 docs                │
│    "application" → 1,  // appears in 1 doc                 │
│    "apply"       → 1                                        │
│  }                                                           │
│                                                              │
│  termFrequency: Map {                ← Term Counts          │
│    0 → { "apple": 1, "pie": 1, "recipe": 1 },             │
│    1 → { "apple": 1, "juice": 1, "fresh": 1 },            │
│    2 → { "application": 1, "development": 1 },             │
│    3 → { "apply": 1, "job": 1 }                            │
│  }                                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Search Query: "aple" (typo)
  ↓
1. Trie prefix search: "ap*" → candidates: [0,1,2,3]
2. Posting list intersection → docs with "ap*" terms
3. Fuzzy match only against candidates (not all docs!)
4. BM25 scoring for relevance ranking
  ↓
Result: Doc 0 "apple pie recipe" (score: 0.95)
        Doc 1 "apple juice fresh" (score: 0.94)
```

**JSON Example:**
```json
{
  "termToPostings": {
    "apple": [0, 1],
    "pie": [0],
    "recipe": [0],
    "juice": [1],
    "fresh": [1],
    "application": [2],
    "development": [2],
    "apply": [3],
    "job": [3]
  },
  "termTrie": {
    "root": {
      "a": {
        "p": {
          "p": {
            "l": {
              "e": { "docIds": [0, 1], "isEnd": true },
              "i": { 
                "c": {
                  "a": {
                    "t": {
                      "i": {
                        "o": {
                          "n": { "docIds": [2], "isEnd": true }
                        }
                      }
                    }
                  }
                }
              },
              "y": { "docIds": [3], "isEnd": true }
            }
          }
        }
      }
    }
  },
  "documentStore": [
    {
      "id": 0,
      "text": "apple pie recipe",
      "normalized": "apple pie recipe",
      "length": 3
    },
    {
      "id": 1,
      "text": "apple juice fresh",
      "normalized": "apple juice fresh",
      "length": 3
    },
    {
      "id": 2,
      "text": "application development",
      "normalized": "application development",
      "length": 2
    },
    {
      "id": 3,
      "text": "apply for job",
      "normalized": "apply for job",
      "length": 3
    }
  ],
  "documentFrequency": {
    "apple": 2,
    "pie": 1,
    "recipe": 1,
    "juice": 1,
    "fresh": 1,
    "application": 1,
    "development": 1,
    "apply": 1,
    "job": 1
  },
  "termFrequency": {
    "0": { "apple": 1, "pie": 1, "recipe": 1 },
    "1": { "apple": 1, "juice": 1, "fresh": 1 },
    "2": { "application": 1, "development": 1 },
    "3": { "apply": 1, "job": 1 }
  },
  "avgDocLength": 2.75,
  "totalDocs": 4,
  "config": {
    "useInvertedIndex": true,
    "useBM25": true,
    "languages": ["english"]
  }
}
```

**Characteristics:**
- ✅ **Extremely fast**: O(log n) prefix search via Trie
- ✅ **Scales to millions**: Tested with 1M+ documents
- ✅ **Memory efficient**: Shared posting lists, no duplication
- ✅ **BM25 scoring**: Industry-standard relevance ranking
- ✅ **Incremental updates**: Add/remove documents efficiently
- ⚠️ **Higher memory**: More complex data structures
- ⚠️ **Build time**: Initial indexing takes longer

---

#### 🔄 Automatic Selection

The library **automatically chooses** the best indexing strategy:

```typescript
// Small dataset (< 10K) → HashMap
const smallIndex = buildFuzzyIndex(['apple', 'banana', 'cherry']);
console.log(smallIndex.invertedIndex); // undefined

// Large dataset (≥ 10K) → Inverted Index
const largeIndex = buildFuzzyIndex(Array(10000).fill('word'));
console.log(largeIndex.invertedIndex); // { termToPostings: Map, ... }

// Force inverted index (even for small datasets)
const forcedIndex = buildFuzzyIndex(['apple', 'banana'], {
  useInvertedIndex: true
});
console.log(forcedIndex.invertedIndex); // { termToPostings: Map, ... }
```

---

### Matching Strategies

The library uses 6 parallel matching strategies:

1. **Exact Match** (score: 1.0)
   - Direct hash lookup for perfect matches
   
2. **Prefix Match** (score: 0.9)
   - Checks if dictionary words start with query
   
3. **Phonetic Match** (score: 0.7)
   - Kölner Phonetik for German
   - Soundex-like for other languages
   
4. **Synonym Match** (score: 0.6)
   - Built-in + custom synonym dictionaries
   
5. **N-gram Match** (score: 0.8)
   - Jaccard similarity on character trigrams
   
6. **Fuzzy Match** (score: 0.3-1.0)
   - Levenshtein or Damerau-Levenshtein edit distance
   - Optimized with length pre-filtering
   - Supports transpositions when enabled

### Transposition Support (Damerau-Levenshtein)

Enable character transposition detection to catch common typos where adjacent characters are swapped:

```typescript
const index = buildFuzzyIndex(['the', 'receive', 'friend'], {
  config: {
    features: ['transpositions'],
    maxEditDistance: 1
  }
});

// Catches common typos
getSuggestions(index, 'teh');      // → 'the'
getSuggestions(index, 'recieve'); // → 'receive'
getSuggestions(index, 'freind');  // → 'friend'
```

**Benefits:**
- ✅ Catches 10-15% more typos than standard Levenshtein
- ✅ Handles common typing mistakes (adjacent key swaps)
- ✅ Minimal performance impact (~5-10% slower)
- ✅ Backwards compatible (opt-in feature)

**Common Use Cases:**
```typescript
// Programming typos
'funciton' → 'function'
'retrun'   → 'return'
'varaible' → 'variable'

// Product names
'iPohne'   → 'iPhone'
'MaBcook'  → 'MacBook'

// City names
'Beriln'   → 'Berlin'
'Prais'    → 'Paris'
```

**Algorithm:**
- **Without transpositions**: Standard Levenshtein (insertions, deletions, substitutions)
- **With transpositions**: Damerau-Levenshtein (adds adjacent character swaps)

**Performance:**
- Transpositions add ~5-10% overhead
- Still maintains O(n×m) complexity
- Early termination keeps it fast

### Phrase Search (Multi-Word Queries)

Search for multi-word phrases as single units by wrapping them in quotes:

```typescript
const index = buildFuzzyIndex([
  'New York City',
  'New York Times',
  'New Orleans',
  'York University'
]);

// Exact phrase search
getSuggestions(index, '"new york"');
// → ['New York City', 'New York Times']

// Mixed: phrase + terms
getSuggestions(index, '"new york" times');
// → ['New York Times'] (boosted score)

// Multiple phrases
getSuggestions(index, '"new york" "san francisco"');
```

**Features:**
- ✅ **Exact phrase matching** - Find multi-word terms
- ✅ **Fuzzy phrase matching** - Allow typos in phrases
- ✅ **Proximity matching** - Find words near each other
- ✅ **Mixed queries** - Combine phrases with regular terms
- ✅ **Quote styles** - Support both `"double"` and `'single'` quotes
- ✅ **Score boosting** - Phrase matches get 1.5x score multiplier

**Use Cases:**
```typescript
// City names
'"san francisco"'     → 'San Francisco Bay Area'
'"new york city"'     → 'New York City'

// Product names
'"macbook pro"'       → 'MacBook Pro 16"'
'"iphone 15"'         → 'iPhone 15 Pro Max'

// Company names
'"apple inc"'         → 'Apple Inc.'
'"google llc"'        → 'Google LLC'

// Addresses
'"123 main street"'   → '123 Main Street, NYC'
```

**Matching Strategies:**
1. **Exact Match** (score: 1.0 × 1.5 = 1.5 capped at 1.0)
   - Direct phrase found in text
   
2. **Fuzzy Match** (score: 0.7-0.9 × 1.5)
   - Allow 1 typo per word
   - Preserve word order
   
3. **Proximity Match** (score: 0.5-0.7 × 1.5)
   - Words within 3 positions
   - Score decreases with distance

**Configuration:**
```typescript
// Phrases work automatically - just use quotes!
// No configuration needed

// Limits:
// - Max 10 words per phrase
// - Max edit distance: 1 per word
// - Max proximity distance: 3 words
```

**Performance:**
- Queries without quotes: 0% overhead
- Queries with phrases: +5-15% time
- Automatic optimization for phrase detection

### Language Auto-Detection

Automatically detect languages from your data - no configuration needed!

```typescript
// Auto-detection (default behavior)
const index = buildFuzzyIndex([
  'Müller',      // German detected
  'café',        // French detected
  'niño',        // Spanish detected
  'hello'        // English (always included)
]);
// → languages: ['english', 'german', 'french', 'spanish']

// Explicit auto-detection
const index2 = buildFuzzyIndex(data, {
  config: {
    languages: ['auto']  // Same as not specifying
  }
});

// Override auto-detection
const index3 = buildFuzzyIndex(data, {
  config: {
    languages: ['german']  // Force specific language
  }
});
```

**Detection Heuristics:**
- **German**: ä, ö, ü, ß characters
- **French**: é, è, ê, à, ç, œ characters
- **Spanish**: ñ, á, é, í, ó, ú, ¿, ¡ characters
- **English**: Default fallback (always included)

**Features:**
- ✅ **Automatic** - Works out of the box
- ✅ **Multi-language** - Detects all languages in dataset
- ✅ **Fast** - Samples first 100 words only
- ✅ **Accurate** - Character-based heuristics
- ✅ **Backwards compatible** - Explicit languages still work

**Use Cases:**
```typescript
// International datasets
buildFuzzyIndex(['Müller GmbH', 'Café de Paris', 'José & Sons'])
// → Auto-detects: German, French, Spanish, English

// Mixed-language content
buildFuzzyIndex(['résumé', 'Lebenslauf', 'curriculum vitae'])
// → Auto-detects: French, German, English

// Single language (explicit)
buildFuzzyIndex(['Müller', 'Schmidt'], {
  config: { languages: ['german'] }
})
// → Uses only German processor
```

**Performance:**
- Detection time: ~1-2ms (one-time at index building)
- Samples first 100 items only
- Zero runtime overhead
- No external dependencies

### German-Specific Features

- **Umlaut Normalization**: ä→ae, ö→oe, ü→ue, ß→ss
- **Compound Word Splitting**: "Krankenhaus" → ["kranken", "haus"]
- **Kölner Phonetik**: German phonetic algorithm
- **QWERTZ Keyboard Layout**: German keyboard neighbor detection

## 📄 License

MIT © Luca Mack

## 🔗 Links

- [GitHub Repository](https://github.com/LucaIsMyName/fuzzyfindjs)
- [NPM Package](https://www.npmjs.com/package/fuzzyfindjs)
- [Issue Tracker](https://github.com/LucaIsMyName/fuzzyfindjs/issues)
- [Interactive Demo](https://github.com/LucaIsMyName/fuzzyfindjs#-try-the-interactive-demo) - Run locally with `npm run dev`

## 📝 IDE Support & IntelliSense

FuzzyFindJS provides comprehensive **JSDoc documentation** for all public APIs, giving you excellent IDE support:

### Features

- ✅ **Full JSDoc Coverage** - All public functions, types, and parameters documented
- ✅ **IntelliSense Support** - Autocomplete and parameter hints in VS Code, WebStorm, etc.
- ✅ **Type Safety** - Full TypeScript type definitions included
- ✅ **Inline Examples** - Code examples in JSDoc for quick reference
- ✅ **Parameter Descriptions** - Detailed explanations for all options

### Example IDE Experience

When you type `buildFuzzyIndex(` in your IDE, you'll see:

```typescript
buildFuzzyIndex(words, options?)
```

**Hover documentation shows:**
> Builds a fuzzy search index from an array of words or objects.
> 
> This is the primary function for creating a searchable index. It processes each word/object
> through language-specific processors, builds various indices (phonetic, n-gram, synonym),
> and automatically enables optimizations like inverted index for large datasets (10k+ items).
>
> **@param** words - Array of strings to index, or objects with fields to search across  
> **@param** options - Configuration options for index building  
> **@returns** A searchable fuzzy index containing all processed data and metadata

**With inline examples:**
```typescript
// Simple string array
const index = buildFuzzyIndex(['apple', 'banana', 'cherry'], {
  config: { languages: ['english'], performance: 'fast' }
});

// Multi-field objects
const products = [
  { name: 'iPhone', description: 'Smartphone', price: 999 }
];
const index = buildFuzzyIndex(products, {
  fields: ['name', 'description'],
  fieldWeights: { name: 2.0, description: 1.0 }
});
```

### Documented Functions

All major functions include comprehensive JSDoc:

- `buildFuzzyIndex()` - Build searchable index
- `getSuggestions()` - Search the index
- `batchSearch()` - Search multiple queries
- `createFuzzySearch()` - Quick start helper
- `updateIndex()` - Add items to existing index
- `removeFromIndex()` - Remove items from index
- Plus all utility functions (serialization, highlighting, caching, etc.)

## 📎 To Do's

- [ ] Add (optional) dictionary imports for english, german ,spanish, france, ... as json files with the eg 500 most common expressions to be used as dictionary
  - [ ] implemenent a native way to use these dictionary ON top of your own OR instead
- [ ] Make global weighting/Scoring more nuanced and try out different combinations
- [ ] make "features" a "plugin system" and devwloper can add custom features when using fuzzyFindJs (create own additional logic and the place/time where it runs (before in between or after the other features))