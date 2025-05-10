import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Glow } from "../components/three/glow";
import { Roadmap } from "../components/ui/roadmap";
import { MoreButton } from "../controllers/moreButton";
import { getColors, isMobile } from "../utils/utils";

export class RoadmapSetup extends BaseSetup {
    constructor() {
        super('roadmap', 'RoadmapSetup', {
            camera: {
                position: { z: 5 },
                lookAt: { x: 0, y: 0, z: 0 }
            }
        });
        
        this.CONTAINER_TYPES = {
            ROADMAP: 'ROADMAP',
            GLOW: 'GLOW'
        };

        this.Z_INDEX = {
            ROADMAP: '0',
            GLOW: '-1',
        };

        this.GLOW_CONFIG = {
            count: isMobile() ? 3 : 10,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: isMobile() ? 0.2 : 0.5,
                max: isMobile() ? 1.5 : 3
            },                      
            movement: {
                enabled: true,
                speed: 0.001,
                range: {
                    x: 1,
                    y: 0.9,
                    z: 0.3
                }
            },
            opacity: {
                min: 0.1,
                max: 0.2
            },
            scale: {
                min: 0.9,
                max: 1.2
            },
            pulse: {
                speed: 0.1,
                intensity: 0.3,
                sync: false
            },
            zIndex: this.Z_INDEX.GLOW
        };

    }

    setupScene() {
        // create glow 
        const glowContainer = this.createContainer(
            this.CONTAINER_TYPES.GLOW, 
            this.Z_INDEX.GLOW
        );
        
        this.glow = new Glow(glowContainer, this.GLOW_CONFIG);

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
    }

    update() {
        if (this.glow) {
            this.glow.update();
        }
    }

    cleanup() {
        this.cleanupContainer(this.CONTAINER_TYPES.GLOW);
        super.cleanup();
    }
}

export function initRoadmap() {
    const sectionRoadmap = new RoadmapSetup();
} 