import { createLogger } from '../utils/logger';
import {Glow} from "../components/three/glow";
import {Roadmap} from "../components/ui/roadmap";
import {MoreButton} from "../controllers/moreButton";
import {getColors} from "../utils/utils";

export class RoadmapSetup {


    constructor(container) {
        this.container = container;
        this.initialized = false;
        
        this.name = 'RoadmapSetup';
        this.logger = createLogger(this.name);

        this.init();
    }

    init() {
        if (!this.container || this.initialized) return;

        this.logger.log({
            conditions: 'start',
            functionName: 'init'
        });
        
        const isMobile = window.innerWidth <= 768;

        new Glow(this.container, {
            count: isMobile ? 3 : 10,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: isMobile ? 0.2 : 0.5,
                max: isMobile ? 1.5 : 2
            },
            speed: {
                min: isMobile ? 0.05 : 0.0002,
                max: isMobile ? 0.1 : 0.0005
            },
            opacity: {
                min: 0.05,
                max: 0.2
            },
            scale: {
                min: 0.5,
                max: 2
            },
            pulse: {
                min: 0.02,
                max: 1.0
            },
            zIndex: '0',
        });

        new Roadmap(this.container, {
            colors: getColors(this.container, '.roadmap-quarter'),
            dots: {
                count: 5,
                minSize: 1,
                maxSize: 5,
                minDuration: 2,
                maxDuration: 4,
            },
        });

        new MoreButton(this.container, {
            buttonSelector: '.more-btn',
            hiddenElementsSelector: '.hidden-items',
            revealDelay: 40,
            typingSpeed: 20
        });

        this.initialized = true;

        this.logger.log({
            conditions: 'initializing-controller',
            functionName: 'init'
        });
    }
}

export function initRoadmapSetup(classNameContainer) {
    const container = document.querySelector(classNameContainer);
    if (!container) {
        console.warn('Roadmap container not found');
        return;
    }

    return new RoadmapSetup(container);
} 