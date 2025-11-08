# 🚀 Quick Start Guide

Welcome to FuzzyFindJS! This guide will help you get up and running quickly with framework-specific examples for Vanilla JavaScript, Node.js, React, Vue, and Svelte.

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

For quick prototyping or simple projects:

```html
<!-- unpkg - latest version -->
<script src="https://unpkg.com/fuzzyfindjs@latest/dist/umd/fuzzyfindjs.min.js"></script>

<!-- jsdelivr - specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/fuzzyfindjs@1.0.12/dist/umd/fuzzyfindjs.min.js"></script>
```

---

## 🌐 Framework Examples

### Vanilla JavaScript (ES6 Modules)

#### Basic Search Component

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FuzzyFindJS - Vanilla JS</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; }
        .search-container { margin-bottom: 20px; }
        input { width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 4px; }
        input:focus { outline: none; border-color: #2563eb; }
        .results { list-style: none; padding: 0; }
        .result-item { padding: 12px; border: 1px solid #eee; margin-bottom: 8px; border-radius: 4px; }
        .result-item:hover { background-color: #f8f9fa; }
        .score { color: #666; font-size: 0.9em; }
        .no-results { text-align: center; color: #999; padding: 20px; }
    </style>
</head>
<body>
    <h1>🔍 Fuzzy Search Demo</h1>
    
    <div class="search-container">
        <input type="text" id="search" placeholder="Type to search..." autofocus>
    </div>
    
    <ul id="results" class="results"></ul>

    <script type="module">
        import { createFuzzySearch } from 'https://cdn.skypack.dev/fuzzyfindjs';
        
        // Sample data
        const fruits = [
            'Apple', 'Apricot', 'Avocado', 'Banana', 'Blackberry', 'Blueberry',
            'Cherry', 'Coconut', 'Cranberry', 'Date', 'Dragonfruit', 'Elderberry',
            'Fig', 'Grape', 'Grapefruit', 'Guava', 'Kiwi', 'Lemon', 'Lime',
            'Mango', 'Orange', 'Papaya', 'Peach', 'Pear', 'Pineapple', 'Plum',
            'Raspberry', 'Strawberry', 'Watermelon'
        ];
        
        // Create search instance
        const search = createFuzzySearch(fruits, {
            languages: ['english'],
            performance: 'balanced',
            maxResults: 10
        });
        
        // DOM elements
        const searchInput = document.getElementById('search');
        const resultsList = document.getElementById('results');
        
        // Search handler with debounce
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            
            if (query.length < 2) {
                resultsList.innerHTML = '';
                return;
            }
            
            // Debounce search for better performance
            searchTimeout = setTimeout(() => {
                const results = search.search(query);
                displayResults(results);
            }, 150);
        });
        
        function displayResults(results) {
            if (results.length === 0) {
                resultsList.innerHTML = '<li class="no-results">No results found</li>';
                return;
            }
            
            resultsList.innerHTML = results
                .map(r => `
                    <li class="result-item">
                        <strong>${escapeHtml(r.display)}</strong>
                        <span class="score">Score: ${(r.score * 100).toFixed(0)}%</span>
                    </li>
                `)
                .join('');
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
```

#### Advanced Example with Multi-field Search

```javascript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

class AdvancedSearch {
    constructor() {
        this.data = [
            { name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
            { name: 'Jane Smith', email: 'jane@example.com', department: 'Design' },
            { name: 'Bob Johnson', email: 'bob@example.com', department: 'Marketing' }
        ];
        
        this.index = buildFuzzyIndex(this.data, {
            fields: ['name', 'email', 'department'],
            fieldWeights: { name: 2.0, email: 1.5, department: 1.0 },
            config: { languages: ['english'], performance: 'balanced' }
        });
    }
    
    search(query, options = {}) {
        return getSuggestions(this.index, query, 10, {
            includeHighlights: true,
            ...options
        });
    }
}

// Usage
const advancedSearch = new AdvancedSearch();
const results = advancedSearch.search('john');
console.log(results);
```

---

### Node.js (CommonJS & ES Modules)

#### Basic Express Server

```javascript
// server.js
const express = require('express');
const { createFuzzySearch } = require('fuzzyfindjs');

const app = express();
app.use(express.json());

// Sample data
const products = [
    { id: 1, name: 'iPhone 15 Pro', category: 'Smartphones', price: 999 },
    { id: 2, name: 'Samsung Galaxy S24', category: 'Smartphones', price: 899 },
    { id: 3, name: 'MacBook Pro 16"', category: 'Laptops', price: 2499 },
    { id: 4, name: 'Dell XPS 15', category: 'Laptops', price: 1799 },
    { id: 5, name: 'iPad Pro', category: 'Tablets', price: 1099 },
    { id: 6, name: 'Samsung Galaxy Tab', category: 'Tablets', price: 799 }
];

// Create search instances for different use cases
const nameSearch = createFuzzySearch(products.map(p => p.name), {
    languages: ['english'],
    performance: 'balanced',
    maxResults: 5
});

const categorySearch = createFuzzySearch(products.map(p => p.category), {
    languages: ['english'],
    performance: 'fast',
    maxResults: 3
});

// Search endpoint
app.post('/api/search', (req, res) => {
    const { query, type = 'name' } = req.body;
    
    if (!query || query.length < 2) {
        return res.json({ results: [] });
    }
    
    try {
        const searchInstance = type === 'category' ? categorySearch : nameSearch;
        const searchResults = searchInstance.search(query);
        
        // Map results back to full product objects
        const results = searchResults
            .map(result => {
                const searchTerm = type === 'category' ? result.display : result.display;
                const product = products.find(p => 
                    type === 'category' ? p.category === searchTerm : p.name === searchTerm
                );
                return product ? { ...product, score: result.score } : null;
            })
            .filter(Boolean);
        
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Fuzzy search server running on http://localhost:${PORT}`);
});
```

#### ES Modules Version with Multi-field Search

```javascript
// server-esm.mjs
import express from 'express';
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

const app = express();
app.use(express.json());

// Multi-field search index
const users = [
    { name: 'John Doe', email: 'john@example.com', role: 'developer', department: 'engineering' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'designer', department: 'design' },
    { name: 'Bob Johnson', email: 'bob@example.com', role: 'manager', department: 'engineering' },
    { name: 'Alice Brown', email: 'alice@example.com', role: 'developer', department: 'engineering' },
    { name: 'Charlie Wilson', email: 'charlie@example.com', role: 'analyst', department: 'finance' }
];

// Build multi-field index
const userIndex = buildFuzzyIndex(users, {
    fields: ['name', 'email', 'role', 'department'],
    fieldWeights: { name: 2.0, role: 1.5, department: 1.0, email: 1.2 },
    config: { 
        languages: ['english'], 
        performance: 'balanced',
        maxResults: 10 
    }
});

// Search with FQL support
app.post('/api/users/search', async (req, res) => {
    const { query, useFQL = false } = req.body;
    
    try {
        const options = {
            includeHighlights: true,
            fuzzyThreshold: 0.7
        };
        
        if (useFQL) {
            options.enableFQL = true;
            options.fqlOptions = { allowRegex: false, timeout: 5000 };
        }
        
        const results = getSuggestions(userIndex, query, 10, options);
        
        res.json({ 
            results: results.map(r => ({
                ...r.fields,
                score: r.score,
                highlights: r.highlights
            })),
            query,
            useFQL,
            count: results.length
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Advanced fuzzy search server running on http://localhost:${PORT}`);
});
```

#### CLI Tool Example

```javascript
// fuzzy-cli.js
#!/usr/bin/env node

const { createFuzzySearch } = require('fuzzyfindjs');
const fs = require('fs');

// Command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node fuzzy-cli.js <file> <query>');
    process.exit(1);
}

const [filePath, query] = args;

try {
    // Read data file
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    // Create search instance
    const search = createFuzzySearch(lines, {
        languages: ['english'],
        performance: 'balanced',
        maxResults: 10
    });
    
    // Perform search
    const startTime = Date.now();
    const results = search.search(query);
    const searchTime = Date.now() - startTime;
    
    // Display results
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log(`📄 File: ${filePath} (${lines.length} lines)`);
    console.log(`⏱️  Search time: ${searchTime}ms`);
    console.log(`📊 Results: ${results.length}\n`);
    
    if (results.length === 0) {
        console.log('No results found.');
    } else {
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.display}`);
            console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
        });
    }
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
```

---

### React (TypeScript & JavaScript)

#### TypeScript Component with Hooks

```tsx
// FuzzySearch.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { buildFuzzyIndex, getSuggestions, SuggestionResult } from 'fuzzyfindjs';

interface SearchItem {
    id: string;
    name: string;
    category: string;
    description: string;
}

interface FuzzySearchProps {
    data: SearchItem[];
    onResultSelect?: (item: SearchItem) => void;
    placeholder?: string;
    maxResults?: number;
}

export const FuzzySearch: React.FC<FuzzySearchProps> = ({
    data,
    onResultSelect,
    placeholder = 'Search...',
    maxResults = 8
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SuggestionResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Build search index once when data changes
    const searchIndex = useMemo(() => {
        return buildFuzzyIndex(data, {
            fields: ['name', 'category', 'description'],
            fieldWeights: { name: 2.0, category: 1.5, description: 1.0 },
            config: {
                languages: ['english'],
                performance: 'balanced',
                maxResults
            }
        });
    }, [data, maxResults]);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchQuery: string) => {
            if (searchQuery.length < 2) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            try {
                const searchResults = getSuggestions(searchIndex, searchQuery, maxResults, {
                    includeHighlights: true,
                    fuzzyThreshold: 0.6
                });
                setResults(searchResults);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [searchIndex, maxResults]
    );

    // Handle query changes
    useEffect(() => {
        setIsLoading(true);
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    // Handle result selection
    const handleResultClick = (result: SuggestionResult) => {
        const item = data.find(d => d.name === result.display);
        if (item && onResultSelect) {
            onResultSelect(item);
        }
        setQuery(result.display);
        setResults([]);
    };

    return (
        <div className="fuzzy-search">
            <div className="search-input-container">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="search-input"
                    autoFocus
                />
                {isLoading && <div className="search-spinner">Searching...</div>}
            </div>

            {results.length > 0 && (
                <div className="search-results">
                    {results.map((result, index) => (
                        <div
                            key={`${result.display}-${index}`}
                            className="search-result-item"
                            onClick={() => handleResultClick(result)}
                        >
                            <div className="result-name">
                                {highlightText(result.display, result.highlights)}
                            </div>
                            <div className="result-category">
                                {result.fields?.category}
                            </div>
                            <div className="result-score">
                                {(result.score * 100).toFixed(0)}%
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Utility functions
function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function highlightText(text: string, highlights?: any[]): string {
    if (!highlights || highlights.length === 0) return text;
    
    // Simple highlight implementation
    return text; // Implement your highlighting logic here
}
```

#### JavaScript Example with Custom Hook

```jsx
// useFuzzySearch.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

export function useFuzzySearch(data, options = {}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const {
        fields = ['name'],
        fieldWeights = {},
        maxResults = 10,
        threshold = 0.6,
        debounceMs = 300
    } = options;

    // Build search index
    const searchIndex = useMemo(() => {
        return buildFuzzyIndex(data, {
            fields,
            fieldWeights,
            config: {
                languages: ['english'],
                performance: 'balanced',
                maxResults
            }
        });
    }, [data, fields, fieldWeights, maxResults]);

    // Search function
    const search = useCallback(
        debounce((searchQuery) => {
            if (searchQuery.length < 2) {
                setResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            
            try {
                const searchResults = getSuggestions(searchIndex, searchQuery, maxResults, {
                    fuzzyThreshold: threshold,
                    includeHighlights: true
                });
                setResults(searchResults);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, debounceMs),
        [searchIndex, maxResults, threshold, debounceMs]
    );

    useEffect(() => {
        search(query);
    }, [query, search]);

    return {
        query,
        setQuery,
        results,
        isSearching,
        searchIndex
    };
}

// Usage in component
// SearchComponent.jsx
import React from 'react';
import { useFuzzySearch } from './useFuzzySearch';

const SearchComponent = ({ data }) => {
    const { query, setQuery, results, isSearching } = useFuzzySearch(data, {
        fields: ['name', 'category', 'description'],
        fieldWeights: { name: 2.0, category: 1.5 },
        maxResults: 8,
        threshold: 0.7
    });

    return (
        <div className="search-container">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="search-input"
            />
            
            {isSearching && <div className="loading">Searching...</div>}
            
            <div className="results">
                {results.map((result, index) => (
                    <div key={index} className="result-item">
                        <h4>{result.display}</h4>
                        <p>{result.fields?.description}</p>
                        <span className="score">{(result.score * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

---

### Vue 3 (Composition API)

#### TypeScript Component

```vue
<!-- FuzzySearch.vue -->
<template>
  <div class="fuzzy-search">
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @input="handleSearch"
        class="search-input"
      />
      <div v-if="isSearching" class="searching-indicator">
        Searching...
      </div>
    </div>

    <div v-if="results.length > 0" class="search-results">
      <div
        v-for="(result, index) in results"
        :key="`${result.display}-${index}`"
        class="result-item"
        @click="selectResult(result)"
      >
        <div class="result-title">{{ result.display }}</div>
        <div class="result-category">{{ result.fields?.category }}</div>
        <div class="result-score">{{ Math.round(result.score * 100) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { buildFuzzyIndex, getSuggestions, type SuggestionResult } from 'fuzzyfindjs';

interface Props {
  data: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
  placeholder?: string;
  maxResults?: number;
}

interface Emits {
  (e: 'result-selected', item: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  maxResults: 8
});

const emit = defineEmits<Emits>();

const searchQuery = ref('');
const results = ref<SuggestionResult[]>([]);
const isSearching = ref(false);
const searchIndex = ref<any>(null);

// Build search index when data changes
const buildIndex = () => {
  searchIndex.value = buildFuzzyIndex(props.data, {
    fields: ['name', 'category', 'description'],
    fieldWeights: { name: 2.0, category: 1.5, description: 1.0 },
    config: {
      languages: ['english'],
      performance: 'balanced',
      maxResults: props.maxResults
    }
  });
};

// Debounced search function
let searchTimeout: NodeJS.Timeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  
  if (searchQuery.value.length < 2) {
    results.value = [];
    return;
  }

  isSearching.value = true;
  
  searchTimeout = setTimeout(() => {
    performSearch();
  }, 300);
};

const performSearch = () => {
  if (!searchIndex.value) return;

  try {
    const searchResults = getSuggestions(searchIndex.value, searchQuery.value, props.maxResults, {
      includeHighlights: true,
      fuzzyThreshold: 0.6
    });
    results.value = searchResults;
  } catch (error) {
    console.error('Search error:', error);
    results.value = [];
  } finally {
    isSearching.value = false;
  }
};

const selectResult = (result: SuggestionResult) => {
  const item = props.data.find(d => d.name === result.display);
  if (item) {
    emit('result-selected', item);
  }
  searchQuery.value = result.display;
  results.value = [];
};

// Initialize
onMounted(() => {
  buildIndex();
});

watch(() => props.data, () => {
  buildIndex();
}, { deep: true });
</script>

<style scoped>
.fuzzy-search {
  max-width: 500px;
  margin: 0 auto;
}

.search-container {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.searching-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 14px;
}

.search-results {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f9fafb;
}

.result-item:last-child {
  border-bottom: none;
}

.result-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.result-category {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 4px;
}

.result-score {
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
}
</style>
```

#### JavaScript Options API Version

```vue
<!-- FuzzySearchOptions.vue -->
<template>
  <div class="fuzzy-search">
    <input
      v-model="query"
      type="text"
      placeholder="Search..."
      @input="onSearchInput"
      class="search-input"
    />
    
    <div v-if="loading" class="loading">Searching...</div>
    
    <ul v-if="results.length" class="results-list">
      <li
        v-for="(result, index) in results"
        :key="index"
        @click="selectResult(result)"
        class="result-item"
      >
        <span class="result-text">{{ result.display }}</span>
        <span class="result-score">{{ Math.round(result.score * 100) }}%</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

export default {
  name: 'FuzzySearchOptions',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      query: '',
      results: [],
      loading: false,
      searchIndex: null,
      debounceTimer: null
    };
  },
  watch: {
    items: {
      handler() {
        this.buildSearchIndex();
      },
      immediate: true
    }
  },
  methods: {
    buildSearchIndex() {
      this.searchIndex = buildFuzzyIndex(this.items, {
        fields: ['name', 'description'],
        config: {
          languages: ['english'],
          performance: 'balanced',
          maxResults: 10
        }
      });
    },
    
    onSearchInput() {
      clearTimeout(this.debounceTimer);
      
      if (this.query.length < 2) {
        this.results = [];
        return;
      }
      
      this.loading = true;
      
      this.debounceTimer = setTimeout(() => {
        this.performSearch();
      }, 250);
    },
    
    performSearch() {
      try {
        this.results = getSuggestions(this.searchIndex, this.query, 10, {
          fuzzyThreshold: 0.6
        });
      } catch (error) {
        console.error('Search error:', error);
        this.results = [];
      } finally {
        this.loading = false;
      }
    },
    
    selectResult(result) {
      this.$emit('selected', result);
      this.query = result.display;
      this.results = [];
    }
  }
};
</script>

<style scoped>
.fuzzy-search {
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading {
  padding: 8px;
  color: #666;
  font-style: italic;
}

.results-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-item:hover {
  background-color: #f5f5f5;
}

.result-item:last-child {
  border-bottom: none;
}

.result-text {
  flex: 1;
}

.result-score {
  color: #3b82f6;
  font-weight: bold;
  font-size: 12px;
}
</style>
```

---

### Svelte (TypeScript & JavaScript)

#### TypeScript Component

```svelte
<!-- FuzzySearch.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { buildFuzzyIndex, getSuggestions, type SuggestionResult } from 'fuzzyfindjs';

  interface SearchItem {
    id: string;
    name: string;
    category: string;
    description: string;
  }

  export let data: SearchItem[] = [];
  export let placeholder: string = 'Search...';
  export let maxResults: number = 8;

  const dispatch = createEventDispatcher();

  let query: string = '';
  let results: SuggestionResult[] = [];
  let loading: boolean = false;
  let searchIndex: any = null;
  let debounceTimer: NodeJS.Timeout;

  // Build search index
  const buildIndex = () => {
    searchIndex = buildFuzzyIndex(data, {
      fields: ['name', 'category', 'description'],
      fieldWeights: { name: 2.0, category: 1.5, description: 1.0 },
      config: {
        languages: ['english'],
        performance: 'balanced',
        maxResults
      }
    });
  };

  // Perform search
  const performSearch = () => {
    if (!searchIndex || query.length < 2) {
      results = [];
      loading = false;
      return;
    }

    try {
      const searchResults = getSuggestions(searchIndex, query, maxResults, {
        includeHighlights: true,
        fuzzyThreshold: 0.6
      });
      results = searchResults;
    } catch (error) {
      console.error('Search error:', error);
      results = [];
    } finally {
      loading = false;
    }
  };

  // Handle input changes
  const handleInput = () => {
    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
      results = [];
      return;
    }

    loading = true;
    
    debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);
  };

  // Select result
  const selectResult = (result: SuggestionResult) => {
    const item = data.find(d => d.name === result.display);
    if (item) {
      dispatch('resultSelected', item);
    }
    query = result.display;
    results = [];
  };

  // Initialize
  onMount(() => {
    buildIndex();
  });

  // Rebuild index when data changes
  $: if (data) {
    buildIndex();
  }
</script>

<div class="fuzzy-search">
  <div class="search-container">
    <input
      bind:value={query}
      on:input={handleInput}
      type="text"
      {placeholder}
      class="search-input"
    />
    {#if loading}
      <div class="searching">Searching...</div>
    {/if}
  </div>

  {#if results.length > 0}
    <div class="results">
      {#each results as result, index (`${result.display}-${index}`)}
        <div
          class="result-item"
          on:click={() => selectResult(result)}
          role="option"
        >
          <div class="result-name">{result.display}</div>
          <div class="result-category">{result.fields?.category}</div>
          <div class="result-score">{Math.round(result.score * 100)}%</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fuzzy-search {
    max-width: 500px;
    margin: 0 auto;
  }

  .search-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .searching {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 14px;
  }

  .results {
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
  }

  .result-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .result-item:hover {
    background-color: #f9fafb;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-name {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .result-category {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .result-score {
    color: #3b82f6;
    font-size: 12px;
    font-weight: 600;
  }
</style>
```

#### JavaScript Version with Store

```svelte
<!-- FuzzySearchStore.svelte -->
<script>
  import { writable } from 'svelte/store';
  import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

  // Create a reusable search store
  export function createFuzzySearchStore(initialData = [], options = {}) {
    const {
      fields = ['name'],
      fieldWeights = {},
      maxResults = 10,
      threshold = 0.6,
      debounceMs = 300
    } = options;

    const store = writable({
      query: '',
      results: [],
      loading: false,
      index: null
    });

    let debounceTimer;

    // Build index function
    const buildIndex = (data) => {
      const index = buildFuzzyIndex(data, {
        fields,
        fieldWeights,
        config: {
          languages: ['english'],
          performance: 'balanced',
          maxResults
        }
      });

      store.update(state => ({ ...state, index }));
    };

    // Search function
    const search = (query) => {
      clearTimeout(debounceTimer);

      store.update(state => ({ ...state, query }));

      if (query.length < 2) {
        store.update(state => ({ ...state, results: [], loading: false }));
        return;
      }

      store.update(state => ({ ...state, loading: true }));

      debounceTimer = setTimeout(async () => {
        const state = {};
        store.subscribe(s => Object.assign(state, s))();

        try {
          const results = getSuggestions(state.index, query, maxResults, {
            fuzzyThreshold: threshold,
            includeHighlights: true
          });

          store.update(s => ({ ...s, results, loading: false }));
        } catch (error) {
          console.error('Search error:', error);
          store.update(s => ({ ...s, results: [], loading: false }));
        }
      }, debounceMs);
    };

    // Initialize with initial data
    if (initialData.length > 0) {
      buildIndex(initialData);
    }

    return {
      subscribe: store.subscribe,
      search,
      buildIndex,
      setQuery: (query) => search(query)
    };
  }

  // Export for use in components
  export default createFuzzySearchStore;
</script>

<!-- Usage in another component -->
<!-- SearchComponent.svelte -->
<script>
  import { createFuzzySearchStore } from './FuzzySearchStore.svelte';

  const products = [
    { id: 1, name: 'iPhone 15 Pro', category: 'Smartphones', price: 999 },
    { id: 2, name: 'Samsung Galaxy S24', category: 'Smartphones', price: 899 },
    { id: 3, name: 'MacBook Pro', category: 'Laptops', price: 2499 },
    { id: 4, name: 'Dell XPS 15', category: 'Laptops', price: 1799 }
  ];

  const searchStore = createFuzzySearchStore(products, {
    fields: ['name', 'category'],
    fieldWeights: { name: 2.0, category: 1.5 },
    maxResults: 8,
    threshold: 0.7
  });

  let searchQuery = '';
  let results = [];
  let loading = false;

  // Subscribe to store changes
  searchStore.subscribe(state => {
    searchQuery = state.query;
    results = state.results;
    loading = state.loading;
  });

  function handleInput(event) {
    searchStore.setQuery(event.target.value);
  }

  function selectResult(result) {
    console.log('Selected:', result);
    // Handle selection
  }
</script>

<div class="search-component">
  <div class="search-box">
    <input
      type="text"
      value={searchQuery}
      on:input={handleInput}
      placeholder="Search products..."
      class="search-input"
    />
    {#if loading}
      <div class="loading-indicator">Searching...</div>
    {/if}
  </div>

  {#if results.length > 0}
    <div class="results-list">
      {#each results as result}
        <div class="result-item" on:click={() => selectResult(result)}>
          <div class="result-name">{result.display}</div>
          <div class="result-category">{result.fields?.category}</div>
          <div class="result-score">{Math.round(result.score * 100)}%</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-component {
    max-width: 400px;
    margin: 0 auto;
  }

  .search-box {
    position: relative;
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .loading-indicator {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 12px;
  }

  .results-list {
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
  }

  .result-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
  }

  .result-item:hover {
    background-color: #f5f5f5;
  }

  .result-name {
    font-weight: bold;
    margin-bottom: 2px;
  }

  .result-category {
    color: #666;
    font-size: 12px;
    margin-bottom: 2px;
  }

  .result-score {
    color: #3b82f6;
    font-size: 11px;
    font-weight: bold;
  }
</style>
```

---

## 🎯 Next Steps

### Testing Your Implementation

1. **Start with simple data** - Test with a small array first
2. **Check search performance** - Monitor search times
3. **Test with typos** - Verify fuzzy matching works
4. **Experiment with settings** - Adjust thresholds and performance modes
5. **Try multi-field search** - Test field weighting

### Common Patterns

```javascript
// Autocomplete with debouncing
const debouncedSearch = debounce((query) => {
    const results = search.search(query);
    setResults(results);
}, 300);

// Multi-field search with highlighting
const results = getSuggestions(index, query, 10, {
    includeHighlights: true,
    fuzzyThreshold: 0.7
});

// FQL for complex queries
const complexResults = getSuggestions(index, 'fql((title:react OR title:vue) AND senior)', 10, {
    enableFQL: true
});
```

### Performance Tips

- Use **'fast'** performance mode for large datasets
- Set appropriate **maxResults** limits
- Implement **debouncing** for real-time search
- Consider **caching** search results for repeated queries
- Use **field weights** to prioritize important fields

### Troubleshooting

- **No results found?** Check your fuzzyThreshold (try 0.5)
- **Slow search?** Try 'fast' performance mode
- **Missing matches?** Enable more features in configuration
- **Memory issues?** Use inverted index for large datasets

---

**Happy coding with FuzzyFindJS!** 🚀

For more advanced features, check out the [FQL documentation](./FQL.md) and the full [API reference](./README.md).
