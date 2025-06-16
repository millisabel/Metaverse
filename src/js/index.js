import { AnimationObserverCSS } from './utils/animationObserver_CSS';

// Common components
import { initNavbar } from './setup/NavbarSetup';
import initModal from './components/common/modal';
import { updateCopyrightYear } from './utils/utils';

const moduleMap = {
    HeroSetup: () => import('./setup/heroSetup'),
    AboutSetup: () => import('./setup/aboutSetup'),
    RoadmapSetup: () => import('./setup/roadmapSetup'),
    DynamicsSetup: () => import('./setup/dynamicsSetup'),
    VRMarketSetup: () => import('./setup/vrMarketSetup'),
    ExploreSetup: () => import('./setup/exploreSetup'),
    TeamSetup: () => import('./setup/teamSetup'),
    FAQSetup: () => import('./setup/faqSetup'),
    SocialSetup: () => import('./setup/socialSetup'),
};

const lazyConfigs = [
    { selector: '#hero', className: 'HeroSetup' },
    { selector: '#about', className: 'AboutSetup' },
    { selector: '#roadmap', className: 'RoadmapSetup' },
    { selector: '#dynamics', className: 'DynamicsSetup' },
    { selector: '#vr-market', className: 'VRMarketSetup' },
    { selector: '#explore', className: 'ExploreSetup' },
    { selector: '#team', className: 'TeamSetup' },
    { selector: '#faq', className: 'FAQSetup' },
    { selector: '#social', className: 'SocialSetup' },
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

    lazyConfigs.forEach(cfg =>
        lazyInitController(cfg.selector, cfg.className)
    );

    initNavbar();
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

function lazyInitController(selector, className, params) {
    let initialized = false;
    const element = document.querySelector(selector);
    if (!element) return;

    const observer = new IntersectionObserver(async (entries, obs) => {
        if (entries[0].isIntersecting && !initialized) {
            const importFunc = moduleMap[className];
            if (!importFunc) return;
            const module = await importFunc();
            if (params) {
                new module[className](element, params);
            } else {
                new module[className]();
            }
            initialized = true;
            obs.disconnect();
        }
    }, { threshold: 0.1, rootMargin: '50px' });

    observer.observe(element);
}

