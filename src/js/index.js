import { Logger } from './utils/logger';
import { AnimationObserverCSS } from './utils/animationObserver_CSS';
// Setup
import { HeroSetup } from './setup/heroSetup';
import { AboutSetup } from './setup/aboutSetup';
import { RoadmapSetup } from './setup/roadmapSetup';
import { initDynamics } from './setup/dynamicsSetup';
import { initVRMarket } from './setup/vrMarketSetup';
import { initExplore } from './setup/exploreSetup';
import { initSocial } from './setup/socialSetup';
// Common components
import { initNavbar } from './setup/NavbarSetup';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

if(process.env.NODE_ENV === 'development') {
    Logger.enableGlobalLogging();
    Logger.disableLoggerFor('AnimationObserverCSS');

    Logger.disableLoggerFor('BaseSetup');
    // Logger.disableLoggerFor('AnimationController');
    Logger.disableLoggerFor('CameraController');
    Logger.disableLoggerFor('ThreeDContainerManager');
    Logger.disableLoggerFor('CanvasUtils');
    Logger.disableLoggerFor('ThreeDContainerManager');
    Logger.disableLoggerFor('RendererManager');
    Logger.disableLoggerFor('Universal3DSection');

    Logger.disableLoggerFor('(BaseSetup) ⬅ AboutSetup');
    Logger.disableLoggerFor('(BaseSetup) ⬅ HeroSetup');
    Logger.disableLoggerFor('(BaseSetup) ⬅ RoadmapSetup');

    Logger.disableLoggerFor('(AnimationController) ⬅ Stars');
    Logger.disableLoggerFor('(AnimationController) ⬅ GalacticCloud');
    Logger.disableLoggerFor('(AnimationController) ⬅ Constellation');

    Logger.disableLoggerFor('(Universal3DSection) ⬅ HeroSetup');
    Logger.disableLoggerFor('(Universal3DSection) ⬅ AboutSetup');
    Logger.disableLoggerFor('(Universal3DSection) ⬅ RoadmapSetup');

    
    Logger.disableLoggerFor('NavbarSetup');
    Logger.disableLoggerFor('HeroSetup');
    Logger.disableLoggerFor('AboutSetup');
    Logger.disableLoggerFor('RoadmapSetup');
    Logger.disableLoggerFor('DynamicsSetup');
    Logger.disableLoggerFor('VRMarketSetup');
    Logger.disableLoggerFor('ExploreSetup');
    Logger.disableLoggerFor('ExploreScene');
    Logger.disableLoggerFor('SocialSetup');

    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('GalacticCloud');
    // Logger.disableLoggerFor('Glow');
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
        ['.star', '.roadmap-quarter', '.game-character--badge']
    );

    initNavbar();
    new HeroSetup();
    new AboutSetup();
    new RoadmapSetup();
    // initDynamics();
    // initVRMarket();
    // initExplore();
    // initSocial();

    // Initialize UI components
    initModal();
    updateCopyrightYear('[data-year="currentYear"]');
});

