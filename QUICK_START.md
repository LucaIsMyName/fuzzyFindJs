# 🚀 Quick Start Guide

## Run the Demo Dashboard

```bash
npm run dev
```

The demo will open automatically at **http://localhost:3000/**

## What You'll See

### 🎯 Main Features

1. **Search Bar** - Type to search in real-time
2. **Results Panel** - See matches with confidence scores
3. **Dictionary Selector** - Switch between 5 different datasets
4. **Performance Modes** - Fast, Balanced, or Comprehensive
5. **Feature Toggles** - Enable/disable specific matching features
6. **Advanced Settings** - Fine-tune thresholds and parameters
7. **Debug Mode** - See detailed matching information

### 📚 Available Dictionaries

- **German Healthcare** - Medical terms with umlauts and compounds
- **German Cities** - Major German cities
- **English Tech** - Technology and programming terms
- **Multi-Language** - German, English, French, Spanish mix
- **Large Dataset** - 1000 items for performance testing

### 🧪 Try These Queries

**German Healthcare:**
- `krankenh` → Finds "Krankenhaus"
- `arzt` → Finds all doctor types
- `apoteke` → Finds "Apotheke" (typo tolerance)

**German Cities:**
- `munchen` → Finds "München" (umlaut handling)
- `berl` → Finds "Berlin" (partial match)

**English Tech:**
- `algoritm` → Finds "Algorithm" (typo)
- `javascrpit` → Finds "JavaScript" (transposition)

**Multi-Language:**
- `hospit` → Finds hospital in all languages
- `doctor` → Finds doctor in all languages

## 🎨 Dashboard Features

✅ **Clean UI** - Modern design with Tailwind CSS  
✅ **No rounded buttons** - Sharp, professional look  
✅ **Blue color scheme** - No purple backgrounds  
✅ **Real-time search** - Results as you type  
✅ **Visual feedback** - Score bars and confidence percentages  
✅ **Responsive** - Works on all screen sizes  

## ⚙️ Configuration Options

### Performance Modes
- **Fast** - Speed optimized (1-3 features)
- **Balanced** - Best mix (4 features) ⭐ Default
- **Comprehensive** - All features (8 features)

### Features You Can Toggle
- Phonetic Matching
- Compound Words
- Synonyms
- Keyboard Neighbors
- Partial Words
- Missing Letters
- Extra Letters
- Transpositions

### Advanced Settings
- **Max Results**: 1-20 results
- **Fuzzy Threshold**: 0.0-1.0 (higher = stricter)
- **Max Edit Distance**: 1-5 characters
- **Min Query Length**: 1-5 characters

## 🔧 Actions

- **Rebuild Index** - Rebuild with new settings
- **Reset to Defaults** - Restore default configuration
- **Clear** - Clear search and results
- **Debug Toggle** - Show/hide debug information

## 📊 What to Look For

1. **Search Time** - Should be <5ms for most queries
2. **Index Build Time** - Shown in dictionary info
3. **Match Confidence** - Percentage score for each result
4. **Match Type** - How the match was found (exact, prefix, phonetic, etc.)

## 💡 Pro Tips

1. Start with **Balanced mode** for best results
2. Use **Debug mode** to understand matching behavior
3. Test with **intentional typos** to see fuzzy matching
4. Try the **Large Dataset** to test performance
5. Experiment with **threshold values** to tune accuracy
6. Compare **performance modes** to see the difference

## 🎯 Next Steps

After exploring the demo:
1. Read the full [README.md](./README.md) for API documentation
2. Check [DEMO.md](./DEMO.md) for detailed testing scenarios
3. Integrate the library into your project
4. Customize configuration for your use case

---

**Enjoy testing FuzzyFindJS!** 🔍
