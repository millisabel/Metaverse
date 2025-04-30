import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';
import { isMobile } from "../utils/utils";

export class HeroSetup extends BaseSetup {
    constructor() {
        super('hero', 'HeroSetup');
        
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
        if (!this.canInitialize()) return;

        // create galactic 
        const galacticContainer = this.createContainer(
            this.CONTAINER_TYPES.GALACTIC,
            this.Z_INDEX.GALACTIC
        );
        new GalacticCloud(galacticContainer);

        // create stars 
        const starsContainer = this.createContainer(
            this.CONTAINER_TYPES.STARS,
            this.Z_INDEX.STARS
        );

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

        this.completeInitialization();
    }

    cleanup() {
        if (!this.canCleanup()) return;
        
        this.cleanupContainer(this.CONTAINER_TYPES.GALACTIC);
        this.cleanupContainer(this.CONTAINER_TYPES.STARS);
        this.completeCleanup();
    }
}

export function initHero() {
    const sectionHero = new HeroSetup();
    sectionHero.init();
}