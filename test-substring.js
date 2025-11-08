import { buildFuzzyIndex, getSuggestions } from './dist/esm/index.js';

console.log('\n🔍 Testing Substring Match Improvements');
console.log('='.repeat(60));

// Test case 1: Query "zsjw" should find "kgnyzzsjwjbwcv" (contains exact substring)
const test1 = [
  'dgsjw',
  'kgnyzzsjwjbwcv',  // Contains "zsjw" as exact substring
  'yasxdbezsje'
];

const index1 = buildFuzzyIndex(test1);
const results1 = getSuggestions(index1, 'zsjw', 10);

console.log('\n📝 Test 1: Query "zsjw"');
console.log('Expected: "kgnyzzsjwjbwcv" should rank high (contains exact substring)');
results1.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)}) [${r._debug_matchType}]`);
});

// Test case 2: Query "zajw" should find "mwxkfwzajw" (contains exact substring)
const test2 = [
  'system_lzajd',
  'xbafsqrbqzajs',
  'mwxkfwzajw'  // Contains "zajw" as exact substring
];

const index2 = buildFuzzyIndex(test2);
const results2 = getSuggestions(index2, 'zajw', 10);

console.log('\n📝 Test 2: Query "zajw"');
console.log('Expected: "mwxkfwzajw" should rank high (contains exact substring)');
results2.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)}) [${r._debug_matchType}]`);
});

// Test case 3: Earlier substring positions should score higher
const test3 = [
  'abcdeftest',  // "test" at position 6
  'testxyz',     // "test" at position 0 (prefix)
  'xxtestxx'     // "test" at position 2
];

const index3 = buildFuzzyIndex(test3);
const results3 = getSuggestions(index3, 'test', 10);

console.log('\n📝 Test 3: Query "test" - position matters');
console.log('Expected: Earlier positions should score higher');
results3.forEach((r, i) => {
  console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)}) [${r._debug_matchType}]`);
});

console.log('\n✅ Substring matching tests complete!');
