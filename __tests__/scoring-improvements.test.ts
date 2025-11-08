import { buildFuzzyIndex, getSuggestions, PERFORMANCE_CONFIGS } from '../src/index.js';

// Test data similar to the comparison data
const testData = [
  'admincontroller8283',
  'admincontroller3', 
  'admin_lnjvl',
  'data_iopbv',
  'data_vfsob',
  'data_gdacg',
  'apiutil3207',
  'apiutil3807',
  'apiutil87',
  'client_sgmlh',
  'clientmanager9',
  'client_bukzr',
  'nmwaofjmumdh',
  'imwmfz',
  'nuwvlh',
  'apifactory597',
  'api_kfalx',
  'api_gfnta',
  'igdvnjxbjceyg',
  'imduxsgnfar',
  'iudyiobeqc',
  'ufymuzwxylc',
  'test_qufyn',
  'fymxtqekl',
  'api_fjknu',
  'api_yfjkw',
  'api_wfgej',
  'rzgxxmjfv',
  'client_rzgmq',
  'bidavzgx',
  'rnyipomkb',
  'rnyfzfgu',
  'rbnjsg',
  'adminutil4383',
  'admincontroller3',
  'admin_lnjvl',
  'web_rawjn',
  'web_rxoie',
  'web_aaixo',
  'web_gsnww',
  'web_xrdcn',
  'web_xbraa',
  'thgsi',
  'alwlpmhnulacrz',
  'ualwxd',
  'dzmtdalwwetgn',
  'webhandler96',
  'webhandler216',
  'webhandler336',
  'userprovider7452',
  'userprovider12',
  'userprovider132',
  'hbhyub'
];

// Test queries from the comparison
const testQueries = [
  'admincontroller8283',
  'data',
  'apiutil3t07',
  'er39',
  'client_sgmlh',
  'nmw',
  'apkfactory597',
  'i_dd',
  'ufymuzwxylc',
  'api_fjk',
  'rzgxxmcfv',
  'rbny',
  'adminutil4383',
  'web_ra',
  'web_gsnww',
  'hgsq',
  'alwlpmhnulacrz',
  'webha',
  'userprovidir7452',
  '_hyu'
];

function runScoringTests() {
  console.log('🧪 Testing Scoring Granularity Improvements\n');
  
  // Test with different performance modes
  const modes = ['fast', 'balanced', 'comprehensive'] as const;
  
  modes.forEach(mode => {
    console.log(`\n📊 ${mode.toUpperCase()} MODE:`);
    console.log('='.repeat(50));
    
    const config = PERFORMANCE_CONFIGS[mode];
    const index = buildFuzzyIndex(testData, { config });
    
    testQueries.forEach((query, queryIndex) => {
      const startTime = performance.now();
      const results = getSuggestions(index, query, 3);
      const endTime = performance.now();
      
      console.log(`\nQuery ${queryIndex + 1}: "${query}" (${(endTime - startTime).toFixed(2)}ms)`);
      if (results.length === 0) {
        console.log('No results');
      } else {
        results.forEach(result => {
          console.log(`→ ${result.display} (score: ${result.score.toFixed(2)})`);
        });
      }
    });
  });
}

function runShortQueryTests() {
  console.log('\n\n🎯 Testing Short Query Improvements\n');
  console.log('='.repeat(50));
  
  const index = buildFuzzyIndex(testData, {
    config: PERFORMANCE_CONFIGS.comprehensive
  });
  
  const shortQueries = ['hgsq', 'nmw', 'i_dd', '_hyu', 'er39'];
  
  shortQueries.forEach(query => {
    console.log(`\nShort query: "${query}"`);
    const results = getSuggestions(index, query, 5);
    
    if (results.length === 0) {
      console.log('❌ No results found');
    } else {
      results.forEach(result => {
        console.log(`✅ ${result.display} (score: ${result.score.toFixed(2)})`);
      });
    }
  });
}

function runGranularityTests() {
  console.log('\n\n📈 Testing Score Granularity\n');
  console.log('='.repeat(50));
  
  const index = buildFuzzyIndex(testData, {
    config: PERFORMANCE_CONFIGS.balanced
  });
  
  const testQuery = 'apiutil3t07';
  const results = getSuggestions(index, testQuery, 10);
  
  console.log(`Query: "${testQuery}"`);
  console.log('Score distribution:');
  
  const scores = results.map(r => r.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;
  
  console.log(`📊 Score range: ${minScore.toFixed(3)} - ${maxScore.toFixed(3)} (range: ${range.toFixed(3)})`);
  console.log(`📊 Results count: ${results.length}`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.display} (score: ${result.score.toFixed(3)})`);
  });
}

// Run all tests
runScoringTests();
runShortQueryTests();
runGranularityTests();

console.log('\n\n✅ All tests completed!');
