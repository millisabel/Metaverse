// Utils
import { Logger } from './utils/logger';

// Setup
import { initHero } from './setup/heroSetup';
import { initAbout } from "./setup/aboutSetup";
import { initRoadmap } from './setup/roadmapSetup';
import { initDynamics } from './setup/dynamicsSetup';
import { initVRMarket } from './setup/vrMarketSetup';
import { initExplore } from './setup/exploreSetup';

// Common components
import { initNavbar } from './components/common/navbar';
import { initSlider } from './components/common/slider';
import initModal from './components/common/modal';

// 3D components
import { initSocialCards } from './components/three/socialCards';

if (process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging(false);
    Logger.disableLoggerFor('HeroSetup');
    Logger.disableLoggerFor('AboutSetup');
    Logger.disableLoggerFor('RoadmapSetup');
    Logger.disableLoggerFor('DynamicsSetup');
    Logger.disableLoggerFor('ThreeDContainerManager');
    Logger.disableLoggerFor('CameraController');
    Logger.disableLoggerFor('AnimationController_3D');
    Logger.disableLoggerFor('Utils');
    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Glow');
    Logger.disableLoggerFor('SingleGlow');
    Logger.disableLoggerFor('Roadmap');
    Logger.disableLoggerFor('Dynamics3D');
    Logger.disableLoggerFor('AnimationObserverCSS');
    Logger.disableLoggerFor('VRMarketSetup');
    Logger.disableLoggerFor('CharacterFloatingBadge');
    Logger.disableLoggerFor('ExploreSetup');
    Logger.disableLoggerFor('ExploreScene');     
    Logger.disableLoggerFor('AnimationController_3D');
    Logger.disableLoggerFor('AnimationController');
} else {
    Logger.disableGlobalLogging();
}

document.addEventListener('DOMContentLoaded', () => {
    initHero();
    initAbout();
    initRoadmap();
    initDynamics();
    initVRMarket();
    initExplore();
    initSocialCards();

    // Initialize UI components
    initNavbar();
    initModal();
    initSlider();
    
    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});


