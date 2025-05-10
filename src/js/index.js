// Setup
import { initHero } from './setup/heroSetup';
import { initAbout } from "./setup/aboutSetup";
import { initRoadmap } from './setup/roadmapSetup';
import { initDynamics } from './setup/dynamicsSetup';
import { initVRMarket } from './setup/vrMarketSetup';
import { initExplore } from './setup/exploreSetup';
import { initSocial } from './setup/socialSetup';
// Common components
import { initNavbar } from './components/common/navbar';
import { initSlider } from './components/common/slider';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

document.addEventListener('DOMContentLoaded', () => {
    initHero();
    initAbout();
    initRoadmap();
    initDynamics();
    initVRMarket();
    initExplore();
    initSocial();

    // Initialize UI components
    initNavbar();
    initModal();
    initSlider();
    updateCopyrightYear('[data-year="currentYear"]');
});
