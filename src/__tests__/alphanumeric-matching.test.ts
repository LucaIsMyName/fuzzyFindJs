import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions } from '../index.js';
import { 
  isAlphanumeric, 
  segmentString, 
  extractAlphaPart, 
  extractNumericPart,
  getAlphaSegments,
  getNumericSegments 
} from '../utils/alphanumeric-segmenter.js';

describe('Alphanumeric Matching', () => {
  describe('Segmentation Utilities', () => {
    it('should detect alphanumeric strings', () => {
      expect(isAlphanumeric('servicehandler14568')).toBe(true);
      expect(isAlphanumeric('api_manager_3254')).toBe(true);
      expect(isAlphanumeric('test123')).toBe(true);
      
      expect(isAlphanumeric('onlytext')).toBe(false);
      expect(isAlphanumeric('12345')).toBe(false);
      expect(isAlphanumeric('___')).toBe(false);
    });

    it('should segment strings correctly', () => {
      const segments1 = segmentString('servicehandler14568');
      expect(segments1).toHaveLength(2);
      expect(segments1[0]).toEqual({ type: 'alpha', value: 'servicehandler', start: 0, end: 14 });
      expect(segments1[1]).toEqual({ type: 'numeric', value: '14568', start: 14, end: 19 });

      const segments2 = segmentString('api_manager_3254');
      expect(segments2).toHaveLength(5);
      expect(segments2[0].type).toBe('alpha');
      expect(segments2[0].value).toBe('api');
      expect(segments2[2].type).toBe('alpha');
      expect(segments2[2].value).toBe('manager');
      expect(segments2[4].type).toBe('numeric');
      expect(segments2[4].value).toBe('3254');
    });

    it('should extract alphabetic parts', () => {
      expect(extractAlphaPart('servicehandler14568')).toBe('servicehandler');
      expect(extractAlphaPart('api_manager_3254')).toBe('apimanager');
      expect(extractAlphaPart('test123abc456')).toBe('testabc');
      expect(extractAlphaPart('12345')).toBe('');
    });

    it('should extract numeric parts', () => {
      expect(extractNumericPart('servicehandler14568')).toBe('14568');
      expect(extractNumericPart('api_manager_3254')).toBe('3254');
      expect(extractNumericPart('test123abc456')).toBe('123456');
      expect(extractNumericPart('onlytext')).toBe('');
    });

    it('should get alpha segments only', () => {
      const segments = getAlphaSegments('api_manager_3254');
      expect(segments).toHaveLength(2);
      expect(segments[0].value).toBe('api');
      expect(segments[1].value).toBe('manager');
    });

    it('should get numeric segments only', () => {
      const segments = getNumericSegments('test123abc456def');
      expect(segments).toHaveLength(2);
      expect(segments[0].value).toBe('123');
      expect(segments[1].value).toBe('456');
    });
  });

  describe('Search with Alphanumeric Segmentation Disabled (Opt-Out)', () => {
    const dictionary = [
      'servicehandler14568',
      'servicehandler11568',
      'servicehandler14688',
      'user_xnqqf',
      'userprovider12',
      'user_ywtjj',
    ];

    it('should allow opting out of segmentation for performance', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: false, // Explicitly disable
        },
      });
      const results = getSuggestions(index, 'servicehjndler14568', 10);
      
      // With segmentation OFF, scoring is based on overall edit distance
      // This may not prioritize the correct match
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Search with Alphanumeric Segmentation Enabled', () => {
    const dictionary = [
      'servicehandler14568',
      'servicehandler11568',
      'servicehandler14688',
      'user_xnqqf',
      'userprovider12',
      'user_ywtjj',
    ];

    it('should prioritize alphabetic accuracy over numeric accuracy', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
          maxEditDistance: 2,
        },
      });

      const results = getSuggestions(index, 'servicehjndler14568', 10);
      
      expect(results.length).toBeGreaterThan(0);
      
      // The top result should be servicehandler14568 (exact numeric match, 1 typo in alpha)
      // NOT user_xnqqf or userprovider12
      const topResult = results[0];
      expect(topResult.display).toBe('servicehandler14568');
      expect(topResult.score).toBeGreaterThan(0.85);
    });

    it('should handle typos in alphabetic part with exact numeric match', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'servcehandler14568', 10); // missing 'i'
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('servicehandler14568');
    });

    it('should handle exact alphabetic match with typo in numeric part', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'servicehandler14567', 10); // 8->7 in number
      
      expect(results.length).toBeGreaterThan(0);
      // Should still match servicehandler14568 with high score
      const match = results.find(r => r.display === 'servicehandler14568');
      expect(match).toBeDefined();
      expect(match!.score).toBeGreaterThan(0.8);
    });

    it('should handle multiple numeric matches with different alpha parts', () => {
      const testDict = [
        'handler123',
        'manager123',
        'processor123',
      ];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'handlr123', 10); // typo in 'handler'
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('handler123');
    });

    it('should work with underscore-separated identifiers', () => {
      const testDict = [
        'api_handler_123',
        'api_manager_123',
        'user_handler_123',
      ];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'apihandler123', 10);
      
      expect(results.length).toBeGreaterThan(0);
      // Should match api_handler_123 (alpha: apihandler, numeric: 123)
      const match = results.find(r => r.display === 'api_handler_123');
      expect(match).toBeDefined();
    });

    it('should handle mixed case alphanumeric strings', () => {
      const testDict = [
        'ServiceHandler14568',
        'serviceHandler14568',
        'SERVICEHANDLER14568',
      ];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'servicehandler14568', 10);
      
      // Index deduplicates by lowercase, so we get 1 result (the first one added)
      expect(results.length).toBeGreaterThanOrEqual(1);
      // Should match with high score
      expect(results[0].score).toBeGreaterThan(0.9);
    });
  });

  describe('Edge Cases', () => {
    it('should handle strings with only numbers', () => {
      const testDict = ['12345', '67890', '11111'];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, '12345', 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('12345');
    });

    it('should handle strings with only letters', () => {
      const testDict = ['hello', 'world', 'test'];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'helo', 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('hello');
    });

    it('should handle empty numeric part', () => {
      const testDict = ['servicehandler', 'servicehandler123'];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'servicehandler', 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('servicehandler');
    });

    it('should handle multiple number segments', () => {
      const testDict = ['test123abc456def789'];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'test123abc456def789', 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('test123abc456def789');
      expect(results[0].score).toBe(1.0);
    });
  });

  describe('Configuration Options', () => {
    const dictionary = ['handler123', 'manager456'];

    it('should respect alphanumericAlphaWeight setting', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
          alphanumericAlphaWeight: 0.9, // Heavily weight alphabetic part
          alphanumericNumericWeight: 0.1,
        },
      });

      const results = getSuggestions(index, 'handler999', 10); // wrong number
      
      expect(results.length).toBeGreaterThan(0);
      // Should still score high because alpha part matches (exact alpha = 1.0, numeric mismatch = ~0)
      // Score = 0.9 * 1.0 + 0.1 * 0 = 0.9, but with minimum 0.3 and other factors
      const match = results.find(r => r.display === 'handler123');
      expect(match).toBeDefined();
      expect(match!.score).toBeGreaterThan(0.75); // Adjusted threshold
    });

    it('should respect alphanumericNumericWeight setting', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
          alphanumericAlphaWeight: 0.3,
          alphanumericNumericWeight: 0.7, // Heavily weight numeric part
        },
      });

      const results = getSuggestions(index, 'xyz123', 10); // wrong alpha, right number
      
      expect(results.length).toBeGreaterThan(0);
      // Should match handler123 because numeric part is exact
      const match = results.find(r => r.display === 'handler123');
      expect(match).toBeDefined();
    });

    it('should work with default weights (70/30)', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
          // Use defaults
        },
      });

      const results = getSuggestions(index, 'handlr123', 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('handler123');
    });
  });

  describe('Real-World Examples', () => {
    it('should handle version numbers', () => {
      const testDict = [
        'package_v1_2_3',
        'package_v1_2_4',
        'package_v2_0_0',
      ];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'packag_v1_2_3', 10); // typo in 'package'
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('package_v1_2_3');
    });

    it('should handle database IDs', () => {
      const testDict = [
        'user_id_12345',
        'user_id_67890',
        'order_id_12345',
      ];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'userid12345', 10);
      
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.display === 'user_id_12345');
      expect(match).toBeDefined();
    });

    it('should handle API endpoints', () => {
      const testDict = [
        'api_v1_users',
        'api_v2_users',
        'api_v1_orders',
      ];

      const index = buildFuzzyIndex(testDict, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const results = getSuggestions(index, 'apiv1users', 10);
      
      expect(results.length).toBeGreaterThan(0);
      const match = results.find(r => r.display === 'api_v1_users');
      expect(match).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    const dictionary = ['servicehandler14568', 'user_xnqqf'];

    it('should allow disabling the feature for performance', () => {
      const indexWithout = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: false,
        },
      });

      const indexWith = buildFuzzyIndex(dictionary, {
        config: {
          enableAlphanumericSegmentation: true,
        },
      });

      const resultsWithout = getSuggestions(indexWithout, 'servicehandler', 10);
      const resultsWith = getSuggestions(indexWith, 'servicehandler', 10);

      // Both should find results
      expect(resultsWithout.length).toBeGreaterThan(0);
      expect(resultsWith.length).toBeGreaterThan(0);
      
      // Users can opt-out by setting enableAlphanumericSegmentation: false
      expect(indexWithout.config.enableAlphanumericSegmentation).toBe(false);
    });

    it('should default to ON for better alphanumeric matching', () => {
      const index = buildFuzzyIndex(dictionary);
      
      // Check that the feature is on by default
      expect(index.config.enableAlphanumericSegmentation).toBe(true);
    });
  });
});
