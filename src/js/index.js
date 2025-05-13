import { Logger } from './utils/logger';
import { AnimationObserverCSS } from './utils/animationObserver_CSS';
// Setup
import { initNavbar } from './setup/NavbarSetup';
import { initHero } from './setup/heroSetup';
import { initAbout } from "./setup/aboutSetup";
import { initRoadmap } from './setup/roadmapSetup';
import { initDynamics } from './setup/dynamicsSetup';
import { initVRMarket } from './setup/vrMarketSetup';
import { initExplore } from './setup/exploreSetup';
import { initSocial } from './setup/socialSetup';
// Common components
import { initSlider } from './components/common/slider';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

if(process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging();
    Logger.disableLoggerFor('AnimationObserverCSS');

    // Logger.disableLoggerFor('BaseSetup');
    // Logger.disableLoggerFor('AnimationController');
    // Logger.disableLoggerFor('CameraController');
    // Logger.disableLoggerFor('ThreeDContainerManager');
    // Logger.disableLoggerFor('CanvasUtils');
    // Logger.disableLoggerFor('ThreeDContainerManager');
    
    Logger.disableLoggerFor('NavbarSetup');
    // Logger.disableLoggerFor('HeroSetup');
    Logger.disableLoggerFor('AboutSetup');
    Logger.disableLoggerFor('RoadmapSetup');
    Logger.disableLoggerFor('DynamicsSetup');
    Logger.disableLoggerFor('VRMarketSetup');
    Logger.disableLoggerFor('ExploreSetup');
    Logger.disableLoggerFor('ExploreScene');
    Logger.disableLoggerFor('SocialSetup');

    // Logger.disableLoggerFor('Stars');
    // Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Glow');
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Dynamics3D');
    Logger.disableLoggerFor('SocialCard');

    Logger.disableLoggerFor('Roadmap');
    Logger.disableLoggerFor('Navbar');
    Logger.disableLoggerFor('Slider');
    Logger.disableLoggerFor('Modal');
    Logger.disableLoggerFor('CopyrightYear');
    Logger.disableLoggerFor('CharacterFloatingBadge');
}
else {
    Logger.disableGlobalLogging();
}

document.addEventListener('DOMContentLoaded', () => {

    AOS.init({
        duration: 800,
        once: false,
        mirror: true,
        offset: 100
    });

    new AnimationObserverCSS(
        ['.star', '.game-character--badge']
    );

    initNavbar();
    initHero();
    // initAbout();
    // initRoadmap();
    // initDynamics();
    // initVRMarket();
    // initExplore();
    // initSocial();
    // initSlider();

    // Initialize UI components
    initModal();
    updateCopyrightYear('[data-year="currentYear"]');
});

