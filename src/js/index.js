import { Logger } from './utils/logger';
import { AnimationObserverCSS } from './utils/animationObserver_CSS';

// Setup
import { HeroSetup } from './setup/heroSetup';
import { AboutSetup } from './setup/aboutSetup';
import { RoadmapSetup } from './setup/roadmapSetup';
import { DynamicsSetup } from './setup/dynamicsSetup';
// import { initVRMarket } from './setup/vrMarketSetup';
// import { initExplore } from './setup/exploreSetup';
// import { initSocial } from './setup/socialSetup';

// Common components
import { initNavbar } from './setup/NavbarSetup';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

if(process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging();
    Logger.disableLoggerFor('AnimationObserverCSS');

    Logger.disableLoggerFor('Universal3DSection');
    Logger.disableLoggerFor('AnimationController');
    Logger.disableLoggerFor('CameraController');
    Logger.disableLoggerFor('RendererManager');

    Logger.disableLoggerFor('HeroSetup');
    Logger.disableLoggerFor('AboutSetup');
    Logger.disableLoggerFor('RoadmapSetup');
    Logger.disableLoggerFor('DynamicsSetup');
    Logger.disableLoggerFor('VRMarketSetup');
    Logger.disableLoggerFor('ExploreSetup');
    Logger.disableLoggerFor('ExploreScene');
    Logger.disableLoggerFor('SocialSetup');

    Logger.disableLoggerFor('STARS');
    Logger.disableLoggerFor('STARS_WHITE');
    Logger.disableLoggerFor('GalacticCloud');
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Glow');
    Logger.disableLoggerFor('Dynamics3D');
    Logger.disableLoggerFor('SocialCard');
    Logger.disableLoggerFor('SingleGlow');

    Logger.disableLoggerFor('GUARDIANS_CARD');
    Logger.disableLoggerFor('METAVERSE_CARD');
    Logger.disableLoggerFor('SANKOPA_CARD');

    Logger.disableLoggerFor('NavbarSetup');
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
        once: true,
        mirror: true,
        offset: 100
    });

    initNavbar();

    new HeroSetup();
    new AboutSetup();
    new RoadmapSetup();
    new DynamicsSetup();
    // initVRMarket();
    // initExplore();
    // initSocial();

    // Initialize UI components
    initModal();
    updateCopyrightYear('[data-year="currentYear"]');

    new AnimationObserverCSS([
        '.star', 
        '.game-character--badge',
        { 
            selector: '.roadmap-quarter',
            pseudo: 'before'
        }
    ]);
});

