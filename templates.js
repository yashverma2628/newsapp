/**
 * Templates Module
 * Provides HTML template functions and content sanitization
 */

/**
 * Simple HTML sanitizer to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeHtml(str) {
    if (!str) return '';
    
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeHtml(str) {
    if (!str) return '';
    
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return String(str).replace(/[&<>"'/]/g, (s) => htmlEntities[s]);
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);
    
    // Less than 1 minute
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    // Less than 1 hour
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than 7 days
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format reading time
 * @param {number} minutes - Reading time in minutes
 * @returns {string} - Formatted reading time
 */
export function formatReadingTime(minutes) {
    if (!minutes || minutes < 1) return '1 min read';
    return `${Math.round(minutes)} min read`;
}

/**
 * Generate responsive image sources
 * @param {Object} imageData - Image data from article
 * @returns {string} - srcset attribute value
 */
export function generateSrcset(imageData) {
    if (!imageData || !imageData.sources || !Array.isArray(imageData.sources)) {
        return '';
    }
    
    return imageData.sources
        .map(source => `${source.url} ${source.width}w`)
        .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param {string} variant - Image variant ('hero', 'card', 'thumb', etc.)
 * @returns {string} - sizes attribute value
 */
export function generateSizes(variant = 'default') {
    const sizeMap = {
        hero: '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px',
        card: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 300px',
        thumb: '(max-width: 480px) 80px, 120px',
        full: '100vw',
        default: '(max-width: 768px) 100vw, 400px'
    };
    
    return sizeMap[variant] || sizeMap.default;
}

/**
 * Hero section template
 */
export function heroTemplate(heroData) {
    if (!heroData || !heroData.items || heroData.items.length === 0) {
        return '<div class="hero-placeholder">No featured stories available</div>';
    }
    
    const mainStory = heroData.items[0];
    const secondaryStories = heroData.items.slice(1, 4);
    
    const mainImageSrc = mainStory.images?.lead?.sources?.[0]?.url || '/assets/images/placeholder.jpg';
    const mainImageSrcset = generateSrcset(mainStory.images?.lead);
    const mainImageAlt = escapeHtml(mainStory.images?.lead?.alt || mainStory.title);
    
    return `
        <div class="hero-carousel">
            <article class="hero-main">
                <a href="/article.html?slug=${encodeURIComponent(mainStory.slug)}">
                    <img 
                        src="${mainImageSrc}" 
                        srcset="${mainImageSrcset}"
                        sizes="${generateSizes('hero')}"
                        alt="${mainImageAlt}"
                        loading="eager"
                    >
                    <div class="hero-overlay">
                        <span class="hero-category">${escapeHtml(mainStory.section)}</span>
                        <h1 class="hero-title">${escapeHtml(mainStory.title)}</h1>
                        <p class="hero-summary">${escapeHtml(mainStory.summary)}</p>
                        <div class="hero-meta">
                            <span>By ${escapeHtml(mainStory.author.name)}</span>
                            <span>${formatDate(mainStory.publishedAt)}</span>
                            <span>${formatReadingTime(mainStory.readingTime)}</span>
                        </div>
                    </div>
                </a>
            </article>
            
            <div class="hero-sidebar">
                ${secondaryStories.map(story => heroSecondaryTemplate(story)).join('')}
            </div>
        </div>
    `;
}

/**
 * Hero secondary story template
 */
function heroSecondaryTemplate(story) {
    const imageSrc = story.images?.lead?.sources?.[0]?.url || '/assets/images/placeholder.jpg';
    const imageAlt = escapeHtml(story.images?.lead?.alt || story.title);
    
    return `
        <article class="hero-secondary">
            <a href="/article.html?slug=${encodeURIComponent(story.slug)}">
                <div class="hero-secondary-image">
                    <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
                </div>
                <div class="hero-secondary-content">
                    <h3>${escapeHtml(story.title)}</h3>
                    <div class="hero-secondary-meta">
                        ${formatDate(story.publishedAt)} • ${formatReadingTime(story.readingTime)}
                    </div>
                </div>
            </a>
        </article>
    `;
}

/**
 * Article card template
 */
export function articleCardTemplate(article, variant = 'default') {
    const imageSrc = article.images?.lead?.sources?.[0]?.url || '/assets/images/placeholder.jpg';
    const imageSrcset = generateSrcset(article.images?.lead);
    const imageAlt = escapeHtml(article.images?.lead?.alt || article.title);
    const authorAvatar = article.author.avatar || '/assets/authors/default.jpg';
    
    const sponsoredClass = article.sponsored ? ' sponsored' : '';
    const variantClass = variant !== 'default' ? ` ${variant}` : '';
    
    return `
        <article class="article-card${variantClass}${sponsoredClass}">
            <a href="/article.html?slug=${encodeURIComponent(article.slug)}">
                <div class="article-image">
                    <img 
                        src="${imageSrc}" 
                        srcset="${imageSrcset}"
                        sizes="${generateSizes('card')}"
                        alt="${imageAlt}"
                        loading="lazy"
                    >
                </div>
                <div class="article-content">
                    <span class="article-category">${escapeHtml(article.section)}</span>
                    <h3 class="article-title">${escapeHtml(article.title)}</h3>
                    ${variant !== 'small' ? `<p class="article-summary">${escapeHtml(article.summary)}</p>` : ''}
                    <div class="article-meta">
                        <div class="article-author">
                            <div class="author-avatar">
                                <img src="${authorAvatar}" alt="${escapeHtml(article.author.name)}" loading="lazy">
                            </div>
                            <span class="author-name">${escapeHtml(article.author.name)}</span>
                        </div>
                        <div>
                            <span class="article-date">${formatDate(article.publishedAt)}</span>
                            <span class="reading-time">${formatReadingTime(article.readingTime)}</span>
                        </div>
                    </div>
                </div>
            </a>
        </article>
    `;
}

/**
 * Section block template
 */
export function sectionBlockTemplate(sectionKey, sectionData) {
    if (!sectionData || !sectionData.items || sectionData.items.length === 0) {
        return '';
    }
    
    const title = sectionData.title || sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
    const isSponsored = sectionData.sponsored || false;
    const sponsoredClass = isSponsored ? ' sponsored' : '';
    
    const mainArticle = sectionData.items[0];
    const secondaryArticles = sectionData.items.slice(1, 5);
    
    return `
        <section class="section-block">
            <header class="section-header">
                <h2 class="section-title${sponsoredClass}">${escapeHtml(title)}</h2>
                <div class="section-actions">
                    ${isSponsored ? '<span class="sponsored-label">Sponsored</span>' : ''}
                    <a href="/section.html?section=${encodeURIComponent(sectionKey)}" class="view-more-btn">
                        View More
                    </a>
                </div>
            </header>
            <div class="section-content">
                <div class="section-main">
                    ${articleCardTemplate(mainArticle, 'large')}
                </div>
                <div class="section-secondary">
                    ${secondaryArticles.map(article => articleCardTemplate(article, 'small')).join('')}
                </div>
            </div>
        </section>
    `;
}

/**
 * Trending articles template
 */
export function trendingTemplate(articles) {
    if (!articles || articles.length === 0) {
        return '<p class="trending-empty">No trending articles available</p>';
    }
    
    return `
        <ul class="trending-list">
            ${articles.map((article, index) => `
                <li class="trending-item">
                    <span class="trending-number">${index + 1}</span>
                    <div class="trending-content">
                        <h4>
                            <a href="/article.html?slug=${encodeURIComponent(article.slug)}">
                                ${escapeHtml(article.title)}
                            </a>
                        </h4>
                        <div class="trending-meta">
                            ${escapeHtml(article.section)} • ${formatDate(article.publishedAt)}
                        </div>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}

/**
 * Search results template
 */
export function searchResultsTemplate(results, query) {
    if (!results || results.length === 0) {
        return `
            <div class="search-no-results">
                <p>No results found for "${escapeHtml(query)}"</p>
                <p>Try different keywords or check your spelling.</p>
            </div>
        `;
    }
    
    return `
        <div class="search-results-header">
            <p>${results.length} result${results.length !== 1 ? 's' : ''} found for "${escapeHtml(query)}"</p>
        </div>
        ${results.map(article => searchResultTemplate(article)).join('')}
    `;
}

/**
 * Individual search result template
 */
function searchResultTemplate(article) {
    const imageSrc = article.images?.lead?.sources?.[0]?.url || '/assets/images/placeholder.jpg';
    const imageAlt = escapeHtml(article.images?.lead?.alt || article.title);
    
    return `
        <div class="search-result" onclick="window.location.href='/article.html?slug=${encodeURIComponent(article.slug)}'">
            <div class="search-result-image">
                <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
            </div>
            <div class="search-result-content">
                <h4>${escapeHtml(article.title)}</h4>
                <p>${escapeHtml(article.summary.substring(0, 120))}...</p>
                <div class="search-result-meta">
                    ${escapeHtml(article.section)} • ${escapeHtml(article.author.name)} • ${formatDate(article.publishedAt)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Breaking news ticker template
 */
export function breakingNewsTemplate(articles) {
    if (!articles || articles.length === 0) {
        return '';
    }
    
    const breakingArticles = articles.filter(article => 
        article.featured && 
        new Date(article.publishedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).slice(0, 3);
    
    if (breakingArticles.length === 0) {
        return '';
    }
    
    return breakingArticles.map(article => `
        <span class="ticker-item">
            <a href="/article.html?slug=${encodeURIComponent(article.slug)}">
                ${escapeHtml(article.title)}
            </a>
        </span>
    `).join('');
}

/**
 * Article page template parts
 */
export function articleHeaderTemplate(article) {
    const categoryClass = article.sponsored ? 'sponsored' : '';
    
    return `
        <div class="article-breadcrumb">
            <a href="/" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">›</span>
            <a href="/section.html?section=${encodeURIComponent(article.section)}" class="breadcrumb-link">
                ${escapeHtml(article.section)}
            </a>
            <span class="breadcrumb-separator">›</span>
            <span>${escapeHtml(article.title)}</span>
        </div>
        
        <span class="article-category-badge ${categoryClass}">
            ${escapeHtml(article.section)}
        </span>
        
        <h1 class="article-headline">${escapeHtml(article.title)}</h1>
        
        ${article.subtitle ? `<p class="article-subtitle">${escapeHtml(article.subtitle)}</p>` : ''}
    `;
}

/**
 * Article byline template
 */
export function articleBylineTemplate(article) {
    const authorAvatar = article.author.avatar || '/assets/authors/default.jpg';
    
    return `
        <div class="byline-author">
            <div class="author-avatar-large">
                <img src="${authorAvatar}" alt="${escapeHtml(article.author.name)}" loading="lazy">
            </div>
            <div class="author-info">
                <h4>${escapeHtml(article.author.name)}</h4>
                ${article.author.bio ? `<p>${escapeHtml(article.author.bio)}</p>` : ''}
            </div>
        </div>
        
        <div class="article-timestamp">
            <span class="publish-date">${formatDate(article.publishedAt)}</span>
            ${article.updatedAt && article.updatedAt !== article.publishedAt ? 
                `<span class="update-date">Updated: ${formatDate(article.updatedAt)}</span>` : ''
            }
            <span class="reading-time-badge">${formatReadingTime(article.readingTime)}</span>
        </div>
    `;
}

/**
 * Article tags template
 */
export function articleTagsTemplate(tags) {
    if (!tags || tags.length === 0) {
        return '';
    }
    
    return `
        <div class="article-tags">
            <h3>Tags</h3>
            <div class="tags-list">
                ${tags.map(tag => `
                    <a href="/search.html?q=${encodeURIComponent(tag)}" class="tag">
                        ${escapeHtml(tag)}
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Share buttons template
 */
export function shareButtonsTemplate(article, currentUrl) {
    const shareUrl = encodeURIComponent(currentUrl);
    const shareTitle = encodeURIComponent(article.title);
    const shareText = encodeURIComponent(article.summary);
    
    return `
        <div class="share-section">
            <h3>Share this article</h3>
            <div class="share-buttons">
                <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="share-btn twitter">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                    </svg>
                    Twitter
                </a>
                
                <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="share-btn facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                    </svg>
                    Facebook
                </a>
                
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="share-btn linkedin">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                        <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                    LinkedIn
                </a>
            </div>
        </div>
    `;
}

/**
 * Related articles template
 */
export function relatedArticlesTemplate(articles) {
    if (!articles || articles.length === 0) {
        return '';
    }
    
    return `
        <section class="related-articles">
            <h3>Related Articles</h3>
            <div class="related-grid">
                ${articles.map(article => articleCardTemplate(article, 'medium')).join('')}
            </div>
        </section>
    `;
}

/**
 * Error template
 */
export function errorTemplate(title, message) {
    return `
        <div class="error-container">
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(message)}</p>
            <a href="/" class="btn btn-primary">Go Home</a>
        </div>
    `;
}

/**
 * Loading template
 */
export function loadingTemplate(message = 'Loading...') {
    return `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}