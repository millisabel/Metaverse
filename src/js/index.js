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
import initFAQSetup from './setup/FAQ';

// Common components
import { initNavbar } from './setup/NavbarSetup';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

const lazyConfigs = [
    { selector: '#hero', Controller: HeroSetup },
    { selector: '#about', Controller: AboutSetup },
    { selector: '#roadmap', Controller: RoadmapSetup },
    { selector: '#dynamics', Controller: DynamicsSetup },
    { selector: '#vr-market', Controller: VRMarketSetup },
    { selector: '#explore', Controller: ExploreSetup },
    { selector: '#team', Controller: TeamSetup },
    { selector: '#social', Controller: SocialSetup },
];

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

    lazyConfigs.forEach(cfg => lazyInitController(cfg.selector, cfg.Controller));

    initNavbar();
    initFAQSetup();
    initModal('.modal', ['.navbar']);
    updateCopyrightYear('[data-year="currentYear"]');

    new AnimationObserverCSS([
        { 
            selector: '.roadmap-quarter',
            pseudo: 'before'
        },
        {
            selector: '.star',
            pseudo: 'after'
        },
        {
            selector: '.star',
            pseudo: 'before'
        }
    ]);
});

function lazyInitController(selector, ControllerClass, params) {
    let initialized = false;
    const element = document.querySelector(selector);
    if (!element) return;

    const observer = new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting && !initialized) {
            if (params) {
                new ControllerClass(element, params);
            } else {
                new ControllerClass();
            }
            initialized = true;
            obs.disconnect();
        }
    }, { threshold: 0.1, rootMargin: '50px' });

    observer.observe(element);
}

