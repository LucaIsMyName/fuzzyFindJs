# FQL - Fuzzy Query Language

**Version:** 1.0.0  
**Status:** Beta

---

## 📖 Overview

FQL (Fuzzy Query Language) is a powerful, SQL-like query language designed specifically for advanced fuzzy search operations in FuzzyFindJS. It provides a rich set of logical operators, filters, field selectors, and scoring mechanisms to build complex, precise search queries with human-readable syntax.

### Key Features

- 🔍 **Logical Operators** - AND, OR, NOT for complex boolean logic with proper precedence
- 🎯 **Match Type Filters** - EXACT, FUZZY, PHONETIC, PREFIX, REGEX, COMPOUND for precise matching control
- 📊 **Field Selectors** - Search specific fields in multi-field data with weighted scoring
- ⚖️ **Score Filters** - Filter by match confidence with customizable thresholds
- 🌍 **Language Filters** - Search in specific languages with auto-detection fallback
- 🔒 **Type-Safe** - Full TypeScript support with comprehensive error handling
- ⚡ **High Performance** - Optimized execution with caching and early termination
- 🎯 **Opt-In Security** - Requires explicit activation, regex support controlled
- 📝 **Human Readable** - Intuitive syntax that's easy to write and understand

---

## 🚀 Quick Start

```typescript
import { buildFuzzyIndex, getSuggestions } from 'fuzzyfindjs';

// Create an index with multi-field data
const medicalStaff = [
  'Dr. Müller - Cardiologist - Berlin',
  'Dr. Schmidt - Neurologist - Munich', 
  'Nurse Johnson - Emergency - Hamburg',
  'Dr. Weber - Pediatrician - Berlin'
];

const index = buildFuzzyIndex(medicalStaff);

// Enable FQL and search for doctors in Berlin
const results = getSuggestions(
  index,
  'fql((doctor OR dr) AND berlin NOT nurse)',
  10,
  { enableFQL: true }
);
// Returns: ['Dr. Müller - Cardiologist - Berlin', 'Dr. Weber - Pediatrician - Berlin']
```

### Basic vs FQL Search

**Regular Search:**
```typescript
// Simple fuzzy search
getSuggestions(index, 'müller', 5);
// Returns anything similar to "müller"
```

**FQL Search:**
```typescript
// Precise boolean logic
getSuggestions(index, 'fql(müller AND berlin)', 5, { enableFQL: true });
// Returns only items containing both "müller" AND "berlin"
```

---

## 📝 Syntax Reference

### Syntax Overview

FQL queries use a simple, expressive syntax:

```typescript
// Basic structure
fql(expression)

// With operators
fql(term1 AND term2 OR term3 NOT term4)

// With field selectors
fql(field:value AND other_field:anothervalue)

// With match type filters
fql(EXACT:term OR FUZZY:term OR PHONETIC:term)

// With score filters
fql(term SCORE>0.8)

// Complex example
fql((title:FUZZY:javascript OR description:react) AND (city:berlin OR city:munich) NOT remote SCORE>0.7)
```

### Operators

#### **AND Operator**
All terms must match (intersection) - highest precedence after NOT

```typescript
fql(term1 AND term2)
fql(müller AND berlin)
fql(doctor AND berlin AND specialist)

// With field selectors
fql(name:müller AND city:berlin)

// Complex grouping
fql((doctor OR dr) AND (berlin OR munich) AND NOT dentist)
```

**Use Cases:**
- Find products that match multiple criteria
- Search for people with specific skills and location
- Filter results that must contain all required keywords

#### **OR Operator**
Any term can match (union) - lowest precedence

```typescript
fql(term1 OR term2)
fql(müller OR schmidt)
fql(doctor OR physician OR medic)

// With field selectors
fql(city:berlin OR city:munich)

// Complex alternatives
fql((javascript OR typescript) AND (react OR vue OR angular))
```

**Use Cases:**
- Find similar items with different names
- Search for alternative spellings
- Combine synonyms or related terms

#### **NOT Operator**
Exclude terms (exclusion) - highest precedence

