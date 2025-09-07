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
            const shoul