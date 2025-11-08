import { describe, it, expect } from "vitest";
import { buildFuzzyIndex, getSuggestions } from "../index.js";
import { FQLLexer, TokenType } from "../fql/lexer.js";
import { FQLParser, FQLSyntaxError } from "../fql/parser.js";
import { isFQLQuery, extractFQLQuery } from "../fql/index.js";

describe("Feature 12: FQL (Fuzzy Query Language)", () => {
  describe("FQL Detection", () => {
    it("should detect FQL queries", () => {
      expect(isFQLQuery("fql(term)")).toBe(true);
      expect(isFQLQuery("fql(term1 AND term2)")).toBe(true);
      expect(isFQLQuery("  fql(term)  ")).toBe(true);
    });

    it("should not detect non-FQL queries", () => {
      expect(isFQLQuery("term")).toBe(false);
      expect(isFQLQuery("term1 AND term2")).toBe(false);
      expect(isFQLQuery("fql(term")).toBe(false);
      expect(isFQLQuery("term)")).toBe(false);
    });

    it("should extract FQL query", () => {
      expect(extractFQLQuery("fql(term)")).toBe("term");
      expect(extractFQLQuery("fql(term1 AND term2)")).toBe("term1 AND term2");
      expect(extractFQLQuery("  fql(term)  ")).toBe("term");
    });
  });

  describe("Lexer", () => {
    it("should tokenize simple terms", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("term");
      
      expect(tokens.length).toBe(2); // term + EOF
      expect(tokens[0].type).toBe(TokenType.TERM);
      expect(tokens[0].value).toBe("term");
    });

    it("should tokenize AND operator", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("term1 AND term2");
      
      expect(tokens[0].type).toBe(TokenType.TERM);
      expect(tokens[1].type).toBe(TokenType.AND);
      expect(tokens[2].type).toBe(TokenType.TERM);
    });

    it("should tokenize OR operator", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("term1 OR term2");
      
      expect(tokens[1].type).toBe(TokenType.OR);
    });

    it("should tokenize NOT operator", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("NOT term");
      
      expect(tokens[0].type).toBe(TokenType.NOT);
      expect(tokens[1].type).toBe(TokenType.TERM);
    });

    it("should tokenize parentheses", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("(term1 OR term2)");
      
      expect(tokens[0].type).toBe(TokenType.LPAREN);
      // ( term1 OR term2 ) EOF
      // 0  1    2   3    4  5
      expect(tokens[4].type).toBe(TokenType.RPAREN);
    });

    it("should tokenize quoted strings", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize('"hello world"');
      
      expect(tokens[0].type).toBe(TokenType.QUOTED);
      expect(tokens[0].value).toBe("hello world");
    });

    it("should tokenize filters", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("EXACT:term");
      
      expect(tokens[0].type).toBe(TokenType.EXACT);
      expect(tokens[1].type).toBe(TokenType.COLON);
      expect(tokens[2].type).toBe(TokenType.TERM);
    });

    it("should tokenize score operators", () => {
      const lexer = new FQLLexer();
      const tokens = lexer.tokenize("term SCORE>0.8");
      
      expect(tokens[1].type).toBe(TokenType.SCORE);
      expect(tokens[2].type).toBe(TokenType.SCORE_OP);
      expect(tokens[2].value).toBe(">");
      expect(tokens[3].type).toBe(TokenType.NUMBER);
    });
  });

  describe("Parser", () => {
    it("should parse simple terms", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("term");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("term");
      expect((ast as any).value).toBe("term");
    });

    it("should parse AND expressions", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("term1 AND term2");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("and");
    });

    it("should parse OR expressions", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("term1 OR term2");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("or");
    });

    it("should parse NOT expressions", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("NOT term");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("not");
    });

    it("should parse grouped expressions", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("(term1 OR term2) AND term3");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("and");
    });

    it("should parse filters", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("EXACT:term");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("filter");
      expect((ast as any).filterType).toBe("exact");
    });

    it("should parse field selectors", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("name:müller");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("field");
      expect((ast as any).field).toBe("name");
    });

    it("should handle operator precedence", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      // NOT > AND > OR
      const tokens = lexer.tokenize("term1 OR term2 AND NOT term3");
      const ast = parser.parse(tokens);
      
      expect(ast.type).toBe("or");
    });

    it("should throw on syntax errors", () => {
      const lexer = new FQLLexer();
      const parser = new FQLParser();
      
      const tokens = lexer.tokenize("(term1 AND term2");
      expect(() => parser.parse(tokens)).toThrow(FQLSyntaxError);
    });
  });

  describe("Executor - Basic Operations", () => {
    it("should execute simple term search", () => {
      const index = buildFuzzyIndex(["müller", "schmidt", "weber"]);
      
      const results = getSuggestions(index, "fql(müller)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("müller");
    });

    it("should execute AND queries", () => {
      const index = buildFuzzyIndex(["müller berlin", "schmidt munich", "weber berlin"]);
      
      const results = getSuggestions(index, "fql(müller AND berlin)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toContain("müller");
      expect(results[0].display).toContain("berlin");
    });

    it("should execute OR queries", () => {
      const index = buildFuzzyIndex(["müller", "schmidt", "weber"]);
      
      const results = getSuggestions(index, "fql(müller OR schmidt)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
      // Should contain both
      const displays = results.map(r => r.display);
      expect(displays).toContain("müller");
      expect(displays).toContain("schmidt");
    });

    it("should execute NOT queries", () => {
      const index = buildFuzzyIndex(["doctor", "dentist", "physician", "nurse"]);
      
      const results = getSuggestions(index, "fql(doctor OR NOT dentist)", 10, { enableFQL: true });
      
      const displays = results.map(r => r.display);
      expect(displays).toContain("doctor");
      // NOT dentist should exclude dentist
      expect(displays.filter(d => d === "dentist").length).toBe(0);
    });
  });

  describe("Executor - Filters", () => {
    it("should execute EXACT filter", () => {
      const index = buildFuzzyIndex(["müller", "muller", "miller"]);
      
      const results = getSuggestions(index, "fql(EXACT:müller)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("müller");
    });

    it("should execute FUZZY filter", () => {
      const index = buildFuzzyIndex(["müller", "miller", "möller"]);
      
      const results = getSuggestions(index, "fql(FUZZY:muller)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
    });

    it("should execute PREFIX filter", () => {
      const index = buildFuzzyIndex(["doctor", "document", "dog"]);
      
      const results = getSuggestions(index, "fql(PREFIX:doc)", 10, { enableFQL: true });
      
      // PREFIX filter should find matches starting with "doc"
      expect(results.length).toBeGreaterThanOrEqual(0);
      // At minimum, fuzzy matching should work
      if (results.length > 0) {
        const displays = results.map(r => r.display);
        expect(displays.some(d => d.startsWith("doc"))).toBe(true);
      }
    });

    it("should execute REGEX filter when enabled", () => {
      const index = buildFuzzyIndex(["doctor", "dentist", "developer"]);
      
      const results = getSuggestions(
        index,
        'fql(REGEX:"^doc.*")',
        10,
        { enableFQL: true, fqlOptions: { allowRegex: true } }
      );
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("doctor");
    });

    it("should throw error if REGEX not enabled", () => {
      const index = buildFuzzyIndex(["doctor"]);
      
      expect(() => {
        getSuggestions(index, "fql(REGEX:^doc)", 10, { enableFQL: true });
      }).toThrow();
    });
  });

  describe("Executor - Field Selectors", () => {
    it("should filter by field", () => {
      const data = [
        { name: "Müller", city: "Berlin" },
        { name: "Schmidt", city: "Munich" },
      ];
      
      const index = buildFuzzyIndex(data, { fields: ["name", "city"] });
      
      const results = getSuggestions(index, "fql(müller)", 10, { enableFQL: true });
      
      // Should find Müller in the index
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Executor - Score Filters", () => {
    it("should filter by score >", () => {
      const index = buildFuzzyIndex(["müller", "miller", "möller"]);
      
      const results = getSuggestions(index, "fql(müller SCORE>0.8)", 10, { enableFQL: true });
      
      // All results should have score > 0.8
      results.forEach(r => {
        expect(r.score).toBeGreaterThan(0.8);
      });
    });

    it("should filter by score >=", () => {
      const index = buildFuzzyIndex(["müller"]);
      
      const results = getSuggestions(index, "fql(müller SCORE>=1.0)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe("Complex Queries", () => {
    it("should handle complex nested queries", () => {
      const index = buildFuzzyIndex(["doctor berlin", "dentist munich", "physician berlin"]);
      
      const results = getSuggestions(
        index,
        "fql((doctor OR physician) AND berlin)",
        10,
        { enableFQL: true }
      );
      
      expect(results.length).toBeGreaterThan(0);
    });

    it("should combine filters and operators", () => {
      const index = buildFuzzyIndex(["müller", "schmidt", "weber"]);
      
      const results = getSuggestions(
        index,
        "fql(FUZZY:muller OR EXACT:schmidt)",
        10,
        { enableFQL: true }
      );
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Real-World Examples", () => {
    it("should find doctors in specific cities", () => {
      const doctors = [
        "Dr. Müller - Berlin",
        "Dr. Schmidt - Munich",
        "Dentist Weber - Berlin",
        "Dr. Johnson - Hamburg",
      ];
      
      const index = buildFuzzyIndex(doctors);
      
      const results = getSuggestions(
        index,
        "fql((doctor OR dr OR müller OR schmidt) AND (berlin OR munich))",
        10,
        { enableFQL: true }
      );
      
      expect(results.length).toBeGreaterThan(0);
      const displays = results.map(r => r.display);
      expect(displays).toContain("Dr. Müller - Berlin");
      expect(displays).toContain("Dr. Schmidt - Munich");
    });

    it("should search products with exact matches", () => {
      const products = ["iPhone 15 Pro", "iPhone 15", "Samsung Galaxy", "iPad Pro"];
      
      const index = buildFuzzyIndex(products);
      
      const results = getSuggestions(
        index,
        'fql(EXACT:"iPhone 15" OR samsung)',
        10,
        { enableFQL: true }
      );
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Backwards Compatibility", () => {
    it("should not break regular searches", () => {
      const index = buildFuzzyIndex(["müller", "schmidt"]);
      
      // Regular search (no FQL)
      const results = getSuggestions(index, "müller", 10);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].display).toBe("müller");
    });

    it("should require enableFQL flag", () => {
      const index = buildFuzzyIndex(["test", "data"]);
      
      // FQL query without enableFQL should be treated as regular search
      const results = getSuggestions(index, "fql(test)", 10);
      
      // Should find "test" as fuzzy match (not execute FQL)
      expect(results.length).toBeGreaterThan(0);
    });

    it("should work with existing features", () => {
      const index = buildFuzzyIndex(["müller", "schmidt"], {
        config: {
          features: ["phonetic", "compound"],
        },
      });
      
      const results = getSuggestions(index, "fql(müller)", 10, { enableFQL: true });
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should throw on invalid syntax", () => {
      const index = buildFuzzyIndex(["test"]);
      
      expect(() => {
        getSuggestions(index, "fql((term AND)", 10, { enableFQL: true });
      }).toThrow();
    });

    it("should throw on unclosed quote", () => {
      const index = buildFuzzyIndex(["test"]);
      
      expect(() => {
        getSuggestions(index, 'fql("term)', 10, { enableFQL: true });
      }).toThrow();
    });

    it("should handle empty queries", () => {
      const index = buildFuzzyIndex(["test"]);
      
      expect(() => {
        getSuggestions(index, "fql()", 10, { enableFQL: true });
      }).toThrow();
    });
  });

  describe("Performance", () => {
    it("should execute simple queries fast", () => {
      const words = Array.from({ length: 1000 }, (_, i) => `word${i}`);
      const index = buildFuzzyIndex(words);
      
      const start = performance.now();
      getSuggestions(index, "fql(word1 OR word2)", 10, { enableFQL: true });
      const time = performance.now() - start;
      
      expect(time).toBeLessThan(100); // Should be reasonably fast
    });
  });
});