```typescript
fql(NOT term)
fql(doctor NOT dentist)
fql(müller NOT berlin)

// Complex exclusions
fql((developer OR programmer) NOT intern NOT junior)

// Field-specific exclusion
fql(role:developer NOT team:backend)
```

**Use Cases:**
- Exclude irrelevant results
- Filter out unwanted categories
- Refine broad searches

#### **Grouping with Parentheses**
Control operator precedence and build complex expressions

```typescript
fql((müller OR schmidt) AND berlin)
fql(doctor AND (berlin OR munich) NOT dentist)
fql((term1 OR term2) AND (term3 OR term4))

// Nested grouping
fql(((frontend OR ui) AND (react OR vue)) NOT mobile)

// Complex real-world example
fql(
  (title:FUZZY:senior OR title:lead) AND 
  (javascript OR typescript) AND 
  (react OR vue OR angular) AND 
  NOT junior NOT intern
)
```

**Operator Precedence:** NOT > AND > OR

**Best Practices:**
- Use parentheses even when not strictly required for clarity
- Group related terms together
- Build complex queries step by step

---

### Match Type Filters

#### **EXACT** - Exact matches only (highest precision)
```typescript
fql(EXACT:müller)
fql(EXACT:"New York")

// Field-specific exact matches
fql(name:EXACT:"John Smith")

// Combine with other operators
fql(EXACT:"senior developer" AND (remote OR hybrid))
```

**Performance:** Fastest match type, use for precise lookups

**Use Cases:**
- Exact product codes or IDs
- Specific names or titles
- Precise technical terms

#### **FUZZY** - Fuzzy matches (typo-tolerant)
```typescript
fql(FUZZY:muller)  // Matches "Müller", "Miller", "Möller"
fql(FUZZY:docter)  // Matches "doctor", "doktor"

// Field-specific fuzzy matching
fql(name:FUZZY:jonson)  // Matches "Johnson", "Jonsson"

// Combine with score filtering for quality control
fql(FUZZY:javascript SCORE>0.8)
```

**Algorithm:** Uses Levenshtein/Damerau-Levenshtein distance based on configuration

**Use Cases:**
- User input with potential typos
- OCR text with errors
- International name variations

#### **PHONETIC** - Phonetic matches (sounds-like)
```typescript
fql(PHONETIC:shule)   // Matches "Schule", "Schulz"
fql(PHONETIC:smyth)   // Matches "Smith", "Smyth"
fql(PHONETIC:muller)  // Matches "Müller", "Miller"

// Language-specific phonetic matching
fql(LANG:german PHONETIC:shule)  // German phonetic algorithm

// Field-specific phonetic search
fql(name:PHONETIC:muller AND city:EXACT:berlin)
```

**Algorithms:**
- German: Kölner Phonetik
- English/French/Spanish: Soundex-like algorithms

**Use Cases:**
- Name search with spelling variations
- Transliterated text
- Audio transcription search

#### **PREFIX** - Prefix matches (autocomplete)
```typescript
fql(PREFIX:doc)       // Matches "doctor", "document", "documentation"
fql(PREFIX:ber)       // Matches "Berlin", "Bernard", "Berg"

// Field-specific prefix matching
fql(name:PREFIX:dev)  // Matches "developer", "development", "device"

// Combine with other filters
fql(PREFIX:sen AND (developer OR engineer))
```

**Performance:** Very fast, ideal for autocomplete UI

**Use Cases:**

* Autocomplete components
* Progressive search
* Command completion

#### **REGEX** - Regular expression patterns (requires opt-in)
```typescript
fql(REGEX:^Dr\..*Smith$)     // Doctors with Smith as last name
fql(REGEX:.*müller.*i)       // Case-insensitive Müller anywhere
fql(REGEX:^\d{4}-\d{2}-\d{2}$) // Date format YYYY-MM-DD

// Field-specific regex
fql(email:REGEX:.*@gmail\.com$)  // Gmail addresses only

// Complex pattern matching
fql(REGEX:^(senior|lead|principal).*(developer|engineer))
```

**⚠️ Security Note:** Regex requires `fqlOptions.allowRegex: true` due to potential ReDoS attacks

