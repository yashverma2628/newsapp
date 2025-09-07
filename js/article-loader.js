/**
 * Article Page Loader
 * Handles loading and rendering of individual article pages
 */

import dataLoader from './loader.js';
import { renderArticlePage, renderSearchModal } from './renderers.js';
import { initSearch } from './search.js';

class ArticlePageLoader {
    constructor() {
        this.article = null;
        this.relatedArticles = [];
        this.slug = null;
        
        this.init();
    }

    /**
     * Initialize the article page
     */
    async init() {
        try {
            // Get slug from URL parameters
            this.slug = this.getSlugFromUrl();
            
            if (!this.slug) {
                this.showError('No article specified');
                return;
            }

            this.showLoading(true);
            
            // Load article data
            await this.loadArticle();
            
            if (!this.article) {
                this.showError('Article not found');
                return;
            }

            // Load related articles
            await this.loadRelatedArticles();
            
            // Render the article page
            await this.renderPage();
            
            // Initialize page features
            this.initializeFeatures();
            
        } catch (error) {
            console.error('Failed to initialize article page:', error);
            this.showError('Failed to load article');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Get article slug from URL parameters
     * @returns {string|null} - Article slug
     */
    getSlugFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    }

    /**
     * Load article data
     */
    async loadArticle() {
        try {
            this.article = await dataLoader.getArticleBySlug(this.slug);
            
            if (!this.article) {
                console.warn(`Article not found for slug: ${this.slug}`);
                return;
            }

            console.log('Article loaded:', this.article.title);
            
        } catch (error) {
            console.error('Failed to load article:', error);
            throw error;
        }
    }

    /**
     * Load related articles
     */
    async loadRelatedArticles() {
        if (!this.article) return;
        
        try {
            this.relatedArticles = await dataLoader.getRelatedArticles(this.article, 3);
            console.log(`Loaded ${this.relatedArticles.length} related articles`);
            
        } catch (error) {
            console.error('Failed to load related articles:', error);
            // Don't throw - related articles are not critical
        }
    }

    /**
     * Render the article page
     */
    async renderPage() {
        try {
            await renderArticlePage(this.article, this.relatedArticles);
            
            // Handle sponsored content
            if (this.article.sponsored) {
                this.showSponsoredDisclaimer();
                document.body.classList.add('sponsored-article');
            }
            
            // Update browser history
            this.updateBrowserHistory();
            
        } catch (error) {
            console.error('Failed to render article page:', error);
            throw error;
        }
    }

    /**
     * Initialize page features
     */
    initializeFeatures() {
        this.initializeNavigation();
        this.initializeSearch();
        this.initializeSharing();
        this.initializeTracking();
        this.initializeAccessibility();
        this.initializePrintStyles();
    }

    /**
     * Initialize navigation
     */
    initializeNavigation() {
        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.contains('active');
                navToggle.setAttribute('aria-expanded', !isOpen);
                navMenu.classList.toggle('active');
            });

