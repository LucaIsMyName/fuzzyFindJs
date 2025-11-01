# FuzzyFindJS Demo Dashboard

## 🚀 Quick Start

Run the demo dashboard:

```bash
npm run dev
```

The dashboard will automatically open in your browser at `http://localhost:3000`

## 📋 Features

### Search Section
- **Real-time search** with debounced input (150ms delay)
- **Live result count** and search time display
- **Visual score indicators** showing match confidence
- **Match type badges** (exact, prefix, phonetic, synonym, etc.)

### Dictionary Selection
Choose from 5 pre-configured dictionaries:

1. **German Healthcare** (42 medical terms)
   - Krankenhaus, Arzt, Apotheke, etc.
   - Tests: German umlauts, compound words, phonetic matching

2. **German Cities** (40 major cities)
   - Berlin, München, Köln, etc.
   - Tests: Umlaut normalization, partial matching

3. **English Tech Terms** (100+ technology words)
   - Algorithm, JavaScript, Docker, etc.
   - Tests: English phonetic, partial words

4. **Multi-Language Mix** (80+ words in 4 languages)
   - German, English, French, Spanish
   - Tests: Cross-language matching, synonym detection

5. **Large Dataset** (1000 generated items)
   - Performance testing
   - Tests: Index build time, search speed

### Performance Modes

- **Fast**: Minimal features, optimized for speed
  - Features: partial-words, missing-letters
  - Edit distance: 1
  - Threshold: 0.9

- **Balanced**: Good mix of features and performance (default)
  - Features: phonetic, partial-words, missing-letters, keyboard-neighbors
  - Edit distance: 2
  - Threshold: 0.8

- **Comprehensive**: All features enabled
  - Features: All 8 features enabled
  - Edit distance: 3
  - Threshold: 0.7

### Features Toggle

Enable/disable individual features:
- ✅ Phonetic Matching
- ✅ Compound Words (German)
- ✅ Synonyms
- ✅ Keyboard Neighbors
- ✅ Partial Words
- ✅ Missing Letters
- ✅ Extra Letters
- ✅ Transpositions

### Advanced Settings

Fine-tune the search behavior:

- **Max Results** (1-20): Number of results to display
- **Fuzzy Threshold** (0.0-1.0): Minimum confidence score
- **Max Edit Distance** (1-5): Maximum character changes allowed
- **Min Query Length** (1-5): Minimum characters before search starts

### Debug Mode

Toggle debug information to see:
- Query processing details
- Configuration snapshot
- All result metadata
- Index statistics (variants, phonetic codes, n-grams, synonyms)
- Detailed timing information

## 🧪 Testing Scenarios

### Test German Umlauts
```
Dictionary: German Healthcare
Query: "munchen" → Should find "München"
Query: "arzt" → Should find multiple doctor types
```

### Test Phonetic Matching
```
Dictionary: German Healthcare
Query: "krankenh" → Should find "Krankenhaus"
Query: "apoteke" → Should find "Apotheke"
```

### Test Compound Words
```
Dictionary: German Healthcare
Query: "kranken" → Should find "Krankenhaus", "Krankenwagen", "Krankenschwester"
```

### Test Typo Tolerance
```
Dictionary: English Tech
Query: "algoritm" → Should find "Algorithm"
Query: "javascrpit" → Should find "JavaScript"
```

### Test Multi-language
```
Dictionary: Multi-Language
Query: "hospit" → Should find Hospital, Krankenhaus, Hôpital, Hospital
Query: "doctor" → Should find Doctor, Arzt, Médecin, Doctor
```

### Test Performance
```
Dictionary: Large Dataset (1000 items)
- Check index build time (should be <500ms)
- Check search time (should be <5ms)
- Try various queries to test scalability
```

### Test Partial Matching
```
Dictionary: German Cities
Query: "berl" → Should find "Berlin"
Query: "mun" → Should find "München", "Münster", "Mönchengladbach"
```

### Test Synonym Matching
```
Dictionary: German Healthcare
Enable: Synonyms feature
Query: "doktor" → Should find "Arzt" (if synonyms configured)
```

## 🎨 UI Features

- **Clean, modern design** with Tailwind CSS
- **No rounded buttons** (as requested)
- **Blue color scheme** (no purple backgrounds)
- **Responsive layout** (works on mobile and desktop)
- **Smooth transitions** and hover effects
- **Visual score bars** showing match confidence
- **Real-time updates** as you type

## 🔧 Customization

### Add Your Own Dictionary

Edit `demo.js` and add to the `DICTIONARIES` object:

```javascript
'my-custom-dict': {
  name: 'My Custom Dictionary',
  languages: ['english'],
  words: [
    'Word1',
    'Word2',
    'Word3'
  ]
}
```

Then add it to the select dropdown in `index.html`:

```html
<option value="my-custom-dict">My Custom Dictionary</option>
```

### Modify Styling

The dashboard uses Tailwind CSS via CDN. You can:
- Edit classes directly in `index.html`
- Add custom styles in the `<style>` section
- Modify colors, spacing, borders, etc.

## 📊 Performance Metrics

The dashboard displays:
- **Index build time**: How long it takes to build the search index
- **Search time**: How long each search query takes
- **Result count**: Number of matches found
- **Match confidence**: Score for each result (0-100%)

## 🐛 Troubleshooting

### Dashboard won't start
```bash
# Make sure dependencies are installed
npm install

# Try running dev server again
npm run dev
```

### Search not working
- Check browser console for errors
- Make sure query length meets minimum (default: 2 chars)
- Try rebuilding the index with "Rebuild Index" button

### No results appearing
- Lower the fuzzy threshold (try 0.6 or 0.5)
- Increase max edit distance (try 3 or 4)
- Enable more features (especially "partial-words")

### Slow performance
- Switch to "Fast" performance mode
- Reduce max results
- Disable expensive features (compound, synonyms)

## 💡 Tips

1. **Start with Balanced mode** - Good default for most use cases
2. **Use Debug mode** to understand why matches occur
3. **Test with typos** to see fuzzy matching in action
4. **Compare performance modes** with the large dataset
5. **Experiment with thresholds** to find the sweet spot
6. **Try different languages** to see language-specific features

## 🎯 Next Steps

After testing the demo:
1. Integrate the library into your application
2. Customize the configuration based on your needs
3. Add your own dictionaries and synonyms
4. Optimize performance for your use case
5. Check the README.md for full API documentation
