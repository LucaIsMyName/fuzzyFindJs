import { buildFuzzyIndex, getSuggestions, PERFORMANCE_CONFIGS, formatHighlightedHTML, serializeIndex, deserializeIndex, getSerializedSize } from './src/index.js';

// Mock Dictionaries
const DICTIONARIES = {
  'german-healthcare': {
    name: 'German Healthcare',
    languages: ['german'],
    words: [
      //
      'Krankenhaus', 'Pflegeheim', 'Ambulanz', 'Hausarzt', 'Zahnarzt',
      'Kinderarzt', 'Frauenarzt', 'Augenarzt', 'Hautarzt', 'HNO-Arzt',
      'Notaufnahme', 'Intensivstation', 'Operationssaal', 'Röntgenabteilung',
      'Apotheke', 'Sanitätshaus', 'Physiotherapie', 'Ergotherapie',
      'Krankenwagen', 'Rettungsdienst', 'Notarzt', 'Sanitäter',
      'Krankenschwester', 'Pfleger', 'Hebamme', 'Arzthelfer',
      'Medikament', 'Rezept', 'Diagnose', 'Behandlung', 'Therapie',
      'Untersuchung', 'Blutabnahme', 'Impfung', 'Operation',
      'Rehabilitation', 'Vorsorge', 'Nachsorge', 'Sprechstunde',
      'Wartezeit', 'Terminvereinbarung', 'Überweisung', 'Krankschreibung'
    ]
  },
  'german-cities': {
    name: 'German Cities',
    languages: ['german'],
    words: [
      'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt',
      'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
      'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg',
      'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
      'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen',
      'Mönchengladbach', 'Braunschweig', 'Chemnitz', 'Kiel', 'Aachen',
      'Halle', 'Magdeburg', 'Freiburg', 'Krefeld', 'Lübeck',
      'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel'
    ]
  },
  'english-tech': {
    name: 'English Tech Terms',
    languages: ['english'],
    words: [
      'Algorithm', 'Application', 'Architecture', 'Authentication', 'Authorization',
      'Backend', 'Bandwidth', 'Binary', 'Blockchain', 'Bootstrap',
      'Browser', 'Cache', 'Callback', 'Certificate', 'Cipher',
      'Client', 'Cloud', 'Cluster', 'Compiler', 'Component',
      'Compression', 'Configuration', 'Container', 'Cookie', 'Cryptocurrency',
      'Database', 'Debugging', 'Deployment', 'Development', 'DevOps',
      'Docker', 'Documentation', 'Domain', 'Encryption', 'Endpoint',
      'Framework', 'Frontend', 'Function', 'Gateway', 'GitHub',
      'GraphQL', 'Hashing', 'Hosting', 'HTML', 'HTTP',
      'Infrastructure', 'Integration', 'Interface', 'JavaScript', 'JSON',
      'Kubernetes', 'Library', 'Linux', 'Microservice', 'Middleware',
      'Migration', 'Module', 'MongoDB', 'Monitoring', 'Network',
      'Node.js', 'OAuth', 'Object', 'Operating System', 'Optimization',
      'Package', 'Parameter', 'Performance', 'Plugin', 'PostgreSQL',
      'Protocol', 'Python', 'Query', 'React', 'Redis',
      'Refactoring', 'Repository', 'REST', 'Router', 'Scalability',
      'Security', 'Server', 'Service', 'Socket', 'SQL',
      'SSL', 'Stack', 'Storage', 'Syntax', 'System',
      'Testing', 'Token', 'TypeScript', 'Ubuntu', 'UI/UX',
      'Validation', 'Variable', 'Version Control', 'Virtual Machine', 'Vue.js',
      'Webpack', 'WebSocket', 'Widget', 'Workflow', 'XML', "Design", "Vibe Engineering", "Ubuntu", "MacOs", "Windows 11", "iOS", "Open Source Software", "Source Map", "Search Index", "Index", "Continuity", "Race Condition"
    ]
  },
  'multi-language': {
    name: 'Multi-Language Mix',
    languages: [
      'german', 'english', 'french', 'spanish'],
    words: [
      // Healthcare
      'Hospital', 'Krankenhaus', 'Hôpital', 'Hospital',
      'Doctor', 'Arzt', 'Médecin', 'Doctor',
      'Nurse', 'Krankenschwester', 'Infirmière', 'Enfermera',
      'Medicine', 'Medizin', 'Médicament', 'Medicina',

      // Education
      'School', 'Schule', 'École', 'Escuela',
      'University', 'Universität', 'Université', 'Universidad',
      'Teacher', 'Lehrer', 'Professeur', 'Profesor',
      'Student', 'Student', 'Étudiant', 'Estudiante',

      // Transportation
      'Car', 'Auto', 'Voiture', 'Coche',
      'Train', 'Zug', 'Train', 'Tren',
      'Bus', 'Bus', 'Bus', 'Autobús',
      'Airplane', 'Flugzeug', 'Avion', 'Avión',

      // Food
      'Restaurant', 'Restaurant', 'Restaurant', 'Restaurante',
      'Bread', 'Brot', 'Pain', 'Pan',
      'Water', 'Wasser', 'Eau', 'Agua',
      'Coffee', 'Kaffee', 'Café', 'Café',

      // Common
      'House', 'Haus', 'Maison', 'Casa',
      'Street', 'Straße', 'Rue', 'Calle',
      'City', 'Stadt', 'Ville', 'Ciudad',
      'Country', 'Land', 'Pays', 'País'
    ]
  },
  'large-dataset': {
    name: 'Large Dataset (10000 items)',
    languages: ['english'],
    words: generateLargeDataset(10000)
  }
};

