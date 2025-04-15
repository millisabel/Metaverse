// Import components
import { Logger } from './utils/logger';

import { Stars } from './components/three/stars';
import { GalacticCloud } from './components/three/galactic';
import { Glow } from './components/three/glow';

import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initRoadmap } from './components/roadmap';
import { initDynamics3D } from './components/dynamics3d';
import { initSocialCards } from './components/socialCards';
import { ContainerManager } from './utils/containerManager';
import initModal from './components/modal';
import { Constellation } from './components/constellation';
import AnimationObserverCSS from './utils/animationObserver_CSS';
import { initMoreButtons } from './components/moreButton';

if (process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging();
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Glow');
    Logger.disableLoggerFor('AnimationObserverCSS');
    Logger.disableLoggerFor('Roadmap');
} else {
    Logger.disableGlobalLogging();
}

document.addEventListener('DOMContentLoaded', () => {
    // Create a logger instance
    const observer = new AnimationObserverCSS();

    // Initialize components
    initNavbar();
    initModal();
    initSlider();
    initRoadmap();
    initDynamics3D();
    initSocialCards();
    initMoreButtons(document.querySelector('.roadmap'));
    
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

    const roadMapSection = document.getElementById('roadmap');
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1099;

    if (roadMapSection) {
        new Glow(roadMapSection, {
            count: isMobile ? 5 : isTablet ? 8 : 10,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
        });
    }

    // Initialize constellation in the about section
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        const constellationManager = new ContainerManager(aboutSection, { zIndex: '1' });
        const constellationContainer = constellationManager.create();

        new Constellation(constellationContainer);
    }
});


