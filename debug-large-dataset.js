import { buildFuzzyIndex, getSuggestions } from './dist/esm/index.js';

// Larger dataset - more realistic scenario
const largeDataset = [
  // Words starting with "wwe"
  'wwefzoini',
  'wwednleik',
  // Words containing "wwe"
  'gnvadhwwecjofy',
  'data_ywwea',
  'wwbtu',
  // Many other random words to simulate real dataset
  ...Array.from({ length: 100 }, (_, i) => `random_word_${i}`),
  ...Array.from({ length: 50 }, (_, i) => `test_item_${i}`),
  ...Array.from({ length: 50 }, (_, i) => `data_entry_${i}`),
];

console.log('\n' + '='.repeat(70));
console.log(`🔍 Testing with ${largeDataset.length} items`);
console.log('='.repeat(70));

console.log('\n📝 Query: "wwe" (comprehensive mode)');
const index = buildFuzzyIndex(largeDataset, {
  config: {
    performance: 'comprehensive',
    fuzzyThreshold: 0.2,
  }
});

const results = getSuggestions(index, 'wwe', 3, { debug: false });

console.log('\n📋 Top 3 Results:');
results.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});

// Now test with debug to see what's happening
console.log('\n' + '='.repeat(70));
console.log('🔍 Same query with DEBUG enabled');
console.log('='.repeat(70));

const resultsDebug = getSuggestions(index, 'wwe', 10, { debug: true });

console.log('\n📋 Top 10 Results:');
resultsDebug.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});
