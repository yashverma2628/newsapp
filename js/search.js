/**
 * Search Module
 * Handles client-side search functionality with fuzzy matching
 */

import dataLoader from '.loader.js';
import { searchResultsTemplate } from '.templates.js';

class SearchEngine {
    constructor() {
        this.searchData = null;
        this.searchIndex = null;
        this.debounceTimer = null;
        this.minQueryLength = 2;
        this.maxResults = 20;
        
        this.init();
    }

    /**
     * Initialize search engine
     */
    async init() {
        try {
            await this.buildSearchIndex();
            this.initializeSearchUI();
        } catch (error) {
            console.error('Failed to initialize search:', error);
        }
    }

    /**
     * Build search index from news data
     */
    async buildSearchIndex() {
        try {
            const newsData = await dataLoader.loadNewsData();
            this.searchData = [];
            
            // Extract all articles from all sections
            Object.keys(newsData).forEach(sectionKey => {
                if (sectionKey === 'meta') return;
                
                const section = newsData[sectionKey];
                if (section.items && Array.isArray(section.items)) {
                    section.items.forEach(article => {
                        this.searchData.push({
                            ...article,
                            sectionKey,
                            searchText: this.createSearchText(article)
                        });
                    });
                }
            });

            // Create simple search index
            this.searchIndex = this.createSearchIndex(this.searchData);
            
        } catch (error) {
            console.error('Failed to build search index:', error);
            throw error;
        }
    }

