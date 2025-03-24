// Import Bootstrap components
import { Carousel } from 'bootstrap';

// Carousel configuration
const CAROUSEL_CONFIG = {
    interval: 5000,
    wrap: true,
    touch: true
};

// Chapter indicator template
const CHAPTER_TEMPLATE = {
    wrapper: {
        className: 'chapter-indicator d-flex align-items-center',
        innerHTML: `
            <span class="me-2">CHAPTER</span>
            <span class="chapter-number fs-4 fw-bold me-1">1</span>
            <span class="me-2">/</span>
            <span class="total-chapters">3</span>
        `
    }
};

// About carousel initialization
document.addEventListener('DOMContentLoaded', function() {
    const aboutCarousel = document.getElementById('aboutCarousel');
    
    if (!aboutCarousel) {
        console.error('Carousel element not found!');
        return;
    }

    try {
        // Initialize Bootstrap carousel
        const carousel = new Carousel(aboutCarousel, CAROUSEL_CONFIG);
        
        // Create and add chapter indicator
        const chapterElement = document.createElement('div');
        chapterElement.className = CHAPTER_TEMPLATE.wrapper.className;
        chapterElement.innerHTML = CHAPTER_TEMPLATE.wrapper.innerHTML;
        
        // Insert chapter indicator as first element in carousel-controls
        const carouselControls = aboutCarousel.querySelector('.carousel-controls');
        if (!carouselControls) {
            console.error('Carousel controls not found!');
            return;
        }
        
        carouselControls.insertBefore(chapterElement, carouselControls.firstChild);
        
        // Update chapter number on slide change
        aboutCarousel.addEventListener('slide.bs.carousel', function(event) {
            const chapterNumber = aboutCarousel.querySelector('.chapter-number');
            if (chapterNumber) {
                chapterNumber.textContent = event.to + 1;
            }
        });
    } catch (error) {
        console.error('Error initializing carousel:', error);
    }
});