// Utils
import { Logger } from './utils/logger';

// Observer CSS
// import AnimationObserverCSS from './utils/animationObserver_CSS';

// 3D components
import { initHeroBackground } from './components/three/heroBackground';
import {initAboutBackground} from "./components/three/AboutBackground";
import { initDynamics3D } from './components/three/dynamics3d';
import { initSocialCards } from './components/three/socialCards';

// Common components
import { initNavbar } from './components/common/navbar';
import { initSlider } from './components/common/slider';
import initModal from './components/common/modal';

// Setup
import { initRoadmapSetup } from './setup/roadmapSetup';

if (process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging();
    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Constellation');
    // Logger.disableLoggerFor('Glow');
    // Logger.disableLoggerFor('Roadmap');
    Logger.disableLoggerFor('AnimationObserverCSS');
} else {
    Logger.disableGlobalLogging();
}

document.addEventListener('DOMContentLoaded', () => {
    // Create a logger instance
    // const observer = new AnimationObserverCSS();

    // Initialize 3D components
    initHeroBackground();
    initAboutBackground();
    initRoadmapSetup('.roadmap');
    initDynamics3D();
    initSocialCards();

    // Initialize UI components
    initNavbar();
    initModal();
    initSlider();
    
    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});


