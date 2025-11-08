import { buildFuzzyIndex, getSuggestions } from './dist/esm/index.js';

const testData = [
  'datamanager3561',
  'datamanager561',
  'datamanager6561',
  'tgmhnavyc',
  'client_daqub',
  'wjdaq'
];

console.log('\n🔍 FuzzyFindJS Test with DEFAULT config:');
console.log('='.repeat(50));

const index = buildFuzzyIndex(testData);
const results = getSuggestions(index, 'daqamanager3561', 10);

console.log('Query: "daqamanager3561"');
results.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});

console.log('\n🔍 FuzzyFindJS Test with COMPREHENSIVE mode:');
console.log('='.repeat(50));

const index2 = buildFuzzyIndex(testData, {
  config: {
    performance: 'comprehensive',
    fuzzyThreshold: 0.1,
  }
});
const results2 = getSuggestions(index2, 'daqamanager3561', 10);

console.log('Query: "daqamanager3561"');
results2.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});

console.log('\n🔍 FuzzyFindJS Test WITHOUT alphanumeric segmentation:');
console.log('='.repeat(50));

const index3 = buildFuzzyIndex(testData, {
  config: {
    enableAlphanumericSegmentation: false,
    fuzzyThreshold: 0.3,
  }
});
const results3 = getSuggestions(index3, 'daqamanager3561', 10);

console.log('Query: "daqamanager3561"');
results3.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
});
