import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Glow } from "../components/three/glow";
import { Roadmap } from "../components/ui/roadmap";
import { MoreButton } from "../controllers/moreButton";
import { getColors, isMobile } from "../utils/utils";

export class RoadmapSetup extends BaseSetup {
    constructor() {
        super('roadmap', 'RoadmapSetup');
        
        this.CONTAINER_TYPES = {
            ROADMAP: 'ROADMAP',
            GLOW: 'GLOW'
        };

        this.Z_INDEX = {
            ROADMAP: '0',
            GLOW: '-1',
        };
    }

    init() {
        if (!this.canInitialize()) return;

        // create glow 
        const glowContainer = this.createContainer(
            this.CONTAINER_TYPES.GLOW, 
            this.Z_INDEX.GLOW
        );
        
        new Glow(glowContainer, {
            count: isMobile() ? 3 : 10,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: isMobile() ? 0.2 : 0.5,
                max: isMobile() ? 1.5 : 3
            },
            speed: {
                min: isMobile() ? 0.1 : 0.5,
                max: isMobile() ? 0.2 : 1.0
            },
            opacity: {
                min: 0.1,
                max: 0.3
            },
            scale: {
                min: 0.9,
                max: 1.2
            },
            pulse: {
                min: 0.1,
                max: 0.3
            },
            range: {
                x: 1,
                y: 0.9,
                z: 0.3
            },
            zIndex: this.Z_INDEX.GLOW
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
        this.container.style.zIndex = this.Z_INDEX.ROADMAP;

        // initialize more button
        new MoreButton(this.container, {
            buttonSelector: '.more-btn',
            hiddenElementsSelector: '.hidden-items',
            revealDelay: 40,
            typingSpeed: 20
        });

        this.completeInitialization();
    }

    cleanup() {
        if (!this.canCleanup()) return;
        
        this.cleanupContainer(this.CONTAINER_TYPES.GLOW);
        this.completeCleanup();
    }
}

export function initRoadmap() {
    const sectionRoadmap = new RoadmapSetup();
    sectionRoadmap.init();
} 