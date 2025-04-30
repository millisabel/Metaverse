import { createLogger } from '../utils/logger';

import { Glow } from "../components/three/glow";
import { Roadmap } from "../components/ui/roadmap";

import { MoreButton } from "../controllers/moreButton";
import { getColors, isMobile } from "../utils/utils";
import { ThreeDContainerManager } from "../utilsThreeD/ThreeDContainerManager";

export class RoadmapSetup {
    constructor() {
        this.container = document.getElementById('roadmap');
        this.initialized = false;
        
        this.name = 'RoadmapSetup';
        this.logger = createLogger(this.name);

        this.CONTAINER_TYPES = {
            ROADMAP: 'ROADMAP',
            GLOW: 'GLOW'
        };

        this.Z_INDEX = {
            ROADMAP: '0',
            GLOW: '1'
        };
    }

    init() {
        if (!this.container || this.initialized) return;

        this.logger.log({
            conditions: 'init',
            functionName: 'init'
        });

        // create glow 
        const glowManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.GLOW,
            zIndex: this.Z_INDEX.GLOW
        });
        const glowContainer = glowManager.create();
        
        new Glow(glowContainer, {
            count: isMobile() ? 3 : 10,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: isMobile() ? 0.2 : 0.5,
                max: isMobile() ? 1.5 : 2
            },
            speed: {
                min: isMobile() ? 0.05 : 0.0002,
                max: isMobile() ? 0.1 : 0.0005
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
            }
        });

        // initialize roadmap
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

        // initialize more button
        new MoreButton(this.container, {
            buttonSelector: '.more-btn',
            hiddenElementsSelector: '.hidden-items',
            revealDelay: 40,
            typingSpeed: 20
        });

        this.initialized = true;

        this.logger.log({
            type: 'success',
            functionName: 'init'
        });
    }

    cleanup() {
        if (!this.initialized) return;
        
        const glowManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.GLOW
        });
        
        glowManager.cleanup();
        
        this.initialized = false;
    }
}

export function initRoadmap() {
    const sectionRoadmap = new RoadmapSetup();
    sectionRoadmap.init();
} 