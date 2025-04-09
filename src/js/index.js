// Import components
import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initStars } from './components/stars';
import { initRoadmap } from './components/roadmap';
import { initDynamics3D } from './components/dynamics3d';
import { initSocialCards } from './components/socialCards';
import { initAllAnimations } from './utils/animationObserver';
import { GalacticCloud } from './components/galactic';
import initModal from './components/modal';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    // Initialize components
    initNavbar();
    initModal();
    initSlider();
    initRoadmap();
    initDynamics3D();
    initSocialCards();

    // Initialize all animations
    const animationObservers = initAllAnimations();
    
    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Initialize galactic background
    const homeSection = document.getElementById('hero');
    if (homeSection) {
        // Create container for galactic background
        const galacticContainer = document.createElement('div');
        galacticContainer.style.position = 'absolute';
        galacticContainer.style.top = '0';
        galacticContainer.style.left = '0';
        galacticContainer.style.width = '100%';
        galacticContainer.style.height = '100%';
        galacticContainer.style.zIndex = '1';
        homeSection.insertBefore(galacticContainer, homeSection.firstChild);

        // Initialize galactic background
        new GalacticCloud(galacticContainer);

        // Create container for stars
        const starsContainer = document.createElement('div');
        starsContainer.style.position = 'absolute';
        starsContainer.style.top = '0';
        starsContainer.style.left = '0';
        starsContainer.style.width = '100%';
        starsContainer.style.height = '100%';
        starsContainer.style.zIndex = '2';
        homeSection.insertBefore(starsContainer, homeSection.firstChild);

        // Initialize stars
        initStars(starsContainer);
    }
});

