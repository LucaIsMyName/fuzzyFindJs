# FuzzyFindJS 🔍

A powerful, multi-language optimized fuzzy search library with phonetic matching, compound word splitting, and intelligent synonym support. Built for TypeScript with zero dependencies.

[![NPM Version](https://img.shields.io/npm/v/fuzzyfindjs)](https://www.npmjs.com/package/fuzzyfindjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/fuzzyfindjs)](https://bundlephobia.com/package/fuzzyfindjs)

## ✨ Features

- 🌍 **Multi-language Support**: German, English, Spanish, French with language-specific optimizations
- 🔊 **Phonetic Matching**: Kölner Phonetik (German), Soundex-like algorithms for other languages
- 🧩 **Compound Word Splitting**: Intelligent German compound word decomposition
- 📚 **Synonym Support**: Built-in synonyms + custom synonym dictionaries
- ⚡ **Performance Optimized**: Three performance modes (fast, balanced, comprehensive)
- 🚀 **Inverted Index**: Auto-enabled for large datasets (10k+ words) - 10-100x faster for 1M+ words
- 🎨 **Match Highlighting**: Show WHERE matches occurred with position tracking
- ⚡ **Search Caching**: 10-100x faster repeated queries with LRU cache
- 💾 **Index Serialization**: Save/load indices for instant startup (100x faster)
- 🔄 **Batch Search**: Search multiple queries at once with auto-deduplication
- 🌍 **Accent Normalization**: Automatic handling of accented characters (café ↔ cafe)
- ⚖️ **Field Weighting**: Multi-field search with weighted scoring (title > description)
- 🚫 **Stop Words Filtering**: Remove common words (the, a, an) for better search quality
- 📍 **Word Boundaries**: Precise matching with wildcard support (cat* matches category)
- 🎯 **Typo Tolerant**: Handles missing letters, extra letters, transpositions, keyboard neighbors
- 🔤 **N-gram Matching**: Fast partial substring matching
- 📊 **Configurable Scoring**: Customizable thresholds and edit distances
- 🎨 **TypeScript First**: Full type safety with comprehensive type definitions
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
<script src="https://unpkg.com/fuzzyfindjs@1.0.3/dist/umd/fuzzyfindjs.min.js"></script>

<!-- jsdelivr - latest version -->
<script src="https://cdn.jsdelivr.net/npm/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>

<!-- jsdelivr - specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/fuzzyfindjs@1.0.3/dist/umd/fuzzyfindjs.min.js"></script>
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

Perfect for testing different configurations and understanding how the fuzzy search works!

## 🚀 Quick Start

```typescript
import { createFuzzySearch } from 'fuzzyfindjs';

// Create a search instance with your dictionary
const search = createFuzzySearch([
  'Hospital',
  'Pharmacy',
  'Doctor',
  'Dentist',
  'Kindergarten'
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

### 12. Stop Words Filtering

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

### 14. Data Indexing Utilities (NEW!)

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

### Performance Optimizations

The library includes several performance optimizations:

- **Lazy Feature Evaluation**: Features only run when enabled in config
- **O(1) Feature Checks**: Uses Set instead of Array for feature lookups
- **Early Exit Levenshtein**: Stops calculation when distance exceeds threshold
- **Pre-allocated Arrays**: Avoids dynamic array resizing during n-gram generation
- **Cached Phonetic Codes**: Memoizes phonetic calculations for duplicate words
- **Map/Set Optimization**: Single get() instead of has() + get() pattern

These optimizations provide:
- **50-70% faster index building**
- **40-60% faster search queries**
- **30-40% lower memory usage**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Luca Mack

## 🔗 Links

- [GitHub Repository](https://github.com/LucaIsMyName/fuzzyfindjs)
- [NPM Package](https://www.npmjs.com/package/fuzzyfindjs)
- [Issue Tracker](https://github.com/LucaIsMyName/fuzzyfindjs/issues)
- [Interactive Demo](https://github.com/LucaIsMyName/fuzzyfindjs#-try-the-interactive-demo) - Run locally with `npm run dev`

## 📚 Additional Documentation

- **[DEMO.md](./DEMO.md)** - Complete demo dashboard guide with testing scenarios
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference for the demo
- **[PUBLISHING.md](./PUBLISHING.md)** - NPM publishing guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[LOCALSTORAGE_FEATURE.md](./LOCALSTORAGE_FEATURE.md)** - Demo persistence feature details

## To Do's

- [ ] Add (optional) dictionary imports for english, german ,spanish, france, ... as json files with the eg 500 most common expressions to be used as dictionary
  - [ ] implemenent a native way to use these dictionary ON top of your own OR instead