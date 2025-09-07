/**
 * Data Loader Module
 * Handles fetching and caching of news data from JSON files
 */

class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingStates = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Load news data from JSON file
     * @param {string} filepath - Path to the JSON file
     * @returns {Promise<Object>} - News data
     */
    async loadNewsData(filepath = 'data/news.json') {
        // Check cache first
        if (this.cache.has(filepath)) {
            return this.cache.get(filepath);
        }

        // Check if already loading
        if (this.loadingStates.has(filepath)) {
            return this.loadingStates.get(filepath);
        }

        // Create loading promise
        const loadingPromise = this._fetchWithRetry(filepath);
        this.loadingStates.set(filepath, loadingPromise);

        try {
            const data = await loadingPromise;
            
            // Validate data structure
            this._validateNewsData(data);
            
            // Cache the data
            this.cache.set(filepath, data);
            
            return data;
        } catch (error) {
            console.error('Failed to load news data:', error);
            throw new Error(`Unable to load news data from ${filepath}`);
        } finally {
            this.loadingStates.delete(filepath);
        }
    }

    /**
     * Fetch data with retry mechanism
     * @private
     */
    async _fetchWithRetry(filepath, attempt = 1) {
        try {
            const response = await fetch(filepath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            if (attempt < this.retryAttempts) {
                console.warn(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
                await this._delay(this.retryDelay);
                return this._fetchWithRetry(filepath, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Validate news data structure
     * @private
     */
    _validateNewsData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format: expected object');
        }

        if (!data.meta) {
            console.warn('Missing meta information in news data');
        }

        // Check for required sections
        const requiredSections = ['hero', 'latest'];
        for (const section of requiredSections) {
            if (!data[section]) {
                throw new Error(`Missing required section: ${section}`);
            }
        }

        // Validate articles in each section
        Object.keys(data).forEach(sectionKey => {
            if (sectionKey === 'meta') return;
            
            const section = data[sectionKey];
            if (section.items && Array.isArray(section.items)) {
                section.items.forEach((article, index) => {
                    this._validateArticle(article, `${sectionKey}[${index}]`);
                });
            }
        });
    }

    /**
     * Validate individual article structure
     * @private
     */
    _validateArticle(article, context = 'article') {
        const required = ['id', 'title', 'slug', 'summary', 'publishedAt', 'author', 'section'];
        
        for (const field of required) {
            if (!article[field]) {
                console.warn(`Missing required field '${field}' in ${context}`);
            }
        }

        // Validate author structure
        if (article.author && typeof article.author === 'object') {
            const authorRequired = ['id', 'name'];
            for (const field of authorRequired) {
                if (!article.author[field]) {
                    console.warn(`Missing author field '${field}' in ${context}`);
                }
            }
        }

        // Validate images structure
        if (article.images && article.images.lead && !article.images.lead.sources) {
            console.warn(`Missing image sources in ${context}`);
        }
    }

    /**
     * Get article by slug
     * @param {string} slug - Article slug
     * @returns {Promise<Object|null>} - Article object or null if not found
     */
    async getArticleBySlug(slug) {
        try {
            const data = await this.loadNewsData();
            
            // Search through all sections for the article
            for (const sectionKey of Object.keys(data)) {
                if (sectionKey === 'meta') continue;
                
                const section = data[sectionKey];
                if (section.items && Array.isArray(section.items)) {
                    const article = section.items.find(item => item.slug === slug);
                    if (article) {
                        return {
                            ...article,
                            sectionData: section
                        };
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error finding article by slug:', error);
            return null;
        }
    }

    /**
     * Get articles by section
     * @param {string} sectionName - Section name
     * @returns {Promise<Array>} - Array of articles
     */
    async getArticlesBySection(sectionName) {
        try {
            const data = await this.loadNewsData();
            const section = data[sectionName];
            
            if (!section || !section.items) {
                return [];
            }
            
            return section.items || [];
        } catch (error) {
            console.error('Error getting articles by section:', error);
            return [];
        }
    }

    /**
     * Search articles
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} - Array of matching articles
     */
    async searchArticles(query, filters = {}) {
        try {
            const data = await this.loadNewsData();
            let allArticles = [];
            
            // Collect all articles from all sections
            Object.keys(data).forEach(sectionKey => {
                if (sectionKey === 'meta') return;
                
                const section = data[sectionKey];
                if (section.items && Array.isArray(section.items)) {
                    allArticles = allArticles.concat(
                        section.items.map(article => ({
                            ...article,
                            sectionKey
                        }))
                    );
                }
            });

            // Apply search query
            if (query && query.trim()) {
                const searchTerm = query.toLowerCase().trim();
                allArticles = allArticles.filter(article => {
                    return (
                        article.title.toLowerCase().includes(searchTerm) ||
                        article.summary.toLowerCase().includes(searchTerm) ||
                        (article.content && article.content.toLowerCase().includes(searchTerm)) ||
                        (article.tags && article.tags.some(tag => 
                            tag.toLowerCase().includes(searchTerm)
                        )) ||
                        (article.categories && article.categories.some(cat => 
                            cat.toLowerCase().includes(searchTerm)
                        ))
                    );
                });
            }

            // Apply filters
            if (filters.section) {
                allArticles = allArticles.filter(article => 
                    article.section === filters.section || article.sectionKey === filters.section
                );
            }

            if (filters.dateRange) {
                const { start, end } = filters.dateRange;
                allArticles = allArticles.filter(article => {
                    const publishDate = new Date(article.publishedAt);
                    return publishDate >= start && publishDate <= end;
                });
            }

            if (filters.author) {
                allArticles = allArticles.filter(article => 
                    article.author.name.toLowerCase().includes(filters.author.toLowerCase())
                );
            }

            // Sort by relevance and date
            allArticles.sort((a, b) => {
                // If there's a search query, prioritize title matches
                if (query && query.trim()) {
                    const aInTitle = a.title.toLowerCase().includes(query.toLowerCase());
                    const bInTitle = b.title.toLowerCase().includes(query.toLowerCase());
                    if (aInTitle && !bInTitle) return -1;
                    if (!aInTitle && bInTitle) return 1;
                }
                
                // Sort by date (newest first)
                return new Date(b.publishedAt) - new Date(a.publishedAt);
            });

            return allArticles;
            
        } catch (error) {
            console.error('Error searching articles:', error);
            return [];
        }
    }

    /**
     * Get related articles
     * @param {Object} article - Current article
     * @param {number} limit - Number of related articles to return
     * @returns {Promise<Array>} - Array of related articles
     */
    async getRelatedArticles(article, limit = 3) {
        try {
            const data = await this.loadNewsData();
            let allArticles = [];
            
            // Collect all articles except the current one
            Object.keys(data).forEach(sectionKey => {
                if (sectionKey === 'meta') return;
                
                const section = data[sectionKey];
                if (section.items && Array.isArray(section.items)) {
                    allArticles = allArticles.concat(
                        section.items.filter(item => item.id !== article.id)
                    );
                }
            });

            // Score articles by relevance
            const scoredArticles = allArticles.map(relatedArticle => {
                let score = 0;
                
                // Same section gets high score
                if (relatedArticle.section === article.section) {
                    score += 10;
                }
                
                // Shared categories
                if (article.categories && relatedArticle.categories) {
                    const sharedCategories = article.categories.filter(cat =>
                        relatedArticle.categories.includes(cat)
                    );
                    score += sharedCategories.length * 5;
                }
                
                // Shared tags
                if (article.tags && relatedArticle.tags) {
                    const sharedTags = article.tags.filter(tag =>
                        relatedArticle.tags.includes(tag)
                    );
                    score += sharedTags.length * 3;
                }
                
                // Same author
                if (relatedArticle.author.id === article.author.id) {
                    score += 2;
                }
                
                // Recency bonus (newer articles get slight preference)
                const daysDiff = Math.abs(
                    new Date(article.publishedAt) - new Date(relatedArticle.publishedAt)
                ) / (1000 * 60 * 60 * 24);
                
                if (daysDiff < 7) {
                    score += 1;
                }
                
                return { ...relatedArticle, relevanceScore: score };
            });

            // Sort by relevance score and return top results
            return scoredArticles
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit);
                
        } catch (error) {
            console.error('Error getting related articles:', error);
            return [];
        }
    }

    /**
     * Get trending articles
     * @param {string} period - Time period ('24h' or '7d')
     * @returns {Promise<Array>} - Array of trending articles
     */
    async getTrendingArticles(period = '24h') {
        try {
            const data = await this.loadNewsData();
            
            // First check if trending section exists
            if (data.trending && data.trending.items) {
                return data.trending.items;
            }
            
            // Fallback: get recent articles and sort by featured status
            let allArticles = [];
            
            Object.keys(data).forEach(sectionKey => {
                if (sectionKey === 'meta') return;
                
                const section = data[sectionKey];
                if (section.items && Array.isArray(section.items)) {
                    allArticles = allArticles.concat(section.items);
                }
            });

            // Filter by time period
            const now = new Date();
            const cutoffTime = period === '24h' ? 
                new Date(now.getTime() - 24 * 60 * 60 * 1000) :
                new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            allArticles = allArticles.filter(article => 
                new Date(article.publishedAt) >= cutoffTime
            );

            // Sort by featured status and date
            return allArticles
                .sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return new Date(b.publishedAt) - new Date(a.publishedAt);
                })
                .slice(0, 10);
                
        } catch (error) {
            console.error('Error getting trending articles:', error);
            return [];
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Utility function to delay execution
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create and export singleton instance
const dataLoader = new DataLoader();


export default dataLoader;
