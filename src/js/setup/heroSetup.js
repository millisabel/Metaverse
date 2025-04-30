import { ThreeDContainerManager } from '../utilsThreeD/ThreeDContainerManager';
import { GalacticCloud } from '../components/three/galactic';
import { Stars } from '../components/three/stars';
import { createLogger } from '../utils/logger';
import { isMobile } from '../utils/utils';

export class HeroSetup {
    constructor() {
        this.container = document.getElementById('hero');
        this.initialized = false;
        
        this.name = 'HeroSetup';
        this.logger = createLogger(this.name);

        this.CONTAINER_TYPES = {
            STARS: 'STARS',
            GALACTIC: 'GALACTIC'
        };

        this.Z_INDEX = {
            BACKGROUND: '0',
            STARS: '2',
            GALACTIC: '1'
        };
    }

    init() {
        if (!this.container || this.initialized) return;

        this.logger.log({
            conditions: 'init',
            functionName: 'init'
        });

        // create galactic 
        const galacticManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.GALACTIC,
            zIndex: this.Z_INDEX.GALACTIC
        });
        const galacticContainer = galacticManager.create();
        new GalacticCloud(galacticContainer);

        // create stars 
        const starsManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.STARS,
            zIndex: this.Z_INDEX.STARS
        });
        const starsContainer = starsManager.create();
        new Stars(starsContainer, {
            count: isMobile() ? 1000 : 4000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
            size: {
                min: 1,
                max: 3.5,
                multiplier: isMobile() ? 2 : 2.2 
            },
            depth: {
                range: isMobile() ? 300 : 800, 
                z: [300, -400] 
            },
            movement: {
                enabled: true,
                probability: 0.3,
                speed: 0.0035,
                amplitude: {
                    x: 0.02,
                    y: 0.02,
                    z: 0.02
                }
            },
            camera: {
                rotation: true,
                position: { z: -40 }, 
                speed: { x: 0.00003, y: 0.00003 }
            },
            material: {
                opacity: 1,
                transparent: true
            }
        });

        this.initialized = true;

        this.logger.log({
            type: 'success',
            functionName: 'init'
        });
    }

    cleanup() {
        if (!this.initialized) return;
        
        const galacticManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.GALACTIC
        });
        const starsManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.STARS
        });
        
        galacticManager.cleanup();
        starsManager.cleanup();
        
        this.initialized = false;
    }
}

export function initHero() {
    const sectionHero = new HeroSetup();
    sectionHero.init();
}