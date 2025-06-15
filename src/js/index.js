import { AnimationObserverCSS } from './utils/animationObserver_CSS';

// Setup
import { HeroSetup } from './setup/heroSetup';
import { AboutSetup } from './setup/aboutSetup';
import { RoadmapSetup } from './setup/roadmapSetup';
import { DynamicsSetup } from './setup/dynamicsSetup';
import { VRMarketSetup } from './setup/vrMarketSetup';
import { ExploreSetup } from './setup/exploreSetup';
import { SocialSetup } from './setup/socialSetup';
import { TeamSetup } from './setup/teamSetup';

// Common components
import { initNavbar } from './setup/NavbarSetup';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

document.addEventListener('DOMContentLoaded', () => {
    const origGetError = WebGLRenderingContext.prototype.getError;

    WebGLRenderingContext.prototype.getError = function() {
        const error = origGetError.apply(this, arguments);
        if (error !== 0) {
            console.warn('WebGL error detected:', error, new Error().stack);
        }
        return error;
    };

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
    new VRMarketSetup();
    new ExploreSetup();
    new TeamSetup();
    new SocialSetup();

    initModal('.modal', ['.navbar']);
    updateCopyrightYear('[data-year="currentYear"]');

    new AnimationObserverCSS([
        '.star', 
        { 
            selector: '.roadmap-quarter',
            pseudo: 'before'
        }
    ]);
});

