import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, updateIndex, removeFromIndex, getSuggestions } from '../index.js';

describe('Index Updates', () => {
  describe('updateIndex', () => {
    it('should add new items to existing index', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      expect(index.base).toHaveLength(2);
      expect(index.base).toContain('apple');
      expect(index.base).toContain('banana');
      
      updateIndex(index, ['cherry', 'date']);
      
      expect(index.base).toHaveLength(4);
      expect(index.base).toContain('cherry');
      expect(index.base).toContain('date');
    });

    it('should not add duplicates', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      updateIndex(index, ['apple', 'cherry']);
      
      expect(index.base).toHaveLength(3);
      expect(index.base.filter(w => w.toLowerCase() === 'apple')).toHaveLength(1);
    });

    it('should maintain search functionality after update', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      updateIndex(index, ['cherry', 'date']);
      
      const results = getSuggestions(index, 'cherry', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('cherry');
    });

    it('should handle empty newItems array', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      const originalLength = index.base.length;
      
      updateIndex(index, []);
      
      expect(index.base).toHaveLength(originalLength);
    });

    it('should throw error for invalid index', () => {
      expect(() => {
        updateIndex(null as any, ['test']);
      }).toThrow('Invalid index provided');
    });

    it('should update variant mappings', () => {
      const index = buildFuzzyIndex(['apple']);
      
      updateIndex(index, ['äpple']); // Accent variant
      
      // Should be able to find both
      const results1 = getSuggestions(index, 'apple', 5);
      const results2 = getSuggestions(index, 'äpple', 5);
      
      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
    });

    it('should update phonetic mappings', () => {
      const index = buildFuzzyIndex(['phone'], {
        config: {
          features: ['phonetic'],
          languages: ['english']
        }
      });
      
      updateIndex(index, ['fone']);
      
      // Both should be findable phonetically
      const results = getSuggestions(index, 'fone', 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should clear cache after update', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      // Skip if cache not enabled
      if (!index._cache) {
        expect(true).toBe(true);
        return;
      }
      
      // Populate cache
      getSuggestions(index, 'apple', 5);
      expect(index._cache.getStats().size).toBeGreaterThan(0);
      
      // Update index
      updateIndex(index, ['cherry']);
      
      // Cache should be cleared
      expect(index._cache.getStats().size).toBe(0);
    });

    it('should rebuild inverted index if present', () => {
      const largeDataset = Array.from({ length: 100000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(largeDataset);
      
      expect(index.invertedIndex).toBeDefined();
      
      const originalTermCount = index.invertedIndex!.termToPostings.size;
      
      updateIndex(index, ['newword1', 'newword2']);
      
      // Inverted index should be rebuilt with new terms
      expect(index.invertedIndex!.termToPostings.size).toBeGreaterThanOrEqual(originalTermCount);
    });

    it('should support multi-field objects', () => {
      const index = buildFuzzyIndex(
        [
          { title: 'Apple Product', description: 'A fruit' },
          { title: 'Banana Product', description: 'Another fruit' }
        ],
        {
          fields: ['title', 'description']
        }
      );
      
      updateIndex(index, [
        { title: 'Cherry Product', description: 'Yet another fruit' }
      ]);
      
      expect(index.base).toHaveLength(3);
      
      const results = getSuggestions(index, 'cherry', 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should throw error when adding objects to string index', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      expect(() => {
        updateIndex(index, [{ title: 'Cherry' }]);
      }).toThrow('Index was not built with fields');
    });

    it('should call onProgress callback', () => {
      const index = buildFuzzyIndex(['apple']);
      const progressCalls: number[] = [];
      
      updateIndex(index, ['banana', 'cherry', 'date'], {
        onProgress: (current, total) => {
          progressCalls.push(current);
          expect(total).toBe(3);
        }
      });
      
      expect(progressCalls).toEqual([1, 2, 3]);
    });
  });

  describe('removeFromIndex', () => {
    it('should remove items from index', () => {
      const index = buildFuzzyIndex(['apple', 'banana', 'cherry']);
      
      expect(index.base).toHaveLength(3);
      
      removeFromIndex(index, ['banana']);
      
      expect(index.base).toHaveLength(2);
      expect(index.base).toContain('apple');
      expect(index.base).toContain('cherry');
      expect(index.base).not.toContain('banana');
    });

    it('should remove multiple items', () => {
      const index = buildFuzzyIndex(['apple', 'banana', 'cherry', 'date']);
      
      removeFromIndex(index, ['banana', 'date']);
      
      expect(index.base).toHaveLength(2);
      expect(index.base).toContain('apple');
      expect(index.base).toContain('cherry');
    });

    it('should be case-insensitive', () => {
      const index = buildFuzzyIndex(['Apple', 'Banana', 'Cherry']);
      
      removeFromIndex(index, ['banana', 'CHERRY']);
      
      expect(index.base).toHaveLength(1);
      expect(index.base).toContain('Apple');
    });

    it('should handle non-existent items gracefully', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      removeFromIndex(index, ['orange', 'grape']);
      
      expect(index.base).toHaveLength(2);
      expect(index.base).toContain('apple');
      expect(index.base).toContain('banana');
    });

    it('should handle empty itemsToRemove array', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      const originalLength = index.base.length;
      
      removeFromIndex(index, []);
      
      expect(index.base).toHaveLength(originalLength);
    });

    it('should throw error for invalid index', () => {
      expect(() => {
        removeFromIndex(null as any, ['test']);
      }).toThrow('Invalid index provided');
    });

    it('should remove from variant mappings', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      removeFromIndex(index, ['apple']);
      
      // Variant mappings for 'apple' should be cleaned up
      const results = getSuggestions(index, 'apple', 5);
      
      // Should not find 'apple' anymore (might find 'banana' if similar enough)
      const hasApple = results.some(r => r.display.toLowerCase() === 'apple');
      expect(hasApple).toBe(false);
    });

    it('should remove from phonetic mappings', () => {
      const index = buildFuzzyIndex(['phone', 'fone'], {
        config: {
          features: ['phonetic'],
          languages: ['english']
        }
      });
      
      removeFromIndex(index, ['phone']);
      
      expect(index.base).toContain('fone');
      expect(index.base).not.toContain('phone');
    });

    it('should remove from ngram index', () => {
      const index = buildFuzzyIndex(['apple', 'application']);
      
      removeFromIndex(index, ['apple']);
      
      // 'app' ngrams should still exist for 'application'
      const results = getSuggestions(index, 'app', 5);
      expect(results.some(r => r.display === 'application')).toBe(true);
      expect(results.some(r => r.display === 'apple')).toBe(false);
    });

    it('should clear cache after removal', () => {
      const index = buildFuzzyIndex(['apple', 'banana', 'cherry']);
      
      // Skip if cache not enabled
      if (!index._cache) {
        expect(true).toBe(true);
        return;
      }
      
      // Populate cache
      getSuggestions(index, 'apple', 5);
      expect(index._cache.getStats().size).toBeGreaterThan(0);
      
      // Remove item
      removeFromIndex(index, ['banana']);
      
      // Cache should be cleared
      expect(index._cache.getStats().size).toBe(0);
    });

    it('should rebuild inverted index if present', () => {
      const largeDataset = Array.from({ length: 100000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(largeDataset);
      
      expect(index.invertedIndex).toBeDefined();
      
      const originalTermCount = index.invertedIndex!.termToPostings.size;
      
      removeFromIndex(index, ['word0', 'word1', 'word2']);
      
      // Inverted index should be rebuilt
      expect(index.invertedIndex).toBeDefined();
      expect(index.invertedIndex!.termToPostings.size).toBeLessThanOrEqual(originalTermCount);
    });

    it('should remove from field data', () => {
      const index = buildFuzzyIndex(
        [
          { title: 'Apple Product', description: 'A fruit' },
          { title: 'Banana Product', description: 'Another fruit' }
        ],
        {
          fields: ['title', 'description']
        }
      );
      
      expect(index.fieldData?.size).toBe(2);
      
      removeFromIndex(index, ['Apple Product']);
      
      expect(index.fieldData?.size).toBe(1);
      expect(index.fieldData?.has('Apple Product')).toBe(false);
    });

    it('should maintain search functionality after removal', () => {
      const index = buildFuzzyIndex(['apple', 'banana', 'cherry']);
      
      removeFromIndex(index, ['banana']);
      
      const results = getSuggestions(index, 'cherry', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('cherry');
    });
  });

  describe('Combined Operations', () => {
    it('should handle multiple updates and removals', () => {
      const index = buildFuzzyIndex(['apple', 'banana']);
      
      updateIndex(index, ['cherry', 'date']);
      expect(index.base).toHaveLength(4);
      
      removeFromIndex(index, ['banana', 'date']);
      expect(index.base).toHaveLength(2);
      expect(index.base).toContain('apple');
      expect(index.base).toContain('cherry');
      
      updateIndex(index, ['elderberry']);
      expect(index.base).toHaveLength(3);
    });

    it('should maintain index integrity through operations', () => {
      const index = buildFuzzyIndex(['apple', 'banana', 'cherry']);
      
      // Update
      updateIndex(index, ['date', 'elderberry']);
      
      // Remove
      removeFromIndex(index, ['banana', 'cherry']);
      
      // Update again
      updateIndex(index, ['fig', 'grape']);
      
      // Verify all operations worked
      expect(index.base).toHaveLength(5); // apple, date, elderberry, fig, grape
      
      // Verify search still works
      const results = getSuggestions(index, 'grape', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe('grape');
    });

    it('should handle real-world CRUD scenario', () => {
      // Initial product catalog
      const index = buildFuzzyIndex([
        'Laptop Pro 15',
        'Laptop Air 13',
        'Desktop Tower',
        'Monitor 27"'
      ]);
      
      // Add new products
      updateIndex(index, [
        'Laptop Pro 16',
        'Tablet 10"'
      ]);
      
      expect(index.base).toHaveLength(6);
      
      // Discontinue old model
      removeFromIndex(index, ['Laptop Pro 15']);
      
      expect(index.base).toHaveLength(5);
      
      // Search for laptops
      const laptopResults = getSuggestions(index, 'laptop', 10);
      expect(laptopResults.length).toBeGreaterThan(0);
      
      // Old model should not appear
      const hasOldModel = laptopResults.some(r => r.display === 'Laptop Pro 15');
      expect(hasOldModel).toBe(false);
      
      // New model should appear
      const hasNewModel = laptopResults.some(r => r.display === 'Laptop Pro 16');
      expect(hasNewModel).toBe(true);
    });
  });
});