**Performance:** Varies by pattern complexity, use simple patterns when possible

**Use Cases:**

* Structured data validation
* Complex pattern matching
* Format-specific searches

#### **COMPOUND** - Compound word matches (German optimized)
```typescript
fql(COMPOUND:kranken)     // Matches "Krankenhaus", "Krankenschwester"
fql(COMPOUND:haus)        // Matches "Krankenhaus", "Rathaus", "Bahnhaus"
fql(COMPOUND:lehr)        // Matches "Lehrer", "Lehrerin", "Lehrbuch"

// Field-specific compound matching
fql(title:COMPOUND:lehr AND type:EXACT:school)

// Combine with language filter
fql(LANG:german COMPOUND:kranken)
```

**Algorithm:** German compound word decomposition with linguistic rules

**Use Cases:**
- German compound word search
- Partial word matching in compound languages
- Morphological word decomposition

---

### Field Selectors

Search specific fields in multi-field data with weighted scoring:

```typescript
// Basic field selection
fql(field:value)
fql(name:müller)
fql(city:berlin AND name:schmidt)

// Complex field queries
fql(title:"senior developer" OR description:python)

// Field-specific match types
fql(name:FUZZY:muller)
fql(city:EXACT:berlin)
fql(role:PREFIX:dev)

// Multiple field conditions
fql(
  name:FUZZY:john AND 
  city:EXACT:berlin AND 
  role:(developer OR engineer) AND 
  NOT department:hr
)
```

#### Multi-Field Index Setup

```typescript
// Create index with multiple fields
const employees = [
  { name: 'Müller', city: 'Berlin', role: 'Developer', department: 'Engineering' },
  { name: 'Schmidt', city: 'Munich', role: 'Designer', department: 'Design' },
  { name: 'Weber', city: 'Berlin', role: 'Developer', department: 'Engineering' }
];

const index = buildFuzzyIndex(employees, {
  fields: ['name', 'city', 'role', 'department'],
  fieldWeights: {
    name: 2.0,        // Name matches weighted 2x
    role: 1.5,        // Role matches weighted 1.5x
    city: 1.0,        // City normal weight
    department: 0.8   // Department lower weight
  }
});

// Search with field selectors
const results = getSuggestions(
  index,
  'fql(city:berlin AND role:developer)',
  10,
  { enableFQL: true }
);
```

**Field Weighting:** Matches in higher-weighted fields receive better scores

---

### Score Filters

Filter by match confidence (0.0 - 1.0) for quality control:

```typescript
// Basic score filtering
fql(term SCORE>0.8)
fql(term SCORE>=0.7)
fql(term SCORE<0.5)
fql(term SCORE<=0.9)

// Score ranges with AND/OR
fql(term SCORE>0.7 AND term SCORE<0.9)

// Combine with other operators
fql((doctor OR physician) SCORE>0.7)
fql(FUZZY:muller SCORE>=0.8)

// Complex quality filtering
fql(
  (title:FUZZY:senior OR role:lead) AND 
  (javascript OR typescript) AND 
  SCORE>0.8
)

// Field-specific score filtering
fql(name:FUZZY:john SCORE>0.9 AND city:berlin)
```

#### Score Threshold Strategies

```typescript
// High precision (only exact or very close matches)
fql(term SCORE>0.95)

// Balanced (good matches with some flexibility)
fql(term SCORE>0.75)

// Inclusive (broad search with quality floor)
fql(term SCORE>0.6)

// Fuzzy-only with quality control
fql(FUZZY:term SCORE>0.8)
```

**Performance Impact:** Score filtering reduces result sets early, improving performance

---

### Language Filters

Search in specific languages with auto-detection fallback:

```typescript
// Language-specific search
fql(LANG:german müller)
fql(LANG:french café)
fql(LANG:spanish niño)

// Combine with other filters
fql(LANG:german PHONETIC:shule SCORE>0.8)

// Multi-language queries
fql((LANG:german krankenhaus) OR (LANG:french hôpital))

// Language with field selectors
fql(LANG:english name:john AND city:berlin)

// Complex multi-language example
fql(
  (LANG:german (arzt OR krankenhaus)) OR 
  (LANG:english (doctor OR hospital)) OR 
  (LANG:french (médecin OR hôpital))
) AND NOT emergency
```

