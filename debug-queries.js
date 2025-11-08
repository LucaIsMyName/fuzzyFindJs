import { buildFuzzyIndex, getSuggestions } from './dist/esm/index.js';

// Test data - simulating the problematic queries
const testData1 = [
  'wwefzoini',
  'wwednleik', 
  'gnvadhwwecjofy',
  'data_ywwea',
  'wwbtu',
  'other_word',
  'test_word'
];

const testData2 = [
  'dorjehct',
  'dtjuporjg',
  'web_ijehy',
  'web_cajeh',
  'lorjlhcecelibj',
  'other_word'
];

console.log('\n' + '='.repeat(70));
console.log('🔍 DEBUG: Query "wwe" - Should find prefix matches');
console.log('='.repeat(70));

const index1 = buildFuzzyIndex(testData1, {
  config: {
    performance: 'comprehensive',
    fuzzyThreshold: 0.2,
  }
});

const results1 = getSuggestions(index1, 'wwe', 10, { debug: true });

console.log('\n📋 Final Results:');
results1.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});

console.log('\n' + '='.repeat(70));
console.log('🔍 DEBUG: Query "dorjehc" - Should find dorjehct');
console.log('='.repeat(70));

const index2 = buildFuzzyIndex(testData2, {
  config: {
    performance: 'comprehensive',
    fuzzyThreshold: 0.2,
  }
});

const results2 = getSuggestions(index2, 'dorjehc', 10, { debug: true });

console.log('\n📋 Final Results:');
results2.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});

console.log('\n' + '='.repeat(70));
console.log('✅ Debug complete!');
console.log('='.repeat(70));
