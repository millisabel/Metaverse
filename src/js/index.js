// Import components
import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initRoadmap } from './components/roadmap';
import { initDynamics3D } from './components/dynamics3d';
import { initSocialCards } from './components/socialCards';
import { initAllAnimations } from './utils/animationObserver';
import { GalacticCloud } from './components/galactic';
import { Stars } from './components/stars';
import { ContainerManager } from './utils/containerManager';
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
        const galacticManager = new ContainerManager(homeSection, { zIndex: '1' });
        const galacticContainer = galacticManager.create();

        // Initialize galactic background
        new GalacticCloud(galacticContainer);

        // Create container for stars
        const starsManager = new ContainerManager(homeSection, { zIndex: '2' });
        const starsContainer = starsManager.create();

        // Initialize stars
        new Stars(starsContainer);
    }
});

