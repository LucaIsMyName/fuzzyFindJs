# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-01

### Added
- Initial release of FuzzyFindJS
- Multi-language support (German, English, Spanish, French)
- Phonetic matching with Kölner Phonetik for German
- Compound word splitting for German
- Synonym support (built-in + custom)
- 8 fuzzy matching features:
  - Phonetic matching
  - Compound word splitting
  - Synonym matching
  - Keyboard neighbor typos
  - Partial word matching
  - Missing letter tolerance
  - Extra letter tolerance
  - Character transposition
- Three performance modes (fast, balanced, comprehensive)
- Configurable scoring and thresholds
- N-gram based partial matching
- Levenshtein distance with early termination
- Full TypeScript support with type definitions
- Zero dependencies
- Interactive demo dashboard
- Comprehensive documentation and examples

### Features
- `buildFuzzyIndex()` - Build searchable index from word array
- `getSuggestions()` - Search index with fuzzy matching
- `createFuzzySearch()` - Convenience function for quick setup
- Language processors for German, English, Spanish, French
- Extensible architecture for custom language processors
- Performance-optimized algorithms
- ESM and CommonJS builds
- TypeScript declaration files

### Documentation
- Complete API documentation
- 10+ usage examples (frontend, backend, React, Node.js)
- Performance tips and benchmarks
- Algorithm details and explanations
- Interactive demo dashboard with 5 mock dictionaries

[1.0.0]: https://github.com/LucaIsMyName/fuzzyfindjs/releases/tag/v1.0.0
