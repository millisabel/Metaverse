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
            count: window.innerWidth < 768 ? 2500 : 5000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
            size: {
                min: 1,
                max: 4,
                multiplier: window.innerWidth < 768 ? 2 : 2.5
            },
            depth: {
                range: window.innerWidth < 768 ? 500 : 1000,
                z: [-1000, 1000]
            },
            movement: {
                enabled: true,
                probability: 0.5,
                speed: 0.003
            },
            camera: {
                rotation: true,
                speed: { x: 0.00002, y: 0.00002 }
            },
            material: {
                opacity: 1,
                transparent: true,
            }
        });

        this.initialized = true;
    }
}

export function initHeroBackground() {
    const heroBackground = new HeroBackground();
    heroBackground.init();
}