#### Supported Languages

- **LANG:german** - German with Kölner Phonetik and compound word support
- **LANG:english** - English with Soundex-like phonetic matching
- **LANG:french** - French with accent handling and phonetic matching
- **LANG:spanish** - Spanish with accent normalization

#### Auto-Detection

```typescript
// Without language filter - uses auto-detection
fql(hospital)  // Searches all enabled languages

// Explicit language override
fql(LANG:german hospital)  // Forces German processing
```

---

## 💡 Real-World Examples

### Example 1: Medical Staff Search

Find doctors in specific cities with specialties:

```typescript
const medicalStaff = [
  'Dr. Müller - Cardiologist - Berlin - Charité',
  'Dr. Schmidt - Neurologist - Munich - Klinikum',
  'Dr. Weber - Pediatrician - Berlin - Vivantes',
  'Nurse Johnson - Emergency - Hamburg - UKE',
  'Dr. Fischer - Surgeon - Berlin - Charité'
];

const index = buildFuzzyIndex(medicalStaff, {
  config: { languages: ['german', 'english'] }
});

// Find cardiologists in Berlin (excluding other specialties)
const results = getSuggestions(
  index,
  'fql((dr OR doctor) AND berlin AND (cardiologist OR herz) NOT (neurologist OR surgeon))',
  10,
  { enableFQL: true }
);
// Returns: ['Dr. Müller - Cardiologist - Berlin - Charité']
```

### Example 2: E-Commerce Product Search

Multi-field product search with price and category filters:

```typescript
const products = [
  { name: 'iPhone 15 Pro', brand: 'Apple', price: 999, category: 'Phones' },
  { name: 'Galaxy S24', brand: 'Samsung', price: 899, category: 'Phones' },
  { name: 'MacBook Pro', brand: 'Apple', price: 1999, category: 'Laptops' },
  { name: 'ThinkPad X1', brand: 'Lenovo', price: 1899, category: 'Laptops' }
];

const index = buildFuzzyIndex(products, {
  fields: ['name', 'brand', 'category'],
  fieldWeights: { name: 2.0, brand: 1.5, category: 1.0 }
});

// Find Apple products under $1500
const results = getSuggestions(
  index,
  'fql(brand:EXACT:apple AND category:(laptops OR phones) NOT pro)',
  10,
  { 
    enableFQL: true,
    filters: {
      ranges: [{ field: 'price', max: 1500 }]
    }
  }
);
```

### Example 3: Job Search with Skills and Location

Complex job search with skill matching and location preferences:

```typescript
const jobPostings = [
  { title: 'Senior Frontend Developer', company: 'TechCorp', city: 'Berlin', skills: 'React, TypeScript, Node.js', remote: true },
  { title: 'Full Stack Engineer', company: 'StartupXYZ', city: 'Munich', skills: 'Vue, Python, PostgreSQL', remote: false },
  { title: 'Lead JavaScript Developer', company: 'WebAgency', city: 'Berlin', skills: 'JavaScript, React, GraphQL', remote: true }
];

const index = buildFuzzyIndex(jobPostings, {
  fields: ['title', 'skills', 'city'],
  fieldWeights: { title: 2.0, skills: 1.5, city: 1.0 }
});

// Find senior developer roles in Berlin with React experience
const results = getSuggestions(
  index,
  'fql((title:FUZZY:senior OR title:lead) AND city:EXACT:berlin AND skills:(react OR vue OR angular) AND remote:true SCORE>0.7)',
  10,
  { enableFQL: true }
);
```

### Example 4: Academic Paper Search

Search academic papers with authors, topics, and publication year:

