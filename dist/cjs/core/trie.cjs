"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
class Trie {
  root;
  size;
  constructor() {
    this.root = this.createNode();
    this.size = 0;
  }
  createNode() {
    return {
      children: /* @__PURE__ */ new Map(),
      isEndOfWord: false,
      docIds: /* @__PURE__ */ new Set()
    };
  }
  /**
   * Insert a term with associated document IDs
   */
  insert(term, docIds) {
    if (!term) return;
    let node = this.root;
    for (const char of term) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char);
    }
    node.isEndOfWord = true;
    node.term = term;
    docIds.forEach((id) => node.docIds.add(id));
    this.size++;
  }
  /**
   * Find all terms that start with the given prefix
   * Returns array of [term, docIds[]] tuples
   */
  findWithPrefix(prefix) {
    if (!prefix) return [];
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char);
    }
    const results = [];
    this.collectTerms(node, results);
    return results;
  }
  /**
   * Check if exact term exists
   */
  has(term) {
    let node = this.root;
    for (const char of term) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char);
    }
    return node.isEndOfWord;
  }
  /**
   * Get document IDs for exact term
   */
  get(term) {
    let node = this.root;
    for (const char of term) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char);
    }
    return node.isEndOfWord ? Array.from(node.docIds) : null;
  }
  /**
   * Recursively collect all terms from a node
   */
  collectTerms(node, results) {
    if (node.isEndOfWord && node.term) {
      results.push([node.term, Array.from(node.docIds)]);
    }
    for (const child of node.children.values()) {
      this.collectTerms(child, results);
    }
  }
  /**
   * Get the number of terms in the trie
   */
  getSize() {
    return this.size;
  }
  /**
   * Clear the trie
   */
  clear() {
    this.root = this.createNode();
    this.size = 0;
  }
  /**
   * Serialize trie to JSON-compatible format
   */
  toJSON() {
    return {
      root: this.serializeNode(this.root),
      size: this.size
    };
  }
  /**
   * Deserialize trie from JSON
   */
  static fromJSON(data) {
    const trie = new Trie();
    trie.root = Trie.deserializeNode(data.root);
    trie.size = data.size;
    return trie;
  }
  serializeNode(node) {
    return {
      children: Array.from(node.children.entries()).map(([char, child]) => [
        char,
        this.serializeNode(child)
      ]),
      isEndOfWord: node.isEndOfWord,
      docIds: Array.from(node.docIds),
      term: node.term
    };
  }
  static deserializeNode(data) {
    const node = {
      children: /* @__PURE__ */ new Map(),
      isEndOfWord: data.isEndOfWord,
      docIds: new Set(data.docIds),
      term: data.term
    };
    for (const [char, childData] of data.children) {
      node.children.set(char, Trie.deserializeNode(childData));
    }
    return node;
  }
}
exports.Trie = Trie;
//# sourceMappingURL=trie.cjs.map
