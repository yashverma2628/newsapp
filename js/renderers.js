/**
 * Renderers Module
 * Handles rendering of different page components and sections
 */

import { 
    heroTemplate, 
    sectionBlockTemplate, 
    trendingTemplate,
    breakingNewsTemplate,
    loadingTemplate,
    errorTemplate
} from './templates.js';

/**
 * Render the homepage with all sections
 * @param {Object} newsData - Complete news data object
 */
export async function renderHomepage(newsData) {
    try {
        if (!newsData) {
            throw new Error('No news data provided');
        }

        // Render hero section
        await renderHeroSection(newsData.hero);
        
        // Render main content sections
        await renderMainSections(newsData);
        
        // Render sidebar content
        await renderSidebar(newsData);
        
        // Update page metadata
        updatePageMetadata(newsData.meta);
        
    } catch (error) {
        console.error('Error rendering homepage:', error);
        showHomepageError(error.message);
    }
}

/**
 * Render hero section
 * @param {Object} heroData - Hero section data
 */
async function renderHeroSection(heroData) {
    const heroSection = document.querySelector('#hero-section');
    
    if (!heroSection) {
        console.warn('Hero section element not found');
        return;
    }

    if (!heroData || !heroData.items || heroData.items.length === 0) {
        heroSection.innerHTML = '<div class="hero-placeholder">No featured stories available</div>';
        return;
    }

    try {
        heroSection.innerHTML = heroTemplate(heroData);
        
        // Add intersection observer for lazy loading
        addIntersectionObserver(heroSection);
        
    } catch (error) {
        console.error('Error rendering hero section:', error);
        heroSection.innerHTML = '<div class="hero-error">Unable to load featured stories</div>';
    }
}

/**
 * Render main content sections
 * @param {Object} newsData - Complete news data
 */
async function renderMainSections(newsData) {
    const sectionsContainer = document.querySelector('#sections-container');
    
    if (!sectionsContainer) {
        console.warn('Sections container not found');
        return;
    }

    try {
        const sectionsToRender = [
            'geopolitics', 'business', 'technology', 'sports', 
            'entertainment', 'lifestyle', 'opinion', 'local', 'brands'
        ];
        
        let sectionsHtml = '';
        
        for (const sectionKey of sectionsToRender) {
            const sectionData = newsData[sectionKey];
            
            if (sectionData && sectionData.items && sectionData.items.length > 0) {
                sectionsHtml += sectionBlockTemplate(sectionKey, sectionData);
            }
        }
        
        sectionsContainer.innerHTML = sectionsHtml;
        
        // Add intersection observers for lazy loading
        addIntersectionObserver(sectionsContainer);
        
        // Add click handlers for section links
        addSectionClickHandlers(sectionsContainer);
        
    } catch (error) {
        console.error('Error rendering main sections:', error);
        sectionsContainer.innerHTML = '<div class="sections-error">Unable to load news sections</div>';
    }
}

/**
 * Render sidebar content
 * @param {Object} newsData - Complete news data
 */
async function renderSidebar(newsData) {
    // Render trending section
    await renderTrendingSection(newsData);
    
    // Initialize newsletter form
    initializeNewsletterForm();
}

/**
 * Render trending section
 * @param {Object} newsData - Complete news data
 */
async function renderTrendingSection(newsData) {
    const trendingContent = document.querySelector('#trending-content');
    
    if (!trendingContent) {
        console.warn('Trending content element not found');
        return;
    }

    try {
        let trendingArticles = [];
        
        // Use dedicated trending section if available
        if (newsData.trending && newsData.trending.items) {
            trendingArticles = newsData.trending.items;
        } else {
            // Fallback: collect featured articles from all sections
            Object.keys(newsData).forEach(sectionKey => {
                if (sectionKey === 'meta') return;
                
                const section = newsData[sectionKey];
                if (section.items) {
                    const featured = section.items.filter(article => article.featured);
                    trendingArticles.push(...featured);
                }
            });
            
            // Sort by publish date and take top 5
            trendingArticles = trendingArticles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, 5);
        }
        
        trendingContent.innerHTML = trendingTemplate(trendingArticles);
        
    } catch (error) {
        console.error('Error rendering trending section:', error);
        trendingContent.innerHTML = '<div class="trending-error">Unable to load trending articles</div>';
    }
}

/**
 * Render search modal
 */