```typescript
const papers = [
  { title: 'Machine Learning in Healthcare', authors: 'Müller, Schmidt', year: 2023, field: 'AI' },
  { title: 'Deep Learning for Medical Diagnosis', authors: 'Weber, Johnson', year: 2022, field: 'AI' },
  { title: 'Fuzzy Logic in Expert Systems', authors: 'Fischer, Müller', year: 2021, field: 'Logic' }
];

const index = buildFuzzyIndex(papers, {
  fields: ['title', 'authors', 'field'],
  fieldWeights: { title: 2.0, authors: 1.5, field: 1.0 }
});

// Find AI papers by Müller in recent years
const results = getSuggestions(
  index,
  'fql(authors:FUZZY:muller AND field:EXACT:ai AND (title:learning OR title:neural))',
  10,
  { 
    enableFQL: true,
    filters: {
      ranges: [{ field: 'year', min: 2020 }]
    }
  }
);
```

### Example 5: Customer Support Search

Search support tickets with status, priority, and content:

```typescript
const tickets = [
  { id: 'TICKET-001', subject: 'Login Issues', customer: 'John Doe', status: 'open', priority: 'high', content: 'Cannot login to account' },
  { id: 'TICKET-002', subject: 'Payment Failed', customer: 'Jane Smith', status: 'closed', priority: 'urgent', content: 'Credit card payment declined' },
  { id: 'TICKET-003', subject: 'Feature Request', customer: 'Bob Johnson', status: 'open', priority: 'medium', content: 'Add dark mode to dashboard' }
];

const index = buildFuzzyIndex(tickets, {
  fields: ['subject', 'customer', 'content'],
  fieldWeights: { subject: 2.0, content: 1.5, customer: 1.0 }
});

// Find high-priority open tickets about login/payment issues
const results = getSuggestions(
  index,
  'fql((subject:FUZZY:login OR subject:payment OR content:login) AND status:EXACT:open AND priority:EXACT:high SCORE>0.8)',
  10,
  { enableFQL: true }
);
```

---

## ⚙️ Configuration

### Enable FQL

FQL is **opt-in** and must be explicitly enabled for security:

```typescript
const results = getSuggestions(
  index,
  'fql(query)',
  10,
  { 
    enableFQL: true,  // Required!
    fqlOptions: {
      /** Allow regex patterns (default: false) */
      allowRegex?: boolean;
      
      /** Timeout for query execution in ms (default: 5000) */
      timeout?: number;
      
      /** Maximum query length to prevent abuse (default: 1000) */
      maxQueryLength?: number;
    };
  }
);
```

**Complete Configuration Example:**
```typescript
const results = getSuggestions(
  index,
  'fql(REGEX:^Dr\\..* AND (berlin OR munich))',
  10,
  { 
    enableFQL: true,
    fqlOptions: {
      allowRegex: true,      // Enable regex patterns
      timeout: 10000,        // 10 second timeout
      maxQueryLength: 500    // Limit query length
    }
  }
);
```

### Security Considerations

```typescript
// ❌ Unsafe - allows arbitrary regex
class UnsafeSearchComponent {
  search(query: string) {
    return getSuggestions(index, `fql(${query})`, 10, {
      enableFQL: true,
      fqlOptions: { allowRegex: true }
    });
  }
}

// ✅ Safe - validates and sanitizes input
class SafeSearchComponent {
  private readonly ALLOWED_PATTERNS = /^[a-zA-Z0-9\s\-\(\)]+$/;
  
  search(query: string) {
    // Validate query format
    if (!this.ALLOWED_PATTERNS.test(query)) {
      throw new Error('Invalid query format');
    }
    
    // Limit query length
    if (query.length > 200) {
      throw new Error('Query too long');
    }
    
    return getSuggestions(index, `fql(${query})`, 10, {
      enableFQL: true,
      fqlOptions: { 
        allowRegex: false,  // Keep regex disabled
        timeout: 5000       // Reasonable timeout
      }
    });
  }
}
```

---

## 🎯 Grammar Reference

```
expression     → or_expr
or_expr        → and_expr ( OR and_expr )*
and_expr       → not_expr ( AND not_expr )*
not_expr       → NOT? primary
primary        → filter | field | score | lang | term | phrase | grouped
grouped        → LPAREN expression RPAREN
filter         → (EXACT|FUZZY|PHONETIC|PREFIX|REGEX|COMPOUND) COLON value
field          → TERM COLON expression
score          → expression SCORE (>|<|>=|<=) NUMBER
lang           → LANG COLON TERM expression
term           → TERM
phrase         → QUOTED_STRING
```