// Generate large dataset for performance testing
function generateLargeDataset(count) {
  const prefixes = ['Super', 'Mega', 'Ultra', 'Hyper', 'Meta', 'Cyber', 'Digital', 'Smart', 'Quick', 'Fast'];
  const middles = ['Tech', 'Soft', 'Data', 'Cloud', 'Net', 'Web', 'App', 'Code', 'Dev', 'Sys'];
  const suffixes = ['Pro', 'Plus', 'Max', 'Prime', 'Elite', 'Advanced', 'Premium', 'Express', 'Hub', 'Lab'];

  const words = [];
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    words.push(`${prefix}${middle}${suffix}${i}`);
  }
  return words;
}

// LocalStorage key
const STORAGE_KEY = 'fuzzyfindjs-demo-state';

// Global state
let currentIndex = null;
let currentDictionary = 'german-healthcare';
let currentConfig = {
  languages: ['german'],
  performance: 'balanced',
  features: [],
  maxResults: 5,
  fuzzyThreshold: 0.8,
  maxEditDistance: 2,
  minQueryLength: 2
};

// Load state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      console.log('📦 Loaded state from localStorage:', state);
      return state;
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
  return null;
}

// Save state to localStorage
function saveState() {
  try {
    const state = {
      searchQuery: document.getElementById('searchInput').value,
      dictionary: currentDictionary,
      config: currentConfig,
      debugEnabled: document.getElementById('debugToggle').checked
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('💾 Saved state to localStorage');

    // Show save indicator
    showSaveIndicator();
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
}

// Show visual feedback that settings were saved
function showSaveIndicator() {
  const indicator = document.getElementById('saveIndicator');
  if (indicator) {
    indicator.style.opacity = '1';
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }
}

// Restore UI from saved state
function restoreState(state) {
  if (!state) return;

  // Restore search query
  if (state.searchQuery) {
    document.getElementById('searchInput').value = state.searchQuery;
  }

  // Restore dictionary
  if (state.dictionary && DICTIONARIES[state.dictionary]) {
    currentDictionary = state.dictionary;
    document.getElementById('dictionarySelect').value = state.dictionary;
  }

  // Restore config
  if (state.config) {
    currentConfig = { ...currentConfig, ...state.config };

    // Restore performance mode
    if (state.config.performance) {
      const radio = document.querySelector(`input[name="performance"][value="${state.config.performance}"]`);
      if (radio) radio.checked = true;
    }

    // Restore features
    if (state.config.features) {
      document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.checked = state.config.features.includes(checkbox.value);
      });
    }

    // Restore advanced settings
    if (state.config.maxResults !== undefined) {
      document.getElementById('maxResults').value = state.config.maxResults;
      updateMaxResults(state.config.maxResults);
    }
    if (state.config.fuzzyThreshold !== undefined) {
      document.getElementById('fuzzyThreshold').value = state.config.fuzzyThreshold;
      updateFuzzyThreshold(state.config.fuzzyThreshold);
    }
    if (state.config.maxEditDistance !== undefined) {
      document.getElementById('maxEditDistance').value = state.config.maxEditDistance;
      updateMaxEditDistance(state.config.maxEditDistance);
    }
    if (state.config.minQueryLength !== undefined) {
      document.getElementById('minQueryLength').value = state.config.minQueryLength;
      updateMinQueryLength(state.config.minQueryLength);
    }
  }

  // Restore debug toggle
  if (state.debugEnabled) {
    document.getElementById('debugToggle').checked = true;
    document.getElementById('debugInfo').classList.remove('hidden');
  }

  console.log('✅ State restored from localStorage');
}

