/**
 * Main Application Module
 * Bootstraps the homepage and handles global functionality
 */

import dataLoader from './loader.js';
import { renderHomepage, renderSearchModal } from './renderers.js';
import { initSearch } from './search.js';

class NewsApp {
    constructor() {
        this.newsData = null;
        this.isLoading = false;
        this.searchModal = null;
        this.mobileMenuOpen = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading(true);
            
            // Load news data
            this.newsData = await dataLoader.loadNewsData();
            
            // Render homepage
            await this.renderPage();
            
            // Initialize features
            this.initializeFeatures();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load news data. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render the homepage
     */
    async renderPage() {
        try {
            await renderHomepage(this.newsData);
            
            // Update breaking news ticker
            this.updateBreakingNews();
            
        } catch (error) {
            console.error('Failed to render page:', error);
            throw error;
        }
    }

    /**
     * Initialize all application features
     */
    initializeFeatures() {
        this.initializeNavigation();
        this.initializeSearch();
        this.initializeTrending();
        this.initializeNewsletter();
        this.initializeAnalytics();
        this.initializeServiceWorker();
    }

    /**
     * Initialize navigation functionality
     */
    initializeNavigation() {
        // Mobile menu toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                this.mobileMenuOpen = !this.mobileMenuOpen;
                navToggle.setAttribute('aria-expanded', this.mobileMenuOpen);
                navMenu.classList.toggle('active', this.mobileMenuOpen);
            });

            // Close mobile menu when clicking on links
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    this.mobileMenuOpen = false;
                    navToggle.setAttribute('aria-expanded', false);
                    navMenu.classList.remove('active');
                }
            });

            // Close mobile menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.mobileMenuOpen) {
                    this.mobileMenuOpen = false;
                    navToggle.setAttribute('aria-expanded', false);
                    navMenu.classList.remove('active');
                }
            });
        }

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').slice(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    /**
     * Initialize search functionality
     */
    initializeSearch() {
        const searchInput = document.querySelector('#search-input');
        const searchBtn = document.querySelector('.search-btn');
        const modalSearchInput = document.querySelector('#modal-search-input');
        
        // Initialize search modal
        renderSearchModal();
        this.searchModal = document.querySelector('#search-modal');
        
        // Search button click
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSearchModal();
            });
        }

        // Header search input
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });

            searchInput.addEventListener('focus', () => {
                this.openSearchModal();
            });
        }

        // Initialize main search functionality
        initSearch();
    }

    /**
     * Initialize trending section functionality
     */
    initializeTrending() {
        const trendingFilters = document.querySelectorAll('.filter-btn');
        
        trendingFilters.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Update active state
                trendingFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Get period and update trending content
                const period = btn.dataset.period;
                await this.updateTrending(period);
            });
        });
    }

    /**
     * Initialize newsletter signup
     */
    initializeNewsletter() {
        const newsletterForm = document.querySelector('#newsletter-form');
        
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const emailInput = newsletterForm.querySelector('input[type="email"]');
                const email = emailInput.value.trim();
                
                if (!email) {
                    this.showNotification('Please enter your email address.', 'error');
                    return;
                }

                if (!this.isValidEmail(email)) {
                    this.showNotification('Please enter a valid email address.', 'error');
                    return;
                }

                // In a real app, this would submit to a newsletter service
                // For demo purposes, just show success message
                this.submitNewsletterSignup(email);
            });
        }
    }

    /**
     * Initialize analytics (placeholder)
     */
    initializeAnalytics() {
        // Placeholder for analytics initialization
        // In production, you would initialize Google Analytics, etc.
        console.log('Analytics initialized');
        
        // Track page view
        this.trackPageView(window.location.pathname);
    }

    /**
     * Initialize service worker for PWA functionality
     */
    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    /**
     * Open search modal
     */
    openSearchModal() {
        if (this.searchModal) {
            this.searchModal.classList.add('active');
            const modalInput = this.searchModal.querySelector('#modal-search-input');
            if (modalInput) {
                setTimeout(() => modalInput.focus(), 100);
            }
        }
    }

    /**
     * Close search modal
     */
    closeSearchModal() {
        if (this.searchModal) {
            this.searchModal.classList.remove('active');
        }
    }

    /**
     * Update breaking news ticker
     */
    updateBreakingNews() {
        const tickerContent = document.querySelector('#ticker-content');
        if (!tickerContent || !this.newsData) return;

        // Get latest featured articles for breaking news
        const breakingNews = [];
        
        Object.keys(this.newsData).forEach(sectionKey => {
            if (sectionKey === 'meta') return;
            
            const section = this.newsData[sectionKey];
            if (section.items) {
                const recentFeatured = section.items.filter(article => {
                    const publishDate = new Date(article.publishedAt);
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return article.featured && publishDate > oneDayAgo;
                });
                breakingNews.push(...recentFeatured);
            }
        });

        if (breakingNews.length > 0) {
            // Sort by publish date and take top 3
            const sortedNews = breakingNews
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, 3);

            tickerContent.innerHTML = sortedNews.map(article => `
                <span class="ticker-item">
                    <a href="/article.html?slug=${encodeURIComponent(article.slug)}">
                        ${article.title}
                    </a>
                </span>
            `).join('');
        } else {
            // Hide breaking news bar if no recent featured articles
            const breakingNewsBar = document.querySelector('.breaking-news');
            if (breakingNewsBar) {
                breakingNewsBar.style.display = 'none';
            }
        }
    }

    /**
     * Update trending articles
     */
    async updateTrending(period = '24h') {
        try {
            const trendingArticles = await dataLoader.getTrendingArticles(period);
            const trendingContent = document.querySelector('#trending-content');
            
            if (trendingContent && trendingArticles) {
                const { trendingTemplate } = await import('./templates.js');
                trendingContent.innerHTML = trendingTemplate(trendingArticles);
            }
        } catch (error) {
            console.error('Failed to update trending articles:', error);
        }
    }

    /**
     * Submit newsletter signup
     */
    async submitNewsletterSignup(email) {
        try {
            // In production, this would make an API call to your newsletter service
            // For now, simulate the request
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showNotification('Successfully subscribed to our newsletter!', 'success');
            
            // Clear the form
            const emailInput = document.querySelector('#newsletter-form input[type="email"]');
            if (emailInput) {
                emailInput.value = '';
            }
            
            // Track the subscription
            this.trackEvent('newsletter', 'subscribe', email);
            
        } catch (error) {
            console.error('Newsletter signup failed:', error);
            this.showNotification('Failed to subscribe. Please try again.', 'error');
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(show = true) {
        this.isLoading = show;
        const loadingIndicator = document.querySelector('#loading-indicator');
        
        if (loadingIndicator) {
            loadingIndicator.classList.toggle('show', show);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container">
                    <h1>Something went wrong</h1>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Validate email address
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Track page view (placeholder)
     */
    trackPageView(path) {
        // In production, send to your analytics service
        console.log('Page view:', path);
    }

    /**
     * Track event (placeholder)
     */
    trackEvent(category, action, label) {
        // In production, send to your analytics service
        console.log('Event:', { category, action, label });
    }

    /**
     * Get app state for debugging
     */
    getAppState() {
        return {
            isLoading: this.isLoading,
            mobileMenuOpen: this.mobileMenuOpen,
            newsDataLoaded: !!this.newsData,
            cacheStats: dataLoader.getCacheStats()
        };
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.newsApp = new NewsApp();
    });
} else {
    window.newsApp = new NewsApp();
}

// Export for module usage
export default NewsApp;
