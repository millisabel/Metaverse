// Import components
import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initStars } from './components/stars';
import { initRoadmap } from './components/roadmap';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initNavbar();
    initSlider();
    initStars();
    initRoadmap();
});