### Token Definitions

- **TERM**: Alphanumeric characters and spaces (no quotes)
- **QUOTED_STRING**: Text wrapped in double quotes, supports spaces
- **NUMBER**: Floating-point number for score comparisons
- **LPAREN/RPAREN**: ( and ) for grouping
- **COLON**: : for field and filter separation
- **OPERATORS**: AND, OR, NOT for boolean logic
- **COMPARISON**: >, <, >=, <= for score filtering

### Parsing Examples

```
# Simple term
doctor

# Phrase with spaces
"senior developer"

# Field selector
name:müller

# Filter with field
name:FUZZY:muller

# Score comparison
term SCORE>0.8

# Language filter
LANG:german term

# Grouped expression
(term1 OR term2) AND term3

# Complex nested
((field:FUZZY:value1 OR field:value2) AND score:term SCORE>0.7) NOT excluded
```

---

## 🔒 Security & Best Practices

### 1. Input Validation

Always validate user input before passing to FQL:

```typescript
function validateFQLQuery(query: string): string {
  // Remove potentially dangerous characters
  const sanitized = query.replace(/[<>]/g, '');
  
  // Check for reasonable length
  if (sanitized.length > 500) {
    throw new Error('Query too long');
  }
  
  // Validate basic syntax
  if (!sanitized.startsWith('fql(') || !sanitized.endsWith(')')) {
    throw new Error('Invalid FQL syntax');
  }
  
  return sanitized.trim();
}

// Usage
const safeQuery = validateFQLQuery(userInput);
const results = getSuggestions(index, safeQuery, 10, { enableFQL: true });
```

### 2. Regex Safety

Regex patterns can cause ReDoS (Regular Expression Denial of Service) attacks:

```typescript
// ❌ Dangerous - allows complex regex
const dangerousConfig = {
  enableFQL: true,
  fqlOptions: { allowRegex: true }
};

// ✅ Safe - regex disabled by default
const safeConfig = {
  enableFQL: true,
  fqlOptions: { allowRegex: false }  // Default
};

// ✅ Controlled - enable regex with validation
function enableRegexSafely(query: string): boolean {
  // Only allow simple, safe patterns
  const safePatterns = /^[a-zA-Z0-9\s\*\?\-]+$/;
  return safePatterns.test(query);
}
```

### 3. Query Timeout

Prevent long-running queries with timeout:

```typescript
const results = getSuggestions(
  index,
  complexUserQuery,
  10,
  {
    enableFQL: true,
    fqlOptions: {
      timeout: 3000  // 3 second limit
    }
  }
);
```

### 4. Rate Limiting

Implement rate limiting for FQL endpoints:

```typescript
class FQLSearchService {
  private queryCount = 0;
  private lastReset = Date.now();
  private readonly RATE_LIMIT = 100; // queries per minute
  
  async search(query: string) {
    this.checkRateLimit();
    
    return getSuggestions(index, query, 10, {
      enableFQL: true,
      fqlOptions: { timeout: 5000 }
    });
  }
  
  private checkRateLimit() {
    const now = Date.now();
    if (now - this.lastReset > 60000) {
      this.queryCount = 0;
      this.lastReset = now;
    }
    
    if (this.queryCount >= this.RATE_LIMIT) {
      throw new Error('Rate limit exceeded');
    }
    
    this.queryCount++;
  }
}
```

### 5. Error Handling

Handle FQL errors gracefully with proper error types:

