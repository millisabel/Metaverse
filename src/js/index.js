// Utils
import { Logger } from './utils/logger';
import { ContainerManager } from './utils/containerManager';

// Observer CSS
// import AnimationObserverCSS from './utils/animationObserver_CSS';

// 3D components
import { initHeroBackground } from './components/three/heroBackground';
import { Constellation } from './components/three/constellation';
// import { Glow } from './components/three/glow';
import { initDynamics3D } from './components/three/dynamics3d';
import { initSocialCards } from './components/three/socialCards';

// UI components
import { initRoadmap } from './components/ui/roadmap';

// Controllers
import { initMoreButtons } from './controllers/moreButton';

// Common components
import { initNavbar } from './components/common/navbar';
import { initSlider } from './components/common/slider';
import initModal from './components/common/modal';




if (process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging();
    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Glow');
    Logger.disableLoggerFor('Roadmap');
    Logger.disableLoggerFor('AnimationObserverCSS');
} else {
    Logger.disableGlobalLogging();
}

document.addEventListener('DOMContentLoaded', () => {
    // Create a logger instance
    // const observer = new AnimationObserverCSS();

    // Initialize 3D components
    initHeroBackground();
    initRoadmap();
    initDynamics3D();
    initSocialCards();

    // Initialize UI components
    initNavbar();
    initModal();
    initSlider();
    initMoreButtons(document.querySelector('.roadmap'));
    
    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Initialize constellation in the about section
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        const constellationManager = new ContainerManager(aboutSection, { zIndex: '1' });
        const constellationContainer = constellationManager.create();

        new Constellation(constellationContainer);
    }
});


