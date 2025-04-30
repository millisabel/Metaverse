import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';
import { isMobile } from "../utils/utils";

export class HeroSetup extends BaseSetup {
    constructor() {
        super('hero', 'HeroSetup', {
            camera: {
                position: { z: -40 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: true,
                speed: { x: 0.00003, y: 0.00003 }
            }
        });
        
        this.CONTAINER_TYPES = {
            STARS: 'STARS',
            GALACTIC: 'GALACTIC'
        };

        this.Z_INDEX = {
            BACKGROUND: '0',
            STARS: '2',
            GALACTIC: '1'
        };

        this.stars = null;
        this.galactic = null;
    }

    setupScene() {
        // create galactic 
        const galacticContainer = this.createContainer(
            this.CONTAINER_TYPES.GALACTIC,
            this.Z_INDEX.GALACTIC
        );
        this.galactic = new GalacticCloud(galacticContainer);

        // create stars 
        const starsContainer = this.createContainer(
            this.CONTAINER_TYPES.STARS,
            this.Z_INDEX.STARS
        );

        this.stars = new Stars(starsContainer, {
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
        this.cleanupContainer(this.CONTAINER_TYPES.GALACTIC);
        this.cleanupContainer(this.CONTAINER_TYPES.STARS);
        super.cleanup();
    }
}

export function initHero() {
    const sectionHero = new HeroSetup();
}