/**
 * Search utility functions for highlighting, suggestions, and search history
 */

/**
 * Highlight matching text in a string
 * @param {string} text - The text to highlight
 * @param {string} query - The search query
 * @returns {string} - HTML string with highlighted matches
 */
export const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200">$1</mark>');
};

/**
 * Get search suggestions based on query and recent searches
 * @param {string} query - Current search query
 * @param {Array<string>} recentSearches - Array of recent search terms
 * @param {number} maxSuggestions - Maximum number of suggestions
 * @returns {Array<string>} - Array of suggested search terms
 */
export const getSearchSuggestions = (query, recentSearches = [], maxSuggestions = 5) => {
    if (!query) {
        return recentSearches.slice(0, maxSuggestions);
    }
    
    const lowerQuery = query.toLowerCase();
    const suggestions = recentSearches
        .filter(search => search.toLowerCase().includes(lowerQuery))
        .slice(0, maxSuggestions);
    
    return suggestions;
};

/**
 * Save a search to recent searches in localStorage
 * @param {string} query - Search query to save
 * @param {number} maxRecent - Maximum number of recent searches to keep
 */
export const saveRecentSearch = (query, maxRecent = 10) => {
    if (!query || !query.trim()) return;
    
    try {
        const recent = getRecentSearches();
        // Remove if already exists
        const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
        // Add to beginning
        filtered.unshift(query.trim());
        // Keep only maxRecent
        const limited = filtered.slice(0, maxRecent);
        localStorage.setItem('recentSearches', JSON.stringify(limited));
    } catch (error) {
        // Silently fail if localStorage is not available
    }
};

/**
 * Get recent searches from localStorage
 * @returns {Array<string>} - Array of recent search terms
 */
export const getRecentSearches = () => {
    try {
        const stored = localStorage.getItem('recentSearches');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};

/**
 * Clear recent searches from localStorage
 */
export const clearRecentSearches = () => {
    try {
        localStorage.removeItem('recentSearches');
    } catch (error) {
        // Silently fail if localStorage is not available
    }
};

/**
 * Save a search filter preset
 * @param {string} name - Name of the preset
 * @param {Object} filters - Filter object to save
 */
export const saveSearchPreset = (name, filters) => {
    try {
        const presets = getSearchPresets();
        presets[name] = filters;
        localStorage.setItem('searchPresets', JSON.stringify(presets));
    } catch (error) {
        // Silently fail if localStorage is not available
    }
};

/**
 * Get all saved search presets
 * @returns {Object} - Object with preset names as keys and filters as values
 */
export const getSearchPresets = () => {
    try {
        const stored = localStorage.getItem('searchPresets');
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        return {};
    }
};

/**
 * Delete a search preset
 * @param {string} name - Name of the preset to delete
 */
export const deleteSearchPreset = (name) => {
    try {
        const presets = getSearchPresets();
        delete presets[name];
        localStorage.setItem('searchPresets', JSON.stringify(presets));
    } catch (error) {
        // Silently fail if localStorage is not available
    }
};

/**
 * Calculate word count from text
 * @param {string} text - Text to count words in
 * @returns {number} - Word count
 */
export const calculateWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Format date for API (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateForAPI = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Simple client-side search index for fast filtering
 * Creates a searchable index from writings array
 */
export class SearchIndex {
    constructor(writings = []) {
        this.writings = writings;
        this.index = this.buildIndex(writings);
    }

    buildIndex(writings) {
        const index = new Map();
        writings.forEach((writing, idx) => {
            const searchableText = [
                writing.title || '',
                writing.content || '',
                writing.author || ''
            ].join(' ').toLowerCase();
            
            // Index by words
            const words = searchableText.split(/\s+/).filter(w => w.length > 0);
            words.forEach(word => {
                if (!index.has(word)) {
                    index.set(word, new Set());
                }
                index.get(word).add(idx);
            });
        });
        return index;
    }

    search(query) {
        if (!query || !query.trim()) {
            return this.writings;
        }

        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        if (queryWords.length === 0) {
            return this.writings;
        }

        // Find writings that match all query words
        const matchingIndices = new Set();
        let firstWord = true;

        queryWords.forEach(word => {
            const wordMatches = this.index.get(word);
            if (wordMatches) {
                if (firstWord) {
                    wordMatches.forEach(idx => matchingIndices.add(idx));
                    firstWord = false;
                } else {
                    // Intersection: only keep indices that match all words
                    const currentMatches = new Set(matchingIndices);
                    matchingIndices.clear();
                    currentMatches.forEach(idx => {
                        if (wordMatches.has(idx)) {
                            matchingIndices.add(idx);
                        }
                    });
                }
            } else {
                // If any word doesn't match, clear results
                matchingIndices.clear();
            }
        });

        return Array.from(matchingIndices).map(idx => this.writings[idx]);
    }

    update(writings) {
        this.writings = writings;
        this.index = this.buildIndex(writings);
    }
}

