// Import Bootstrap components
import { Carousel } from 'bootstrap';

// About carousel initialization
document.addEventListener('DOMContentLoaded', function() {
    const aboutCarousel = document.getElementById('aboutCarousel');
    if (aboutCarousel) {
        // Bootstrap requires manual initialization in v5
        const carousel = new Carousel(aboutCarousel, {
            interval: 5000,
            wrap: true,
            touch: true
        });
        
        // Create and add chapter indicator
        const chapterElement = document.createElement('div');
        chapterElement.className = 'chapter-indicator mt-3 d-flex align-items-center';
        chapterElement.innerHTML = '<span class="me-2">CHAPTER</span><span class="chapter-number fs-4 fw-bold text-primary me-1">1</span><span class="me-2">/</span><span class="total-chapters">3</span>';
        aboutCarousel.appendChild(chapterElement);
        
        // Update chapter number on slide change
        aboutCarousel.addEventListener('slide.bs.carousel', function(event) {
            console.log('Slide event detected', event);
            const chapterNumber = aboutCarousel.querySelector('.chapter-number');
            if (chapterNumber) {
                chapterNumber.textContent = event.to + 1;
            }
        });
    } else {
        console.error('Carousel element not found!');
    }
});