```typescript
import { FQLSyntaxError, FQLTimeoutError } from 'fuzzyfindjs';

class FQLSearchComponent {
  async search(query: string): Promise<SuggestionResult[]> {
    try {
      const results = getSuggestions(index, query, 10, { 
        enableFQL: true,
        fqlOptions: { timeout: 5000 }
      });
      return results;
    } catch (error) {
      if (error instanceof FQLSyntaxError) {
        console.error('Syntax error:', error.message);
        console.error('At position:', error.position);
        // Show user-friendly error
        return [];
      } else if (error instanceof FQLTimeoutError) {
        console.error('Query timeout');
        // Try with simpler query or fallback
        return this.fallbackSearch(query);
      } else if (error instanceof Error) {
        console.error('FQL execution error:', error.message);
        return [];
      }
      throw error;
    }
  }
  
  private fallbackSearch(query: string): SuggestionResult[] {
    // Extract simple terms from failed FQL query
    const simpleQuery = query.replace(/fql\(|\)|AND|OR|NOT/g, '').trim();
    return getSuggestions(index, simpleQuery, 10);
  }
}
```

---

## 📊 Performance

### Query Complexity

- **Simple queries** (1-2 terms): <1ms
- **Medium queries** (3-5 terms, 1-2 operators): 1-5ms
- **Complex queries** (5+ terms, multiple operators): 5-20ms
- **Regex queries**: 10-100ms (depends on pattern)

### Optimization Tips

1. **Use specific filters** - `EXACT:term` is faster than `FUZZY:term`
2. **Limit OR branches** - Too many OR terms slow down search
3. **Use field selectors** - Narrow search scope early
4. **Avoid complex regex** - Simple patterns are faster
5. **Apply score filters** - Reduce result set size

---

## 🐛 Error Messages

### Syntax Errors

```typescript
// Missing closing parenthesis
fql((term1 AND term2)
// → Error: Expected ')' at position 20

// Invalid operator
fql(term1 XOR term2)
// → Error: Unknown operator 'XOR' at position 6

// Unclosed quote
fql("term1)
// → Error: Unclosed quote at position 4
```

### Runtime Errors

```typescript
// Regex not enabled
fql(REGEX:pattern)
// → Error: Regex not enabled. Set fqlOptions.allowRegex = true

// Query timeout
fql(very complex query...)
// → Error: Query execution timeout after 5000ms

// Invalid field
fql(nonexistent:value)
// → Error: Field 'nonexistent' not found in index
```

---

## 🔄 Migration Guide

### From Regular Search to FQL

**Before:**
```typescript
getSuggestions(index, 'müller', 10);
```

**After:**
```typescript
getSuggestions(index, 'fql(müller)', 10, { enableFQL: true });
```

### From Phrase Search to FQL

**Before:**
```typescript
getSuggestions(index, '"new york"', 10);
```

**After:**
```typescript
getSuggestions(index, 'fql(EXACT:"new york")', 10, { enableFQL: true });
```

### Combining Features

You can still use regular search when FQL is enabled:

```typescript
// Regular search (no fql() wrapper)
getSuggestions(index, 'müller', 10, { enableFQL: true });

// FQL search (with fql() wrapper)
getSuggestions(index, 'fql(müller AND berlin)', 10, { enableFQL: true });
```

---

## 📚 Advanced Topics

### Custom Filters

You can combine filters for powerful queries:

```typescript
// Fuzzy match with high confidence in specific field
fql(name:FUZZY:muller SCORE>0.9)

// Phonetic match in German language
fql(LANG:german PHONETIC:shule)

// Prefix match excluding certain terms
fql(PREFIX:doc NOT document)
```

### Query Composition

Build queries programmatically:

```typescript
function buildDoctorQuery(city: string, specialty?: string): string {
  let query = 'fql(doctor AND ' + city;
  if (specialty) {
    query += ' AND ' + specialty;
  }
  query += ')';
  return query;
}

const results = getSuggestions(
  index,
  buildDoctorQuery('berlin', 'cardiologist'),
  10,
  { enableFQL: true }
);
```

---

## 🎓 Learning Path

1. **Start Simple** - Use basic AND, OR, NOT operators
2. **Add Filters** - Try EXACT, FUZZY, PREFIX filters
3. **Use Fields** - Search specific fields in your data
4. **Score Filtering** - Refine results by confidence
5. **Complex Queries** - Combine everything with grouping

---

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue!

---

## 📄 License

MIT License - Same as FuzzyFindJS

---

**Happy Querying!** 🚀
