# FuzzyFindJS 🔍

A powerful, multi-language optimized fuzzy search library with phonetic matching, compound word splitting, and intelligent synonym support. Built for TypeScript with zero dependencies.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🌍 **Multi-language Support**: German, English, Spanish, French with language-specific optimizations
- 🔊 **Phonetic Matching**: Kölner Phonetik (German), Soundex-like algorithms for other languages
- 🧩 **Compound Word Splitting**: Intelligent German compound word decomposition
- 📚 **Synonym Support**: Built-in synonyms + custom synonym dictionaries
- ⚡ **Performance Optimized**: Three performance modes (fast, balanced, comprehensive)
- 🎯 **Typo Tolerant**: Handles missing letters, extra letters, transpositions, keyboard neighbors
- 🔤 **N-gram Matching**: Fast partial substring matching
- 📊 **Configurable Scoring**: Customizable thresholds and edit distances
- 🎨 **TypeScript First**: Full type safety with comprehensive type definitions
- 📦 **Zero Dependencies**: Lightweight and self-contained

## 📦 Installation

```bash
npm install fuzzyfindjs
```

```bash
yarn add fuzzyfindjs
```

```bash
pnpm add fuzzyfindjs
```

## 🚀 Quick Start

```typescript
import { createFuzzySearch } from 'fuzzyfindjs';

// Create a search instance with your dictionary
const search = createFuzzySearch([
  'Krankenhaus',
  'Kindergarten',
  'Apotheke',
  'Zahnarzt'
], {
  languages: ['german'],
  performance: 'balanced',
  maxResults: 5
});

// Search with typos, partial words, phonetic similarity
const results = search.search('krankenh');
// [{ display: 'Krankenhaus', score: 0.95, ... }]

const results2 = search.search('arzt');
// [{ display: 'Zahnarzt', score: 0.85, ... }]
```

## 📖 API Documentation

### Core Functions

#### `buildFuzzyIndex(words, options?)`

Builds a searchable index from an array of words.

**Parameters:**
- `words: string[]` - Array of words to index
- `options?: BuildIndexOptions` - Configuration options

**Returns:** `FuzzyIndex` - The built search index

**Example:**
```typescript
import { buildFuzzyIndex } from 'fuzzyfindjs';

const index = buildFuzzyIndex(['Apple', 'Banana', 'Cherry'], {
  config: {
    languages: ['english'],
    performance: 'fast',
    features: ['phonetic', 'partial-words']
  },
  onProgress: (processed, total) => {
    console.log(`Indexed ${processed}/${total} words`);
  }
});
```

#### `getSuggestions(index, query, maxResults?, options?)`

Search the index for fuzzy matches.

**Parameters:**
- `index: FuzzyIndex` - The search index
- `query: string` - Search query
- `maxResults?: number` - Maximum results to return (default: from config)
- `options?: SearchOptions` - Search-specific options

**Returns:** `SuggestionResult[]` - Ranked search results

**Example:**
```typescript
import { getSuggestions } from 'fuzzyfindjs';

const results = getSuggestions(index, 'aple', 5, {
  fuzzyThreshold: 0.7,
  languages: ['english'],
  debug: true
});

results.forEach(result => {
  console.log(`${result.display} (score: ${result.score})`);
});
```

#### `createFuzzySearch(dictionary, options?)`

Convenience function that combines index building and searching.

**Parameters:**
- `dictionary: string[]` - Words to search
- `options?: object` - Quick configuration

**Returns:** Object with `search()` method and `index`

**Example:**
```typescript
import { createFuzzySearch } from 'fuzzyfindjs';

const fuzzy = createFuzzySearch(['Hello', 'World'], {
  languages: ['english'],
  performance: 'comprehensive',
  maxResults: 10
});

const results = fuzzy.search('helo');
```

### Configuration

#### `FuzzyConfig`

Complete configuration interface:

```typescript
interface FuzzyConfig {
  // Languages to enable
  languages: string[];  // ['german', 'english', 'spanish', 'french']
  
  // Features to enable
  features: FuzzyFeature[];
  
  // Performance mode
  performance: 'fast' | 'balanced' | 'comprehensive';
  
  // Maximum results to return
  maxResults: number;  // default: 5
  
  // Minimum query length
  minQueryLength: number;  // default: 2
  
  // Fuzzy matching threshold (0-1)
  fuzzyThreshold: number;  // default: 0.8
  
  // Maximum edit distance
  maxEditDistance: number;  // default: 2
  
  // N-gram size for partial matching
  ngramSize: number;  // default: 3
  
  // Custom synonym dictionaries
  customSynonyms?: Record<string, string[]>;
  
  // Custom normalization function
  customNormalizer?: (word: string) => string;
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

## 💡 Usage Examples

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

## 🧪 Algorithm Details

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
   - Levenshtein edit distance with early termination
   - Optimized with length pre-filtering

### German-Specific Features

- **Umlaut Normalization**: ä→ae, ö→oe, ü→ue, ß→ss
- **Compound Word Splitting**: "Krankenhaus" → ["kranken", "haus"]
- **Kölner Phonetik**: German phonetic algorithm
- **QWERTZ Keyboard Layout**: German keyboard neighbor detection

## 📊 Benchmarks

```typescript
// Index building: 10,000 words
// Fast mode:          ~50ms
// Balanced mode:      ~120ms
// Comprehensive mode: ~250ms

// Search time: 10,000 word index
// Average query: <1ms
// Complex query: <5ms
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Your Name]

## 🔗 Links

- [GitHub Repository](https://github.com/LucaIsMyName/fuzzyfindjs)
- [NPM Package](https://www.npmjs.com/package/fuzzyfindjs)
- [Issue Tracker](https://github.com/LucaIsMyName/fuzzyfindjs/issues)

## 🙏 Acknowledgments

- Kölner Phonetik algorithm for German phonetic matching
- Levenshtein distance algorithm for fuzzy matching
- Inspired by Fuse.js and other fuzzy search libraries
