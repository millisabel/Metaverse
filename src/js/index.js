// Utils
import { Logger } from './utils/logger';

// Observer CSS
// import AnimationObserverCSS from './utils/animationObserver_CSS';

// Setup
import { initHero } from './setup/heroSetup';
import { initAbout } from "./setup/aboutSetup";
import { initRoadmap } from './setup/roadmapSetup';
import { initDynamics } from './setup/dynamicsSetup';

// Common components
import { initNavbar } from './components/common/navbar';
import { initSlider } from './components/common/slider';
import initModal from './components/common/modal';

// 3D components
// import { initDynamics3D } from './components/three/dynamics3d';
import { initSocialCards } from './components/three/socialCards';

if (process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging(false);
    Logger.disableLoggerFor('HeroSetup');
    Logger.disableLoggerFor('ThreeDContainerManager');
    Logger.disableLoggerFor('CameraController');
    Logger.disableLoggerFor('AnimationController_3D');
    Logger.disableLoggerFor('Utils');
    Logger.disableLoggerFor('AboutSetup');
    Logger.disableLoggerFor('RoadmapSetup');
    Logger.disableLoggerFor('Roadmap');
    Logger.disableLoggerFor('AnimationObserverCSS');
    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Glow');
} else {
    Logger.disableGlobalLogging();
}

document.addEventListener('DOMContentLoaded', () => {
    // Create a logger instance
    // const observer = new AnimationObserverCSS();

    initHero();
    initAbout();
    initRoadmap();
    initDynamics();

    // initDynamics3D();
    initSocialCards();

    // Initialize UI components
    initNavbar();
    initModal();
    initSlider();
    
    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});