            // Close on link click
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    navToggle.setAttribute('aria-expanded', false);
                    navMenu.classList.remove('active');
                }
            });
        }

        // Back to top functionality
        this.initializeBackToTop();
    }

    /**
     * Initialize back to top button
     */
    initializeBackToTop() {
        const backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        
        document.body.appendChild(backToTop);
        
        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const shouldShow = scrolled > 300;
            
            backToTop.style.opacity = shouldShow ? '1' : '0';
            backToTop.style.visibility = shouldShow ? 'visible' : 'hidden';
        });
        
        // Scroll to top on click
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Initialize search functionality
     */
    initializeSearch() {
        renderSearchModal();
        initSearch();
        
        const searchBtn = document.querySelector('.search-btn');
        const searchInput = document.querySelector('#search-input');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSearchModal();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                this.openSearchModal();
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }
    }

    /**
     * Open search modal
     */
    openSearchModal() {
        const searchModal = document.querySelector('#search-modal');
        if (searchModal) {
            searchModal.classList.add('active');
            const modalInput = searchModal.querySelector('#modal-search-input');
            if (modalInput) {
                setTimeout(() => modalInput.focus(), 100);
            }
        }
    }

    /**
     * Initialize sharing functionality
     */
    initializeSharing() {
        // Add Web Share API support if available
        if (navigator.share) {
            this.addNativeShareButton();
        }
        
        // Copy link functionality
        this.addCopyLinkButton();
        
        // Track social shares
        this.trackSocialShares();
    }

    /**
     * Add native share button
     */
    addNativeShareButton() {
        const shareSection = document.querySelector('.share-section');
        if (!shareSection) return;
        
        const nativeShareBtn = document.createElement('button');
        nativeShareBtn.className = 'share-btn native-share';
        nativeShareBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Share
        `;
        
        nativeShareBtn.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: this.article.title,
                    text: this.article.summary,
                    url: window.location.href
                });
                
                this.trackEvent('article', 'native_share', this.article.slug);
            } catch (error) {
                console.log('Native share failed:', error);
            }
        });
        
        const shareButtons = shareSection.querySelector('.share-buttons');
        if (shareButtons) {
            shareButtons.insertBefore(nativeShareBtn, shareButtons.firstChild);
        }
    }

    /**
     * Add copy link button
     */
    addCopyLinkButton() {
        const shareSection = document.querySelector('.share-section');
        if (!shareSection) return;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'share-btn copy-link';
        copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Copy Link
        `;
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    Copied!
                `;
                
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Copy Link
                    `;
                }, 2000);
                
                this.trackEvent('article', 'copy_link', this.article.slug);
            } catch (error) {
                console.error('Failed to copy link:', error);
            }
        });
        
        const shareButtons = shareSection.querySelector('.share-buttons');
        if (shareButtons) {
            shareButtons.appendChild(copyBtn);
        }
    }

    /**
     * Track social shares
     */
    trackSocialShares() {
        const shareButtons = document.querySelectorAll('.share-btn');
        
        shareButtons.forEach(button => {
            if (button.classList.contains('twitter')) {
                button.addEventListener('click', () => {
                    this.trackEvent('article', 'share_twitter', this.article.slug);
                });
            } else if (button.classList.contains('facebook')) {
                button.addEventListener('click', () => {
                    this.trackEvent('article', 'share_facebook', this.article.slug);
                });
            } else if (button.classList.contains('linkedin')) {
                button.addEventListener('click', () => {
                    this.trackEvent('article', 'share_linkedin', this.article.slug);
                });
            }
        });
    }

    /**
     * Initialize tracking
     */
    initializeTracking() {
        // Track page view
        this.trackPageView();
        
        // Track reading progress
        this.initializeReadingTracking();
        
        // Track time spent
        this.initializeTimeTracking();
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.trackEvent('article', 'view', this.article.slug);
        
        // Track article metadata
        this.trackEvent('article', 'section', this.article.section);
        
        if (this.article.author) {
            this.trackEvent('article', 'author', this.article.author.name);
        }
        
        if (this.article.sponsored) {
            this.trackEvent('article', 'sponsored_view', this.article.slug);
        }
    }

    /**
     * Initialize reading progress tracking
     */
    initializeReadingTracking() {
        const milestones = [25, 50, 75, 100];
        const tracked = new Set();
        
        const trackProgress = () => {
            const article = document.querySelector('.article-body');
            if (!article) return;
            
            const rect = article.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const articleHeight = rect.height;
            const scrolled = Math.max(0, -rect.top);
            const progress = Math.min(100, (scrolled / (articleHeight - windowHeight)) * 100);
            
            milestones.forEach(milestone => {
                if (progress >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    this.trackEvent('article', 'read_progress', `${milestone}%`);
                }
            });
        };
        
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    trackProgress();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /**
     * Initialize time tracking
     */
    initializeTimeTracking() {
        const startTime = Date.now();
        let isActive = true;
        
        // Track when user becomes inactive
        let inactiveTimer;
        const resetInactiveTimer = () => {
            clearTimeout(inactiveTimer);
            isActive = true;
            inactiveTimer = setTimeout(() => {
                isActive = false;
            }, 30000); // 30 seconds of inactivity
        };
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetInactiveTimer, true);
        });
        
        resetInactiveTimer();
        
        // Track time on page when leaving
        window.addEventListener('beforeunload', () => {
            if (isActive) {
                const timeSpent = Math.round((Date.now() - startTime) / 1000);
                this.trackEvent('article', 'time_spent', timeSpent.toString());
            }
        });
    }

    /**
     * Initialize accessibility features
     */
    initializeAccessibility() {
        // Add skip links for screen readers
        this.addSkipLinks();
        
        // Improve focus management
        this.improveFocusManagement();
        
        // Add keyboard navigation
        this.addKeyboardNavigation();
        
        // Announce page changes to screen readers
        this.announcePageLoad();
    }

    /**
     * Add skip links
     */
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#article-content" class="skip-link">Skip to article content</a>
            <a href="#article-footer" class="skip-link">Skip to article footer</a>
            <a href=".site-footer" class="skip-link">Skip to site footer</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    /**
     * Improve focus management
     */
    improveFocusManagement() {
        // Ensure all interactive elements are focusable
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select');
        
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.tabIndex === -1) {
                element.tabIndex = 0;
            }
        });
        
        // Add focus indicators
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add keyboard navigation
     */
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Navigate with arrow keys in article
            if (e.target.closest('.article-body')) {
                if (e.key === 'ArrowUp' && e.ctrlKey) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (e.key === 'ArrowDown' && e.ctrlKey) {
                    e.preventDefault();
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }
            }
        });
    }

    /**
     * Announce page load to screen readers
     */
    announcePageLoad() {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Article loaded: ${this.article.title}`;
        
        document.body.appendChild(announcement);
        
        // Remove announcement after it's been read
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Initialize print styles
     */
    initializePrintStyles() {
        // Add print button
        this.addPrintButton();
        
        // Optimize content for printing
        this.optimizeForPrint();
    }

    /**
     * Add print button
     */
    addPrintButton() {
        const shareSection = document.querySelector('.share-section');
        if (!shareSection) return;
        
        const printBtn = document.createElement('button');
        printBtn.className = 'share-btn print-btn';
        printBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="6,9 6,2 18,2 18,9"></polyline>
                <path d="M6,18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2H20a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H18"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
        `;
        
        printBtn.addEventListener('click', () => {
            window.print();
            this.trackEvent('article', 'print', this.article.slug);
        });
        
        const shareButtons = shareSection.querySelector('.share-buttons');
        if (shareButtons) {
            shareButtons.appendChild(printBtn);
        }
    }

    /**
     * Optimize content for print
     */
    optimizeForPrint() {
        // Add print-specific styles
        const printStyles = document.createElement('style');
        printStyles.textContent = `
            @media print {
                .article-sidebar { display: none !important; }
                .site-header, .site-footer { display: none !important; }
                .share-section { display: none !important; }
                .reading-progress { display: none !important; }
                .back-to-top { display: none !important; }
                
                .article-container {
                    max-width: none !important;
                    grid-template-columns: 1fr !important;
                    padding: 0 !important;
                }
                
                .article-body {
                    font-size: 12pt !important;
                    line-height: 1.5 !important;
                }
                
                .article-lead-image img {
                    max-height: 300px !important;
                    object-fit: contain !important;
                }
                
                a::after {
                    content: " (" attr(href) ")";
                    font-size: 10pt;
                    color: #666;
                }
                
                .article-header::after {
                    content: "Source: " attr(data-url);
                    display: block;
                    font-size: 10pt;
                    margin-top: 20px;
                    color: #666;
                }
            }
        `;
        document.head.appendChild(printStyles);
        
        // Add source URL for print
        const articleHeader = document.querySelector('.article-header');
        if (articleHeader) {
            articleHeader.setAttribute('data-url', window.location.href);
        }
    }

    /**
     * Show sponsored disclaimer
     */
    showSponsoredDisclaimer() {
        const disclaimer = document.querySelector('#sponsored-disclaimer');
        if (disclaimer) {
            disclaimer.style.display = 'block';
        }
    }

    /**
     * Update browser history
     */
    updateBrowserHistory() {
        const newTitle = `${this.article.title} | NewsHub`;
        const newUrl = `/article.html?slug=${encodeURIComponent(this.article.slug)}`;
        
        // Update title
        document.title = newTitle;
        
        // Update canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = window.location.origin + newUrl;
        }
        
        // Replace state if URL doesn't match
        if (window.location.pathname + window.location.search !== newUrl) {
            window.history.replaceState(
                { article: this.article.slug },
                newTitle,
                newUrl
            );
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(show = true) {
        const loadingIndicator = document.querySelector('#loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.classList.toggle('show', show);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showLoading(false);
        
        const errorDiv = document.querySelector('#article-error');
        const articleMain = document.querySelector('.article-main');
        
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.querySelector('p').textContent = message;
        }
        
        if (articleMain) {
            articleMain.style.display = 'none';
        }
        
        // Update page title
        document.title = 'Article Not Found | NewsHub';
        
        // Track error
        this.trackEvent('article', 'error', message);
    }

    /**
     * Track event (placeholder for analytics)
     */
    trackEvent(category, action, label) {
        // In production, send to your analytics service
        console.log('Event:', { category, action, label, article: this.article?.slug });
    }
}

// Initialize article page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.articleLoader = new ArticlePageLoader();
    });
} else {
    window.articleLoader = new ArticlePageLoader();
}

// Export for module usage
export default ArticlePageLoader;