// Initialize
function init() {
  console.log('🚀 Initializing FuzzyFindJS Demo Dashboard...');

  // Load saved state
  const savedState = loadState();

  if (savedState) {
    // Restore from localStorage
    restoreState(savedState);
  } else {
    // Set initial features based on performance mode
    updateFeaturesFromPerformance('balanced');
  }

  // Build initial index
  rebuildIndex();

  // Set up event listeners
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(() => {
    handleSearch();
    saveState(); // Auto-save on search
  }, 150));

  // Auto-save on any form change
  setupAutoSave();

  console.log('✅ Dashboard ready!');
}

// Setup auto-save listeners
function setupAutoSave() {
  // Dictionary change
  document.getElementById('dictionarySelect').addEventListener('change', saveState);

  // Performance mode change
  document.querySelectorAll('input[name="performance"]').forEach(radio => {
    radio.addEventListener('change', saveState);
  });

  // Feature checkboxes
  document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', saveState);
  });

  // Advanced settings sliders
  ['maxResults', 'fuzzyThreshold', 'maxEditDistance', 'minQueryLength'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveState);
  });

  // Debug toggle
  document.getElementById('debugToggle').addEventListener('change', saveState);
}

// Rebuild index with current configuration
window.rebuildIndex = function () {
  const dict = DICTIONARIES[currentDictionary];

  console.log('🔨 Building index...', {
    dictionary: dict.name,
    wordCount: dict.words.length,
    config: currentConfig
  });

  const startTime = performance.now();

  currentIndex = buildFuzzyIndex(dict.words, {
    config: {
      languages: dict.languages,
      performance: currentConfig.performance,
      features: currentConfig.features,
      maxResults: currentConfig.maxResults,
      fuzzyThreshold: currentConfig.fuzzyThreshold,
      maxEditDistance: currentConfig.maxEditDistance,
      minQueryLength: currentConfig.minQueryLength
    }
  });

  const buildTime = (performance.now() - startTime).toFixed(2);

  console.log(`✅ Index built in ${buildTime}ms`);

  // Update dictionary info
  updateDictionaryInfo(dict, buildTime);

  // Re-run search if there's a query
  const query = document.getElementById('searchInput').value;
  if (query) {
    handleSearch();
  }
};

// Update dictionary info display
function updateDictionaryInfo(dict, buildTime) {
  const info = document.getElementById('dictionaryInfo');
  info.innerHTML = `
    <div><strong>${dict.name}</strong></div>
    <div class="mt-1">Words: ${dict.words.length}</div>
    <div>Languages: ${dict.languages.join(', ')}</div>
    <div>Build time: ${buildTime}ms</div>
  `;
}

// Handle search
function handleSearch() {
  const query = document.getElementById('searchInput').value;

  if (!currentIndex || query.length < currentConfig.minQueryLength) {
    if (query.length > 0 && query.length < currentConfig.minQueryLength) {
      showResults([], 0, `Query too short (min: ${currentConfig.minQueryLength} chars)`);
    } else {
      showNoResults();
    }
    return;
  }

  const startTime = performance.now();
  const results = getSuggestions(currentIndex, query, currentConfig.maxResults);
  const searchTime = (performance.now() - startTime).toFixed(2);

  showResults(results, searchTime, null);

  if (document.getElementById('debugToggle').checked) {
    showDebugInfo(query, results, searchTime);
  }
}

