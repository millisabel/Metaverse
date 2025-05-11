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
    Logger.enableGlobalLogging(false);
    Logger.disableLoggerFor('CameraController');
    Logger.disableLoggerFor('ThreeDContainerManager');
    Logger.disableLoggerFor('CanvasUtils');
    Logger.disableLoggerFor('AnimationController');
    Logger.disableLoggerFor('ThreeDContainerManager');
    Logger.disableLoggerFor('AnimationObserverCSS');
    
    Logger.disableLoggerFor('HeroSetup');
    Logger.disableLoggerFor('AboutSetup');
    Logger.disableLoggerFor('RoadmapSetup');
    Logger.disableLoggerFor('DynamicsSetup');
    Logger.disableLoggerFor('VRMarketSetup');
    Logger.disableLoggerFor('ExploreSetup');
    Logger.disableLoggerFor('ExploreScene');
    Logger.disableLoggerFor('SocialSetup');

    Logger.disableLoggerFor('Stars');
    Logger.disableLoggerFor('Glow');
    Logger.disableLoggerFor('Constellation');
    Logger.disableLoggerFor('Dynamics3D');
    // Logger.disableLoggerFor('SocialCard');
    Logger.disableLoggerFor('GalacticCloud');

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
    Logger.log('index.js', {
        conditions: ['DOMContentLoaded'],
    });

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
    // initHero();
    // initAbout();
    // initRoadmap();
    // initDynamics();
    // initVRMarket();
    // initExplore();
    // initSocial();

    // Initialize UI components
    // initModal();
    // initSlider();
    // updateCopyrightYear('[data-year="currentYear"]');
});

/**
 * @param {Array<string|HTMLElement>} animationTargets - Селекторы (строки) или элементы для отслеживания анимаций.
 *        Для псевдоэлементов передаётся только родительский элемент или его селектор.
 * @param {function(string):void} [onActiveSectionChange] - Коллбэк при смене активной секции (опционально).
 * @param {NodeList|Element[]} [sections] - Секции для Intersection Observer (опционально).
 */
