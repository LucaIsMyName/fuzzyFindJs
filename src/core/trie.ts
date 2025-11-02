/**
 * Trie (Prefix Tree) for fast prefix matching
 * Provides O(k) lookup where k is the query length, instead of O(n) where n is the number of terms
 */

export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  docIds: Set<number>;
  term?: string; // Store the full term at leaf nodes
}

export class Trie {
  private root: TrieNode;
  private size: number;

  constructor() {
    this.root = this.createNode();
    this.size = 0;
  }

  private createNode(): TrieNode {
    return {
      children: new Map(),
      isEndOfWord: false,
      docIds: new Set(),
    };
  }

  /**
   * Insert a term with associated document IDs
   */
  insert(term: string, docIds: number[]): void {
    if (!term) return;

    let node = this.root;

    for (const char of term) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.term = term;
    docIds.forEach(id => node.docIds.add(id));
    this.size++;
  }

  /**
   * Find all terms that start with the given prefix
   * Returns array of [term, docIds[]] tuples
   */
  findWithPrefix(prefix: string): Array<[string, number[]]> {
    if (!prefix) return [];

    // Navigate to the prefix node
    let node = this.root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return []; // Prefix not found
      }
      node = node.children.get(char)!;
    }

    // Collect all terms from this node downwards
    const results: Array<[string, number[]]> = [];
    this.collectTerms(node, results);
    return results;
  }

  /**
   * Check if exact term exists
   */
  has(term: string): boolean {
    let node = this.root;
    for (const char of term) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }

  /**
   * Get document IDs for exact term
   */
  get(term: string): number[] | null {
    let node = this.root;
    for (const char of term) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord ? Array.from(node.docIds) : null;
  }

  /**
   * Recursively collect all terms from a node
   */
  private collectTerms(node: TrieNode, results: Array<[string, number[]]>): void {
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
  getSize(): number {
    return this.size;
  }

  /**
   * Clear the trie
   */
  clear(): void {
    this.root = this.createNode();
    this.size = 0;
  }

  /**
   * Serialize trie to JSON-compatible format
   */
  toJSON(): any {
    return {
      root: this.serializeNode(this.root),
      size: this.size,
    };
  }

  /**
   * Deserialize trie from JSON
   */
  static fromJSON(data: any): Trie {
    const trie = new Trie();
    trie.root = Trie.deserializeNode(data.root);
    trie.size = data.size;
    return trie;
  }

  private serializeNode(node: TrieNode): any {
    return {
      children: Array.from(node.children.entries()).map(([char, child]) => [
        char,
        this.serializeNode(child),
      ]),
      isEndOfWord: node.isEndOfWord,
      docIds: Array.from(node.docIds),
      term: node.term,
    };
  }

  private static deserializeNode(data: any): TrieNode {
    const node: TrieNode = {
      children: new Map(),
      isEndOfWord: data.isEndOfWord,
      docIds: new Set(data.docIds),
      term: data.term,
    };

    for (const [char, childData] of data.children) {
      node.children.set(char, Trie.deserializeNode(childData));
    }

    return node;
  }
}
