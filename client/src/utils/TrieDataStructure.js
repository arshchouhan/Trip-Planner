/**
 * Trie data structure for efficient prefix-based search
 * Optimized for search-as-you-type autocomplete functionality
 */

class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.metadata = null; // Store additional info (coordinates, etc.)
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.placesMap = new Map(); // HashMap to store place data by name
  }

  /**
   * Insert a word into the trie
   * @param {string} word - The word to insert
   * @param {object} metadata - Additional data to store with the word (coordinates, etc.)
   */
  insert(word, metadata = null) {
    if (!word) return;
    
    // Normalize the word (lowercase, trim)
    const normalizedWord = word.toLowerCase().trim();
    
    // Store in HashMap for O(1) lookup when we know the exact name
    this.placesMap.set(normalizedWord, metadata);
    
    let current = this.root;
    
    for (let i = 0; i < normalizedWord.length; i++) {
      const char = normalizedWord[i];
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }
    
    // Mark as end of a word and store metadata
    current.isEndOfWord = true;
    current.metadata = metadata;
  }

  /**
   * Search for words with the given prefix
   * @param {string} prefix - The prefix to search for
   * @param {number} limit - Maximum number of suggestions to return
   * @returns {Array} - Array of matching words with their metadata
   */
  searchPrefix(prefix, limit = 10) {
    if (!prefix) return [];
    
    // Normalize the prefix
    const normalizedPrefix = prefix.toLowerCase().trim();
    
    // Find the node corresponding to the prefix
    let current = this.root;
    for (let i = 0; i < normalizedPrefix.length; i++) {
      const char = normalizedPrefix[i];
      if (!current.children[char]) {
        // No matches for this prefix
        return [];
      }
      current = current.children[char];
    }
    
    // Collect all words with this prefix
    const suggestions = [];
    this._collectWords(current, normalizedPrefix, suggestions, limit);
    
    return suggestions;
  }

  /**
   * Helper method to collect all words from a given node
   * @private
   * @param {TrieNode} node - Current node
   * @param {string} prefix - Current prefix
   * @param {Array} suggestions - Array to store suggestions
   * @param {number} limit - Maximum number of suggestions
   */
  _collectWords(node, prefix, suggestions, limit) {
    // If we've reached the limit, stop
    if (suggestions.length >= limit) return;
    
    // If this node is an end of a word, add it to suggestions
    if (node.isEndOfWord) {
      suggestions.push({
        name: prefix,
        metadata: node.metadata
      });
    }
    
    // Explore all child nodes
    for (const char in node.children) {
      this._collectWords(
        node.children[char],
        prefix + char,
        suggestions,
        limit
      );
    }
  }

  /**
   * Get exact match from HashMap (O(1) operation)
   * @param {string} word - The word to look up
   * @returns {object|null} - The metadata for the word or null
   */
  getExactMatch(word) {
    if (!word) return null;
    return this.placesMap.get(word.toLowerCase().trim()) || null;
  }

  /**
   * Clear the trie
   */
  clear() {
    this.root = new TrieNode();
    this.placesMap.clear();
  }

  /**
   * Perform fuzzy search when exact prefix doesn't match
   * @param {string} query - The query string
   * @param {number} limit - Maximum number of suggestions
   * @param {number} maxDistance - Maximum edit distance for fuzzy matching
   * @returns {Array} - Array of matching words with their metadata
   */
  fuzzySearch(query, limit = 5, maxDistance = 2) {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    // Convert Map to Array for iteration
    const entries = Array.from(this.placesMap.entries());
    
    for (const [word, metadata] of entries) {
      const distance = this._levenshteinDistance(normalizedQuery, word);
      if (distance <= maxDistance) {
        results.push({
          name: word,
          metadata: metadata,
          distance: distance // Lower distance = better match
        });
      }
      
      if (results.length >= limit * 3) break; // Collect more than needed for sorting
    }
    
    // Sort by distance (closest matches first) and limit results
    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @private
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Edit distance
   */
  _levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return matrix[b.length][a.length];
  }
}

export default Trie;
