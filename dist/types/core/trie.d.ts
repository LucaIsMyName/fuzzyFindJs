/**
 * Trie (Prefix Tree) for fast prefix matching
 * Provides O(k) lookup where k is the query length, instead of O(n) where n is the number of terms
 */
export interface TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;
    docIds: Set<number>;
    term?: string;
}
export declare class Trie {
    private root;
    private size;
    constructor();
    private createNode;
    /**
     * Insert a term with associated document IDs
     */
    insert(term: string, docIds: number[]): void;
    /**
     * Find all terms that start with the given prefix
     * Returns array of [term, docIds[]] tuples
     */
    findWithPrefix(prefix: string): Array<[string, number[]]>;
    /**
     * Check if exact term exists
     */
    has(term: string): boolean;
    /**
     * Get document IDs for exact term
     */
    get(term: string): number[] | null;
    /**
     * Recursively collect all terms from a node
     */
    private collectTerms;
    /**
     * Get the number of terms in the trie
     */
    getSize(): number;
    /**
     * Clear the trie
     */
    clear(): void;
    /**
     * Serialize trie to JSON-compatible format
     */
    toJSON(): any;
    /**
     * Deserialize trie from JSON
     */
    static fromJSON(data: any): Trie;
    private serializeNode;
    private static deserializeNode;
}
//# sourceMappingURL=trie.d.ts.map