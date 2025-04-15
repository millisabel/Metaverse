import { ContainerManager } from '../../utils/containerManager';
import { GalacticCloud } from './galactic';
import { Stars } from './stars';

export class HeroBackground {

    constructor() {
        this.container = document.getElementById('hero');
        this.initialized = false;
    }

    init() {
        if (!this.container || this.initialized) return;

        const galacticManager = new ContainerManager(this.container, { zIndex: '1' });
        const galacticContainer = galacticManager.create();
        new GalacticCloud(galacticContainer);

        const starsManager = new ContainerManager(this.container, { zIndex: '2' });
        const starsContainer = starsManager.create();
        new Stars(starsContainer, {
            count: window.innerWidth < 768 ? 2000 : 4000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
            size: {
                min: 1,
                max: 3.5,
                multiplier: window.innerWidth < 768 ? 2 : 2.2 
            },
            depth: {
                range: window.innerWidth < 768 ? 300 : 800, 
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
    }
}

export function initHeroBackground() {
    const heroBackground = new HeroBackground();
    heroBackground.init();
}