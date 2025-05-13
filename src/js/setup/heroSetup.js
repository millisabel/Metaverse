import { createLogger } from '../utils/logger';
import { isMobile } from "../utils/utils";

import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';

const SECTION_ID = 'hero';
const CONFIG = {
    OBJECTS: {
        STARS: {
            containerName: 'STARS',
            zIndex: 2, 
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
                probability: 0.15,
                speed: 0.0015,
                amplitude: {
                    x: 0.01,
                    y: 0.01,
                    z: 0.01
                }
            },
            material: {
                opacity: 1,
                transparent: true
            },
            camera: {
                rotation: true,
                position: { z: -50 }, 
                speed: { x: 0.00001, y: 0.00001 }
            },
        },
        GALACTIC: {
            containerName: 'GALACTIC',
            zIndex: 1,
            camera: {
                fov: 60,
                far: 1000,
                position: { x: 0, y: 5, z: 15 },
            }
        }
    }
};

export class HeroSetup extends BaseSetup {
    constructor() {
        super(SECTION_ID);

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.controllers = {
            stars: null,
            galactic: null,
        };

    }

    setupScene() {

        this.logger.log({
            functionName: 'setupScene',
            conditions: ['init'],
            customData: {
                this: this
            }
        });

        this.createGalactic();
        this.createStars();  
    }

    createGalactic() {
        this.logger.log({
            functionName: 'createGalactic',
            conditions: ['start'],
        });

        const galacticContainer = this.createContainer(
            CONFIG.OBJECTS.GALACTIC.containerName   ,
            CONFIG.OBJECTS.GALACTIC.zIndex
        );
        this.controllers.galactic = new GalacticCloud(galacticContainer, CONFIG.OBJECTS.GALACTIC);

        this.logger.log({
            type: 'success',
            functionName: 'createGalactic',
            conditions: ['completed'],
        });
    }

    createStars() {
        const starsContainer = this.createContainer(
            CONFIG.OBJECTS.STARS.containerName,
            CONFIG.OBJECTS.STARS.zIndex
        );

        this.controllers.stars = new Stars(starsContainer, CONFIG.OBJECTS.STARS); 
        
        this.logger.log({
            type: 'success',
            functionName: 'createStars',
            conditions: ['completed'],
        });
    }

    onResize() {
        Object.values(this.controllers).forEach(ctrl => {
            if (ctrl && typeof ctrl.onResize === 'function') {
                ctrl.onResize();
            }
        });
    }

    update() {
        if (this.stars) {
            this.stars.update();
        }
        if (this.galactic) {
            this.galactic.update();
        }
    }

    cleanup() {
        let message = `starting cleanup in ${this.constructor.name}\n`;
        
        this.cleanupContainer(CONFIG.OBJECTS.GALACTIC.containerName);
        this.cleanupContainer(CONFIG.OBJECTS.STARS.containerName);
        super.cleanup(message);
    }
}

export function initHero() {
    const sectionHero = new HeroSetup();
}