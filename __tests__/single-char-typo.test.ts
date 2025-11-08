import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions } from '../src/index.js';

describe('Single Character Typo Matching', () => {
  it('should find datamanager3561 when searching for daqamanager3561', () => {
    const dictionary = [
      'datamanager3561',
      'datamanager561',
      'datamanager6561',
      'tgmhnavyc',
      'client_daqub',
      'wjdaq'
    ];

    const index = buildFuzzyIndex(dictionary, {
      config: {
        fuzzyThreshold: 0.1, // Very low threshold
        maxEditDistance: 2,
        enableAlphanumericSegmentation: true,
      },
    });

    const results = getSuggestions(index, 'daqamanager3561', 10);
    
    console.log('\n🔍 Single Char Typo Test Results:');
    console.log('Query: "daqamanager3561" (typo: q instead of t)');
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.display} (score: ${r.score.toFixed(2)})`);
    });

    // The correct match should be in the results
    const correctMatch = results.find(r => r.display === 'datamanager3561');
    expect(correctMatch).toBeDefined();
    
    // It should be the top result
    expect(results[0].display).toBe('datamanager3561');
    
    // Score should be reasonably high (single char typo in 16 chars)
    expect(correctMatch!.score).toBeGreaterThan(0.7);
  });

  it('should handle single character substitutions in long strings', () => {
    const dictionary = [
      'servicehandler123',
      'servicemanager456',
      'dataprocessor789'
    ];

    const index = buildFuzzyIndex(dictionary, {
      config: {
        fuzzyThreshold: 0.1,
        maxEditDistance: 2,
      },
    });

    // Query with single char typo: 'x' instead of 'h'
    const results = getSuggestions(index, 'servicexandler123', 10);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].display).toBe('servicehandler123');
    expect(results[0].score).toBeGreaterThan(0.7);
  });
});
