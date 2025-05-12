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
            zIndex: 1, 
        },
        GALACTIC: {
            containerName: 'GALACTIC',
            zIndex: 2,
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

        this.stars = null;
        this.galactic = null;
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

        const sectionContainer = document.getElementById('hero');
        this.galactic = new GalacticCloud(sectionContainer, CONFIG.OBJECTS.GALACTIC);

        this.logger.log({
            type: 'success',
            functionName: 'createGalactic',
            conditions: ['completed'],
        });
    }

    createStars() {
        // create stars 
        // const starsContainer = this.createContainer(
        //     this.CONTAINER_TYPES.STARS,
        //     this.Z_INDEX.STARS
        // );

        // this.stars = new Stars(starsContainer, {
        //     containerType: this.CONTAINER_TYPES.STARS,
        //     zIndex: this.Z_INDEX.STARS,
        //     count: isMobile() ? 1000 : 4000,
        //     colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
        //     size: {
        //         min: 1,
        //         max: 3.5,
        //         multiplier: isMobile() ? 2 : 2.2 
        //     },
        //     depth: {
        //         range: isMobile() ? 300 : 800, 
        //         z: [300, -400] 
        //     },
        //     movement: {
        //         enabled: true,
        //         probability: 0.15,
        //         speed: 0.0015,
        //         amplitude: {
        //             x: 0.01,
        //             y: 0.01,
        //             z: 0.01
        //         }
        //     },
        //     camera: {
        //         rotation: true,
        //         position: { z: -50 }, 
        //         speed: { x: 0.00001, y: 0.00001 }
        //     },
        //     material: {
        //         opacity: 1,
        //         transparent: true
        //     }
        // });
        
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
        this.cleanupContainer(CONFIG.OBJECTS.GALACTIC.containerName);
        this.cleanupContainer(CONFIG.OBJECTS.STARS.containerName);
        super.cleanup();
    }
}

export function initHero() {
    const sectionHero = new HeroSetup();
}