    /**
     * Create searchable text from article
     * @param {Object} article - Article object
     * @returns {string} - Combined searchable text
     */
    createSearchText(article) {
        const textParts = [
            article.title || '',
            article.summary || '',
            article.content || '',
            article.section || '',
            (article.categories || []).join(' '),
            (article.tags || []).join(' '),
            article.author?.name || ''
        ];
        
        return textParts
            .join(' ')
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Create simple search index
     * @param {Array} articles - Array of articles
     * @returns {Object} - Search index
     */
    createSearchIndex(articles) {
        const index = {};
        
        articles.forEach((article, articleIndex) => {
            const words = article.searchText.split(' ');
            
            words.forEach(word => {
                if (word.length < 2) return;
                
                if (!index[word]) {
                    index[word] = [];
                }
                
                index[word].push({
                    articleIndex,
                    word,
                    positions: this.findWordPositions(article.searchText, word)
                });
            });
        });
        
        return index;
    }

    /**
     * Find word positions in text
     * @param {string} text - Text to search in
     * @param {string} word - Word to find
     * @returns {Array} - Array of positions
     */
    findWordPositions(text, word) {
        const positions = [];
        let index = 0;
        
        while ((index = text.indexOf(word, index)) !== -1) {
            positions.push(index);
            index += word.length;
        }
        
        return positions;
    }

    /**
     * Perform search query
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @returns {Array} - Array of search results
     */
    async search(query, filters = {}) {
        if (!query || query.trim().length < this.minQueryLength) {
            return [];
        }

        try {
            const normalizedQuery = query.toLowerCase().trim();
            const queryWords = normalizedQuery.split(/\s+/);
            
            // Get candidate articles
            const candidates = this.getCandidateArticles(queryWords);
            
            // Score and rank results
            const scoredResults = this.scoreSearchResults(candidates, normalizedQuery, queryWords);
            
            // Apply filters
            let filteredResults = this.applyFilters(scoredResults, filters);
            
            // Sort by relevance score
            filteredResults.sort((a, b) => b.score - a.score);
            
            // Limit results
            return filteredResults.slice(0, this.maxResults);
            
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Get candidate articles that might match the query
     * @param {Array} queryWords - Array of query words
     * @returns {Set} - Set of candidate article indices
     */
    getCandidateArticles(queryWords) {
        const candidates = new Set();
        
        queryWords.forEach(word => {
            // Exact matches
            if (this.searchIndex[word]) {
                this.searchIndex[word].forEach(match => {
                    candidates.add(match.articleIndex);
                });
            }
            
            // Fuzzy matches (starts with)
            Object.keys(this.searchIndex).forEach(indexWord => {
                if (indexWord.startsWith(word) || word.startsWith(indexWord)) {
                    this.searchIndex[indexWord].forEach(match => {
                        candidates.add(match.articleIndex);
                    });
                }
            });
            
            // Substring matches for longer words
            if (word.length > 3) {
                Object.keys(this.searchIndex).forEach(indexWord => {
                    if (indexWord.includes(word) || word.includes(indexWord)) {
                        this.searchIndex[indexWord].forEach(match => {
                            candidates.add(match.articleIndex);
                        });
                    }
                });
            }
        });
        
        return candidates;
    }

    /**
     * Score search results based on relevance
     * @param {Set} candidates - Set of candidate article indices
     * @param {string} normalizedQuery - Normalized query string
     * @param {Array} queryWords - Array of query words
     * @returns {Array} - Array of scored results
     */
    scoreSearchResults(candidates, normalizedQuery, queryWords) {
        const results = [];
        
        candidates.forEach(articleIndex => {
            const article = this.searchData[articleIndex];
            if (!article) return;
            
            let score = 0;
            
            // Title matches get highest score
            const titleScore = this.calculateTextScore(
                article.title.toLowerCase(), 
                normalizedQuery, 
                queryWords
            );
            score += titleScore * 10;
            
            // Summary matches get high score
            const summaryScore = this.calculateTextScore(
                article.summary.toLowerCase(), 
                normalizedQuery, 
                queryWords
            );
            score += summaryScore * 5;
            
            // Content matches get medium score
            if (article.content) {
                const contentScore = this.calculateTextScore(
                    article.content.toLowerCase(), 
                    normalizedQuery, 
                    queryWords
                );
                score += contentScore * 2;
            }
            
            // Tag matches get medium score
            if (article.tags) {
                const tagsText = article.tags.join(' ').toLowerCase();
                const tagsScore = this.calculateTextScore(tagsText, normalizedQuery, queryWords);
                score += tagsScore * 3;
            }
            
            // Category matches get medium score
            if (article.categories) {
                const categoriesText = article.categories.join(' ').toLowerCase();
                const categoriesScore = this.calculateTextScore(categoriesText, normalizedQuery, queryWords);
                score += categoriesScore * 3;
            }
            
            // Section matches get low score
            const sectionScore = this.calculateTextScore(
                article.section.toLowerCase(), 
                normalizedQuery, 
                queryWords
            );
            score += sectionScore * 1;
            
            // Author matches get low score
            if (article.author?.name) {
                const authorScore = this.calculateTextScore(
                    article.author.name.toLowerCase(), 
                    normalizedQuery, 
                    queryWords
                );
                score += authorScore * 1;
            }
            
            // Recency bonus (newer articles get slight preference)
            const publishDate = new Date(article.publishedAt);
            const now = new Date();
            const daysDiff = (now - publishDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 1) {
                score += 2; // Today
            } else if (daysDiff < 7) {
                score += 1; // This week
            }
            
            // Featured article bonus
            if (article.featured) {
                score += 1;
            }
            
            if (score > 0) {
                results.push({
                    ...article,
                    score: score
                });
            }
        });
        
        return results;
    }

    /**
     * Calculate text relevance score
     * @param {string} text - Text to search in
     * @param {string} query - Complete query
     * @param {Array} queryWords - Array of query words
     * @returns {number} - Relevance score
     */
    calculateTextScore(text, query, queryWords) {
        if (!text) return 0;
        
        let score = 0;
        
        // Exact phrase match gets highest score
        if (text.includes(query)) {
            score += 10;
        }
        
        // Individual word matches
        queryWords.forEach(word => {
            if (text.includes(word)) {
                // Exact word match
                const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
                const exactMatches = (text.match(wordRegex) || []).length;
                score += exactMatches * 3;
                
                // Partial matches
                if (exactMatches === 0 && text.includes(word)) {
                    score += 1;
                }
            }
        });
        
        // Position bonus (earlier matches are more relevant)
        const queryPosition = text.indexOf(query);
        if (queryPosition !== -1) {
            const positionScore = Math.max(0, 5 - Math.floor(queryPosition / 100));
            score += positionScore;
        }
        
        return score;
    }

    /**
     * Apply search filters
     * @param {Array} results - Search results
     * @param {Object} filters - Filter options
     * @returns {Array} - Filtered results
     */
    applyFilters(results, filters) {
        let filteredResults = [...results];
        
        // Section filter
        if (filters.section) {
            filteredResults = filteredResults.filter(article => 
                article.section === filters.section || article.sectionKey === filters.section
            );
        }
        
        // Date range filter
        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            filteredResults = filteredResults.filter(article => {
                const publishDate = new Date(article.publishedAt);
                return publishDate >= start && publishDate <= end;
            });
        }
        
        // Author filter
        if (filters.author) {
            filteredResults = filteredResults.filter(article => 
                article.author?.name.toLowerCase().includes(filters.author.toLowerCase())
            );
        }
        
        // Categories filter
        if (filters.categories && filters.categories.length > 0) {
            filteredResults = filteredResults.filter(article => 
                article.categories && article.categories.some(cat => 
                    filters.categories.includes(cat)
                )
            );
        }
        
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            filteredResults = filteredResults.filter(article => 
                article.tags && article.tags.some(tag => 
                    filters.tags.includes(tag)
                )
            );
        }
        
        return filteredResults;
    }

    /**
     * Get search suggestions
     * @param {string} query - Partial query
     * @returns {Array} - Array of suggestions
     */
    getSuggestions(query) {
        if (!query || query.length < 2) return [];
        
        const normalizedQuery = query.toLowerCase();
        const suggestions = new Set();
        
        // Get suggestions from search index
        Object.keys(this.searchIndex).forEach(word => {
            if (word.startsWith(normalizedQuery)) {
                suggestions.add(word);
            }
        });
        
        // Get suggestions from article titles
        this.searchData.forEach(article => {
            const title = article.title.toLowerCase();
            if (title.includes(normalizedQuery)) {
                // Extract relevant phrases from title
                const words = title.split(' ');
                words.forEach((word, index) => {
                    if (word.includes(normalizedQuery) && word.length > 3) {
                        // Add the word and next 2-3 words as suggestion
                        const phrase = words.slice(index, index + 3).join(' ');
                        if (phrase.length > query.length) {
                            suggestions.add(phrase);
                        }
                    }
                });
            }
        });
        
        return Array.from(suggestions)
            .slice(0, 8)
            .sort((a, b) => a.length - b.length);
    }

    /**
     * Initialize search UI
     */
    initializeSearchUI() {
        const modalSearchInput = document.querySelector('#modal-search-input');
        const searchResults = document.querySelector('#search-results');
        
        if (modalSearchInput && searchResults) {
            modalSearchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value, searchResults);
            });
            
            modalSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearchSubmit(e.target.value);
                }
            });
        }
    }

    /**
     * Handle search input with debouncing
     * @param {string} query - Search query
     * @param {HTMLElement} resultsContainer - Results container element
     */
    handleSearchInput(query, resultsContainer) {
        clearTimeout(this.debounceTimer);
        
        if (query.trim().length < this.minQueryLength) {
            resultsContainer.innerHTML = `
                <div class="search-placeholder">
                    <p>Start typing to search articles...</p>
                </div>
            `;
            return;
        }
        
        // Show loading state
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="spinner"></div>
                <p>Searching...</p>
            </div>
        `;
        
        this.debounceTimer = setTimeout(async () => {
            try {
                const results = await this.search(query);
                resultsContainer.innerHTML = searchResultsTemplate(results, query);
                
                // Add click handlers to results
                this.addResultClickHandlers(resultsContainer);
                
            } catch (error) {
                console.error('Search failed:', error);
                resultsContainer.innerHTML = `
                    <div class="search-error">
                        <p>Search failed. Please try again.</p>
                    </div>
                `;
            }
        }, 300);
    }

    /**
     * Handle search form submission
     * @param {string} query - Search query
     */
    handleSearchSubmit(query) {
        if (query.trim()) {
            window.location.href = `/search.html?q=${encodeURIComponent(query.trim())}`;
        }
    }

    /**
     * Add click handlers to search results
     * @param {HTMLElement} container - Results container
     */
    addResultClickHandlers(container) {
        const resultElements = container.querySelectorAll('.search-result');
        
        resultElements.forEach(element => {
            element.addEventListener('click', () => {
                const slug = element.dataset.slug;
                if (slug) {
                    window.location.href = `/article.html?slug=${encodeURIComponent(slug)}`;
                }
            });
        });
    }

    /**
     * Get all available sections for filtering
     * @returns {Array} - Array of section names
     */
    getAvailableSections() {
        const sections = new Set();
        this.searchData.forEach(article => {
            sections.add(article.section);
        });
        return Array.from(sections).sort();
    }

    /**
     * Get all available categories for filtering
     * @returns {Array} - Array of categories
     */
    getAvailableCategories() {
        const categories = new Set();
        this.searchData.forEach(article => {
            if (article.categories) {
                article.categories.forEach(cat => categories.add(cat));
            }
        });
        return Array.from(categories).sort();
    }

    /**
     * Get all available tags for filtering
     * @returns {Array} - Array of tags
     */
    getAvailableTags() {
        const tags = new Set();
        this.searchData.forEach(article => {
            if (article.tags) {
                article.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }

    /**
     * Get search statistics
     * @returns {Object} - Search statistics
     */
    getSearchStats() {
        return {
            totalArticles: this.searchData ? this.searchData.length : 0,
            indexSize: this.searchIndex ? Object.keys(this.searchIndex).length : 0,
            sections: this.getAvailableSections().length,
            categories: this.getAvailableCategories().length,
            tags: this.getAvailableTags().length
        };
    }

    /**
     * Clear search cache and rebuild index
     */
    async refresh() {
        try {
            dataLoader.clearCache();
            await this.buildSearchIndex();
            console.log('Search index refreshed');
        } catch (error) {
            console.error('Failed to refresh search index:', error);
        }
    }
}

// Create global search engine instance
const searchEngine = new SearchEngine();

/**
 * Initialize search functionality
 */
export function initSearch() {
    // Search engine is already initialized in constructor
    console.log('Search functionality initialized');
}

/**
 * Perform search (exposed for external use)
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Search results
 */
export async function performSearch(query, filters = {}) {
    return await searchEngine.search(query, filters);
}

/**
 * Get search suggestions (exposed for external use)
 * @param {string} query - Partial query
 * @returns {Array} - Suggestions
 */
export function getSearchSuggestions(query) {
    return searchEngine.getSuggestions(query);
}

/**
 * Get available filters (exposed for external use)
 * @returns {Object} - Available filter options
 */
export function getAvailableFilters() {
    return {
        sections: searchEngine.getAvailableSections(),
        categories: searchEngine.getAvailableCategories(),
        tags: searchEngine.getAvailableTags()
    };
}

// Export search engine for advanced usage
export { searchEngine };

export default {
    initSearch,
    performSearch,
    getSearchSuggestions,
    getAvailableFilters,
    searchEngine

};