export function renderSearchModal() {
    const existingModal = document.querySelector('#search-modal');
    if (existingModal) return; // Already rendered
    
    const modalHtml = `
        <div class="search-modal" id="search-modal">
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <input type="search" id="modal-search-input" placeholder="Search news..." aria-label="Search news">
                    <button class="search-modal-close" aria-label="Close search">&times;</button>
                </div>
                <div class="search-results" id="search-results">
                    <div class="search-placeholder">
                        <p>Start typing to search articles...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners
    const modal = document.querySelector('#search-modal');
    const closeBtn = modal.querySelector('.search-modal-close');
    
    // Close modal handlers
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

/**
 * Render article page
 * @param {Object} article - Article data
 * @param {Array} relatedArticles - Related articles
 */
export async function renderArticlePage(article, relatedArticles = []) {
    try {
        if (!article) {
            throw new Error('No article data provided');
        }

        // Update page title and meta tags
        updateArticleMetadata(article);
        
        // Render article header
        await renderArticleHeader(article);
        
        // Render article content
        await renderArticleContent(article);
        
        // Render article footer
        await renderArticleFooter(article, relatedArticles);
        
        // Initialize reading progress
        initializeReadingProgress();
        
        // Initialize table of contents
        initializeTableOfContents();
        
    } catch (error) {
        console.error('Error rendering article page:', error);
        showArticleError(error.message);
    }
}

/**
 * Render article header
 * @param {Object} article - Article data
 */
async function renderArticleHeader(article) {
    const articleHeader = document.querySelector('.article-header');
    
    if (!articleHeader) {
        console.warn('Article header element not found');
        return;
    }

    try {
        const { articleHeaderTemplate, articleBylineTemplate } = await import('./templates.js');
        
        articleHeader.innerHTML = articleHeaderTemplate(article);
        
        // Render byline
        const bylineContainer = document.querySelector('.article-byline');
        if (bylineContainer) {
            bylineContainer.innerHTML = articleBylineTemplate(article);
        }
        
        // Render lead image
        await renderLeadImage(article);
        
    } catch (error) {
        console.error('Error rendering article header:', error);
    }
}

/**
 * Render lead image
 * @param {Object} article - Article data
 */
async function renderLeadImage(article) {
    const leadImageContainer = document.querySelector('.article-lead-image');
    
    if (!leadImageContainer || !article.images?.lead) {
        return;
    }

    try {
        const imageData = article.images.lead;
        const imageSrc = imageData.sources?.[0]?.url || '/assets/images/placeholder.jpg';
        const imageAlt = imageData.alt || article.title;
        
        const { generateSrcset, generateSizes } = await import('./templates.js');
        
        leadImageContainer.innerHTML = `
            <img 
                src="${imageSrc}"
                srcset="${generateSrcset(imageData)}"
                sizes="${generateSizes('full')}"
                alt="${imageAlt}"
                loading="eager"
            >
            ${imageData.caption ? `
                <div class="image-caption">
                    ${imageData.caption}
                    ${imageData.credits ? `<div class="image-credits">Credit: ${imageData.credits}</div>` : ''}
                </div>
            ` : ''}
        `;
        
    } catch (error) {
        console.error('Error rendering lead image:', error);
    }
}

/**
 * Render article content
 * @param {Object} article - Article data
 */
async function renderArticleContent(article) {
    const articleBody = document.querySelector('.article-body');
    
    if (!articleBody) {
        console.warn('Article body element not found');
        return;
    }

    try {
        // Sanitize and render content
        let content = article.content || '';
        
        // Basic content processing
        content = processArticleContent(content, article);
        
        articleBody.innerHTML = content;
        
        // Process inline images
        await processInlineImages(articleBody, article);
        
        // Add reading time estimate to first paragraph
        addReadingTimeEstimate(articleBody, article.readingTime);
        
    } catch (error) {
        console.error('Error rendering article content:', error);
        articleBody.innerHTML = '<p>Unable to load article content.</p>';
    }
}

/**
 * Process article content for display
 * @param {string} content - Raw article content
 * @param {Object} article - Article data
 * @returns {string} - Processed content
 */
function processArticleContent(content, article) {
    // Add inline images if available
    if (article.images?.inline && Array.isArray(article.images.inline)) {
        article.images.inline.forEach((image, index) => {
            const placeholder = `[IMAGE_${index}]`;
            if (content.includes(placeholder)) {
                const imageHtml = `
                    <figure class="inline-image">
                        <img src="${image.url}" alt="${image.caption || 'Article image'}" loading="lazy">
                        ${image.caption ? `<figcaption class="inline-caption">${image.caption}</figcaption>` : ''}
                    </figure>
                `;
                content = content.replace(placeholder, imageHtml);
            }
        });
    }
    
    return content;
}

/**
 * Process inline images in article content
 * @param {HTMLElement} container - Article body container
 * @param {Object} article - Article data
 */
async function processInlineImages(container, article) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
        // Add lazy loading
        if (img.getAttribute('loading') !== 'eager') {
            img.setAttribute('loading', 'lazy');
        }
        
        // Add intersection observer for fade-in effect
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(img);
    });
}

/**
 * Add reading time estimate
 * @param {HTMLElement} container - Article body container
 * @param {number} readingTime - Reading time in minutes
 */
function addReadingTimeEstimate(container, readingTime) {
    const firstParagraph = container.querySelector('p');
    
    if (firstParagraph && readingTime) {
        const estimate = document.createElement('div');
        estimate.className = 'reading-estimate';
        estimate.innerHTML = `
            <small>
                <strong>Estimated reading time:</strong> ${Math.round(readingTime)} minute${readingTime !== 1 ? 's' : ''}
            </small>
        `;
        
        firstParagraph.insertAdjacentElement('afterend', estimate);
    }
}

/**
 * Render article footer
 * @param {Object} article - Article data
 * @param {Array} relatedArticles - Related articles
 */
async function renderArticleFooter(article, relatedArticles) {
    const articleFooter = document.querySelector('.article-footer');
    
    if (!articleFooter) {
        console.warn('Article footer element not found');
        return;
    }

    try {
        const { 
            articleTagsTemplate, 
            shareButtonsTemplate, 
            relatedArticlesTemplate 
        } = await import('./templates.js');
        
        let footerContent = '';
        
        // Tags
        if (article.tags && article.tags.length > 0) {
            footerContent += articleTagsTemplate(article.tags);
        }
        
        // Share buttons
        footerContent += shareButtonsTemplate(article, window.location.href);
        
        // Related articles
        if (relatedArticles && relatedArticles.length > 0) {
            footerContent += relatedArticlesTemplate(relatedArticles);
        }
        
        articleFooter.innerHTML = footerContent;
        
        // Initialize share functionality
        initializeShareButtons();
        
    } catch (error) {
        console.error('Error rendering article footer:', error);
    }
}

/**
 * Initialize reading progress indicator
 */
function initializeReadingProgress() {
    const progressBar = document.querySelector('.progress-bar');
    
    if (!progressBar) {
        // Create progress bar if it doesn't exist
        const progressContainer = document.createElement('div');
        progressContainer.className = 'reading-progress';
        progressContainer.innerHTML = '<div class="progress-bar"></div>';
        document.body.appendChild(progressContainer);
    }
    
    const updateProgress = () => {
        const article = document.querySelector('.article-body');
        if (!article) return;
        
        const rect = article.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const articleHeight = rect.height;
        const scrolled = Math.max(0, -rect.top);
        const progress = Math.min(100, (scrolled / (articleHeight - windowHeight)) * 100);
        
        const bar = document.querySelector('.progress-bar');
        if (bar) {
            bar.style.width = `${progress}%`;
        }
    };
    
    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
}

/**
 * Initialize table of contents
 */
function initializeTableOfContents() {
    const articleBody = document.querySelector('.article-body');
    const tocContainer = document.querySelector('.toc');
    
    if (!articleBody || !tocContainer) return;
    
    const headings = articleBody.querySelectorAll('h2, h3, h4');
    
    if (headings.length === 0) {
        tocContainer.style.display = 'none';
        return;
    }
    
    let tocHtml = '<ul>';
    
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent;
        
        tocHtml += `
            <li>
                <a href="#${id}" class="toc-${level}">${text}</a>
            </li>
        `;
    });
    
    tocHtml += '</ul>';
    tocContainer.innerHTML = tocHtml;
    
    // Add smooth scrolling and active state tracking
    const tocLinks = tocContainer.querySelectorAll('a');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update active TOC link on scroll
    const updateActiveTocLink = () => {
        const scrollPos = window.scrollY + 100;
        
        tocLinks.forEach(link => link.classList.remove('active'));
        
        for (let i = headings.length - 1; i >= 0; i--) {
            if (headings[i].offsetTop <= scrollPos) {
                const targetLink = tocContainer.querySelector(`a[href="#${headings[i].id}"]`);
                if (targetLink) {
                    targetLink.classList.add('active');
                }
                break;
            }
        }
    };
    
    window.addEventListener('scroll', updateActiveTocLink);
    updateActiveTocLink();
}

/**
 * Initialize share buttons functionality
 */
function initializeShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const url = button.getAttribute('href');
            
            // Open in popup window
            window.open(
                url,
                'share',
                'width=600,height=400,scrollbars=yes,resizable=yes'
            );
        });
    });
}

/**
 * Initialize newsletter form
 */
function initializeNewsletterForm() {
    const form = document.querySelector('#newsletter-form');
    
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = form.querySelector('input[type="email"]').value.trim();
        
        if (!email) {
            showNotification('Please enter your email address.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        
        // Simulate newsletter signup
        setTimeout(() => {
            showNotification('Thank you for subscribing!', 'success');
            form.reset();
        }, 1000);
    });
}

/**
 * Add intersection observer for lazy loading and animations
 * @param {HTMLElement} container - Container to observe
 */
function addIntersectionObserver(container) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                
                // Load lazy images
                const lazyImages = entry.target.querySelectorAll('img[loading="lazy"]');
                lazyImages.forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    const elements = container.querySelectorAll('.article-card, .hero-secondary, .section-block');
    elements.forEach(el => observer.observe(el));
}

/**
 * Add click handlers for section navigation
 * @param {HTMLElement} container - Sections container
 */
function addSectionClickHandlers(container) {
    const sectionLinks = container.querySelectorAll('.view-more-btn');
    
    sectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Track section view
            const section = link.closest('.section-block');
            if (section) {
                const sectionTitle = section.querySelector('.section-title')?.textContent;
                console.log('Section viewed:', sectionTitle);
            }
        });
    });
}

/**
 * Update page metadata
 * @param {Object} meta - Meta information
 */
function updatePageMetadata(meta) {
    if (meta?.lastUpdated) {
        const lastUpdated = new Date(meta.lastUpdated).toLocaleString();
        console.log('Content last updated:', lastUpdated);
    }
}

/**
 * Update article page metadata
 * @param {Object} article - Article data
 */
function updateArticleMetadata(article) {
    // Update page title
    document.title = `${article.title} | NewsHub`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', article.summary);
    }
    
    // Update Open Graph tags
    updateOpenGraphTags(article);
    
    // Add JSON-LD structured data
    addStructuredData(article);
}

/**
 * Update Open Graph meta tags
 * @param {Object} article - Article data
 */
function updateOpenGraphTags(article) {
    const ogTags = {
        'og:title': article.social?.ogTitle || article.title,
        'og:description': article.social?.ogDescription || article.summary,
        'og:type': 'article',
        'og:url': window.location.href,
        'og:image': article.images?.lead?.sources?.[0]?.url || '/assets/images/default-og.jpg'
    };
    
    Object.entries(ogTags).forEach(([property, content]) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    });
}

/**
 * Add JSON-LD structured data
 * @param {Object} article - Article data
 */
function addStructuredData(article) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.summary,
        "image": article.images?.lead?.sources?.[0]?.url,
        "author": {
            "@type": "Person",
            "name": article.author.name
        },
        "publisher": {
            "@type": "NewsMediaOrganization",
            "name": "NewsHub",
            "logo": {
                "@type": "ImageObject",
                "url": "/assets/images/logo.png"
            }
        },
        "datePublished": article.publishedAt,
        "dateModified": article.updatedAt || article.publishedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": window.location.href
        }
    };
    
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"][data-article]');
    if (existing) {
        existing.remove();
    }
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-article', 'true');
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
}

/**
 * Show homepage error
 * @param {string} message - Error message
 */
function showHomepageError(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = errorTemplate('Unable to Load News', message);
    }
}

/**
 * Show article error
 * @param {string} message - Error message
 */
function showArticleError(message) {
    const articleMain = document.querySelector('.article-main');
    if (articleMain) {
        articleMain.innerHTML = errorTemplate('Article Not Found', message);
    }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}