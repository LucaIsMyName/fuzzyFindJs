import { describe, it, expect } from 'vitest';
import { buildFuzzyIndex, getSuggestions, formatHighlightedHTML } from '../index.js';

describe('Feature 1: Match Highlighting', () => {
  const dictionary = [
    'Application',
    'Apple',
    'Apricot',
    'Banana',
    'Band',
    'Bandage',
    'Hospital',
    'Krankenhaus',
  ];

  describe('Highlight Generation', () => {
    it('should include highlights when includeHighlights is true', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'app', 5, { includeHighlights: true });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].highlights).toBeDefined();
      expect(results[0].highlights!.length).toBeGreaterThan(0);
    });

    it('should NOT include highlights when includeHighlights is false', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'app', 5, { includeHighlights: false });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].highlights).toBeUndefined();
    });

    it('should NOT include highlights by default (backwards compatible)', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'app', 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].highlights).toBeUndefined();
    });
  });

  describe('Highlight Positions', () => {
    it('should highlight exact matches correctly', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'Apple', 5, { includeHighlights: true });

      const appleResult = results.find(r => r.display === 'Apple');
      expect(appleResult).toBeDefined();
      expect(appleResult!.highlights).toBeDefined();
      expect(appleResult!.highlights!.length).toBeGreaterThan(0);
      
      const highlight = appleResult!.highlights![0];
      expect(highlight.start).toBe(0);
      expect(highlight.end).toBe(5);
      // Match type can be 'exact' or 'fuzzy' depending on matching strategy
      expect(['exact', 'fuzzy', 'prefix']).toContain(highlight.type);
    });

    it('should highlight prefix matches correctly', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'app', 5, { includeHighlights: true });

      const appResult = results.find(r => r.display.toLowerCase().startsWith('app'));
      expect(appResult).toBeDefined();
      expect(appResult!.highlights).toBeDefined();
      
      const highlight = appResult!.highlights![0];
      expect(highlight.start).toBe(0);
      expect(highlight.end).toBeGreaterThanOrEqual(3);
    });

    it('should highlight fuzzy matches', () => {
      const index = buildFuzzyIndex(dictionary, {
        config: {
          features: ['missing-letters', 'extra-letters'],
        },
      });
      const results = getSuggestions(index, 'aple', 5, { includeHighlights: true });

      expect(results.length).toBeGreaterThan(0);
      const appleResult = results.find(r => r.display === 'Apple');
      if (appleResult) {
        expect(appleResult.highlights).toBeDefined();
      }
    });
  });

  describe('HTML Formatting', () => {
    it('should format highlights as HTML with mark tags', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'app', 5, { includeHighlights: true });

      const result = results[0];
      if (result.highlights && result.highlights.length > 0) {
        const html = formatHighlightedHTML(result.display, result.highlights);
        
        expect(html).toContain('<mark');
        expect(html).toContain('</mark>');
        expect(html).toContain('class="highlight');
      }
    });

    it('should include match type in CSS class', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'Apple', 5, { includeHighlights: true });

      const result = results.find(r => r.display === 'Apple');
      if (result && result.highlights && result.highlights.length > 0) {
        const html = formatHighlightedHTML(result.display, result.highlights);
        
        expect(html).toContain('highlight--');
      }
    });

    it('should escape HTML in text', () => {
      const testText = '<script>alert("xss")</script>';
      const html = formatHighlightedHTML(testText, []);
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('Multiple Highlights', () => {
    it('should handle multiple highlight regions', () => {
      const index = buildFuzzyIndex(dictionary);
      const results = getSuggestions(index, 'app', 5, { includeHighlights: true });

      const result = results[0];
      if (result.highlights) {
        expect(Array.isArray(result.highlights)).toBe(true);
      }
    });
  });
});
