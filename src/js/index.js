// Import components
import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initStars } from './components/stars';
import { initRoadmap } from './components/roadmap';
import { initDynamics3D } from './components/dynamics3d';
import { initSocialCards } from './components/socialCards';
import { initAllAnimations } from './utils/animationObserver';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all animations
    const animationObservers = initAllAnimations();

    // Initialize components
    initNavbar();
    initSlider();
    initStars();
    initRoadmap();
    initDynamics3D();
    initSocialCards();
});