// Show results
function showResults(results, searchTime, errorMsg) {
  const container = document.getElementById('resultsContainer');
  const resultCount = document.getElementById('resultCount');
  const searchTimeEl = document.getElementById('searchTime');

  resultCount.textContent = results.length;
  searchTimeEl.textContent = searchTime ? `(${searchTime}ms)` : '';

  if (errorMsg) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>${errorMsg}</p>
      </div>
    `;
    return;
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p>No results found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = results.map((result, index) => `
    <div class="result-item border border-gray-200 p-4 transition-all">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-gray-900">${escapeHtml(result.display)}</span>
            ${result.isSynonym ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1">Synonym</span>' : ''}
          </div>
          <div class="mt-1 text-sm text-gray-600">
            ${result.language ? `Language: ${result.language}` : ''}
          </div>
        </div>
        <div class="text-right ml-4">
          <div class="text-2xl font-bold text-blue-600">${(result.score * 100).toFixed(0)}%</div>
          <div class="text-xs text-gray-500">confidence</div>
        </div>
      </div>
      
      <!-- Score Bar -->
      <div class="mt-3 bg-gray-200 h-2 overflow-hidden">
        <div class="bg-blue-600 h-full transition-all" style="width: ${result.score * 100}%"></div>
      </div>
      
      ${result._debug_matchType ? `
        <div class="mt-2 text-xs text-gray-500">
          Match type: <span class="font-mono bg-gray-100 px-1">${result._debug_matchType}</span>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Show no results state
function showNoResults() {
  const container = document.getElementById('resultsContainer');
  container.innerHTML = `
    <div class="text-center py-12 text-gray-400">
      <svg class="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <p>Start typing to see results...</p>
    </div>
  `;
  document.getElementById('resultCount').textContent = '0';
  document.getElementById('searchTime').textContent = '';
}

// Show debug information
function showDebugInfo(query, results, searchTime) {
  const debugContent = document.getElementById('debugContent');

  const debugData = {
    query: {
      original: query,
      length: query.length,
      normalized: query.toLowerCase()
    },
    config: currentConfig,
    results: {
      count: results.length,
      searchTime: `${searchTime}ms`,
      items: results.map(r => ({
        display: r.display,
        score: r.score,
        matchType: r._debug_matchType,
        language: r.language
      }))
    },
    index: {
      baseWords: currentIndex.base.length,
      variants: currentIndex.variantToBase.size,
      phonetic: currentIndex.phoneticToBase.size,
      ngrams: currentIndex.ngramIndex.size,
      synonyms: currentIndex.synonymMap.size
    }
  };

  debugContent.textContent = JSON.stringify(debugData, null, 2);
}

// Toggle debug panel
window.toggleDebug = function () {
  const debugInfo = document.getElementById('debugInfo');
  const isChecked = document.getElementById('debugToggle').checked;

  if (isChecked) {
    debugInfo.classList.remove('hidden');
    handleSearch(); // Refresh to show debug info
  } else {
    debugInfo.classList.add('hidden');
  }
};

// Change dictionary
window.changeDictionary = function () {
  const select = document.getElementById('dictionarySelect');
  currentDictionary = select.value;

  // Update languages based on dictionary
  const dict = DICTIONARIES[currentDictionary];
  currentConfig.languages = dict.languages;

  rebuildIndex();
  saveState();
};

// Update configuration
window.updateConfig = function () {
  // Get performance mode
  const performanceMode = document.querySelector('input[name="performance"]:checked').value;
  currentConfig.performance = performanceMode;

  // Get selected features
  const featureCheckboxes = document.querySelectorAll('.feature-checkbox:checked');
  currentConfig.features = Array.from(featureCheckboxes).map(cb => cb.value);

  // Get advanced settings
  currentConfig.maxResults = parseInt(document.getElementById('maxResults').value);
  currentConfig.fuzzyThreshold = parseFloat(document.getElementById('fuzzyThreshold').value);
  currentConfig.maxEditDistance = parseInt(document.getElementById('maxEditDistance').value);
  currentConfig.minQueryLength = parseInt(document.getElementById('minQueryLength').value);

  rebuildIndex();
  saveState();
};

// Update features based on performance mode
function updateFeaturesFromPerformance(mode) {
  const presetFeatures = PERFORMANCE_CONFIGS[mode].features || [];

  // Update checkboxes
  document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
    checkbox.checked = presetFeatures.includes(checkbox.value);
  });

  currentConfig.features = presetFeatures;
}

// Update slider values
window.updateMaxResults = function (value) {
  document.getElementById('maxResultsValue').textContent = value;
};

window.updateFuzzyThreshold = function (value) {
  document.getElementById('fuzzyThresholdValue').textContent = value;
};

window.updateMaxEditDistance = function (value) {
  document.getElementById('maxEditDistanceValue').textContent = value;
};

window.updateMinQueryLength = function (value) {
  document.getElementById('minQueryLengthValue').textContent = value;
};

// Reset configuration
window.resetConfig = function () {
  // Reset to balanced mode
  document.querySelector('input[name="performance"][value="balanced"]').checked = true;

  // Reset sliders
  document.getElementById('maxResults').value = 5;
  document.getElementById('fuzzyThreshold').value = 0.8;
  document.getElementById('maxEditDistance').value = 2;
  document.getElementById('minQueryLength').value = 2;

  updateMaxResults(5);
  updateFuzzyThreshold(0.8);
  updateMaxEditDistance(2);
  updateMinQueryLength(2);

  // Update features
  updateFeaturesFromPerformance('balanced');

  // Reset config
  currentConfig = {
    languages: DICTIONARIES[currentDictionary].languages,
    performance: 'balanced',
    features: PERFORMANCE_CONFIGS.balanced.features || [],
    maxResults: 5,
    fuzzyThreshold: 0.8,
    maxEditDistance: 2,
    minQueryLength: 2
  };

  rebuildIndex();
  saveState();
};

// Clear search
window.clearSearch = function () {
  document.getElementById('searchInput').value = '';
  showNoResults();
  document.getElementById('debugInfo').classList.add('hidden');
  document.getElementById('debugToggle').checked = false;
  saveState();
};

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Content Search Demo
let contentSearchIndex = null;
const contentText = `FuzzyFindJS is a powerful fuzzy search library with multi-language support. 
It features phonetic matching, compound word splitting, and intelligent synonym support. 
The library is optimized for performance with three different modes: fast, balanced, and comprehensive. 
It includes an inverted index for large datasets and search result caching for lightning-fast autocomplete.`;

function initContentSearch() {
  // Extract words from content
  const words = contentText.split(/\s+/).filter(w => w.length > 2);
  
  // Build index with highlighting enabled
  contentSearchIndex = buildFuzzyIndex(words, {
    config: {
      languages: ['english'],
      performance: 'balanced',
      enableCache: true,
      cacheSize: 50
    }
  });

  // Add event listener
  const contentSearchInput = document.getElementById('contentSearch');
  if (contentSearchInput) {
    contentSearchInput.addEventListener('input', debounce(performContentSearch, 150));
  }
}

function performContentSearch() {
  const query = document.getElementById('contentSearch').value.trim();
  const resultsContainer = document.getElementById('contentSearchResults');
  const cacheStatsEl = document.getElementById('cacheStats');

  if (!query || query.length < 2) {
    resultsContainer.innerHTML = `<p class="text-gray-700">${escapeHtml(contentText)}</p>`;
    if (cacheStatsEl) cacheStatsEl.textContent = 'N/A';
    return;
  }

  // Search with highlighting
  const results = getSuggestions(contentSearchIndex, query, 10, {
    includeHighlights: true
  });

  // Update cache stats
  if (cacheStatsEl && contentSearchIndex._cache) {
    const stats = contentSearchIndex._cache.getStats();
    cacheStatsEl.textContent = `${stats.hits} hits, ${stats.misses} misses (${(stats.hitRate * 100).toFixed(1)}% hit rate)`;
  }

  if (results.length === 0) {
    resultsContainer.innerHTML = `<p class="text-gray-500 italic">No matches found for "${escapeHtml(query)}"</p>`;
    return;
  }

  // Highlight matches in the original text
  const matchedWords = new Map(results.map(r => [r.display.toLowerCase(), r]));

  // Split text into words and whitespace, preserving structure
  const words = contentText.split(/(\s+)/);
  const highlightedWords = words.map(word => {
    // Skip whitespace
    if (/^\s+$/.test(word)) {
      return word;
    }

    // Clean word for matching (remove punctuation)
    const cleanWord = word.toLowerCase().replace(/^[.,!?;:]+|[.,!?;:]+$/g, '');
    
    if (matchedWords.has(cleanWord)) {
      const result = matchedWords.get(cleanWord);
      
      // Extract punctuation
      const leadingPunct = word.match(/^[.,!?;:]+/)?.[0] || '';
      const trailingPunct = word.match(/[.,!?;:]+$/)?.[0] || '';
      const wordCore = word.slice(leadingPunct.length, word.length - trailingPunct.length);
      
      // Apply highlights if available
      if (result.highlights && result.highlights.length > 0) {
        return leadingPunct + formatHighlightedHTML(wordCore, result.highlights) + trailingPunct;
      }
      
      // Fallback to simple highlight
      return leadingPunct + `<mark class="highlight highlight--exact">${escapeHtml(wordCore)}</mark>` + trailingPunct;
    }
    
    return escapeHtml(word);
  });

  resultsContainer.innerHTML = `
    <p class="text-gray-700">${highlightedWords.join('')}</p>
    <div class="mt-3 pt-3 border-t border-gray-300">
      <p class="text-xs text-gray-600 font-semibold mb-2">Found ${results.length} matches:</p>
      <div class="flex flex-wrap gap-2">
        ${results.slice(0, 10).map(r => `
          <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
            ${r.highlights && r.highlights.length > 0 ? formatHighlightedHTML(r.display, r.highlights) : escapeHtml(r.display)}
            <span class="text-blue-600">${(r.score * 100).toFixed(0)}%</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// Serialization Functions
const INDEX_STORAGE_KEY = 'fuzzy-search-index';
const INDEX_META_KEY = 'fuzzy-search-index-meta';

window.saveIndexToStorage = function() {
  if (!currentIndex) {
    alert('No index to save! Build an index first.');
    return;
  }

  try {
    const startTime = performance.now();
    const serialized = serializeIndex(currentIndex);
    const saveTime = (performance.now() - startTime).toFixed(2);
    
    // Save to localStorage
    localStorage.setItem(INDEX_STORAGE_KEY, serialized);
    
    // Save metadata
    const meta = {
      dictionary: currentDictionary,
      timestamp: new Date().toISOString(),
      size: getSerializedSize(currentIndex),
      wordCount: currentIndex.base.length
    };
    localStorage.setItem(INDEX_META_KEY, JSON.stringify(meta));
    
    updateSerializationStatus();
    
    alert(`✅ Index saved successfully!\\n\\nSize: ${(meta.size / 1024).toFixed(2)} KB\\nWords: ${meta.wordCount}\\nTime: ${saveTime}ms`);
  } catch (error) {
    console.error('Save error:', error);
    alert('❌ Failed to save index: ' + error.message);
  }
};

window.loadIndexFromStorage = async function() {
  try {
    const serialized = localStorage.getItem(INDEX_STORAGE_KEY);
    if (!serialized) {
      alert('No saved index found. Save an index first!');
      return;
    }

    const startTime = performance.now();
    currentIndex = await deserializeIndex(serialized);
    const loadTime = (performance.now() - startTime).toFixed(2);
    
    // Update UI
    const meta = JSON.parse(localStorage.getItem(INDEX_META_KEY) || '{}');
    currentDictionary = meta.dictionary || 'german-healthcare';
    document.getElementById('dictionarySelect').value = currentDictionary;
    updateDictionaryInfo();
    updateSerializationStatus();
    
    // Clear search
    document.getElementById('searchInput').value = '';
    showNoResults();
    
    alert(`✅ Index loaded successfully!\\n\\nWords: ${currentIndex.base.length}\\nLoad time: ${loadTime}ms\\n\\n🚀 ${(256 / parseFloat(loadTime)).toFixed(0)}x faster than rebuild!`);
  } catch (error) {
    console.error('Load error:', error);
    alert('❌ Failed to load index: ' + error.message);
  }
};

window.clearSavedIndex = function() {
  if (confirm('Are you sure you want to delete the saved index?')) {
    localStorage.removeItem(INDEX_STORAGE_KEY);
    localStorage.removeItem(INDEX_META_KEY);
    updateSerializationStatus();
    alert('✅ Saved index cleared!');
  }
};

function updateSerializationStatus() {
  const statusEl = document.getElementById('serializationStatus');
  const meta = localStorage.getItem(INDEX_META_KEY);
  
  if (meta) {
    const data = JSON.parse(meta);
    const date = new Date(data.timestamp);
    statusEl.innerHTML = `
      <div class="text-green-700 font-semibold">✅ Index Saved</div>
      <div class="mt-1 text-gray-600">
        <div>Dictionary: ${data.dictionary}</div>
        <div>Words: ${data.wordCount.toLocaleString()}</div>
        <div>Size: ${(data.size / 1024).toFixed(2)} KB</div>
        <div>Saved: ${date.toLocaleTimeString()}</div>
      </div>
    `;
  } else {
    statusEl.innerHTML = '<div class="text-gray-500">No saved index</div>';
  }
}

// Initialize on load
init();
initContentSearch();
updateSerializationStatus();
