import { ContainerManager } from '../../utils/containerManager';
import { GalacticCloud } from '../three/galactic';
import { Stars } from '../three/stars';

export class HeroBackground {
    static NAME = 'HeroBackground';

    constructor() {
        this.container = document.getElementById('hero');
        this.initialized = false;
    }

    init() {
        if (!this.container || this.initialized) return;

        // Галактический фон
        const galacticManager = new ContainerManager(this.container, { zIndex: '1' });
        const galacticContainer = galacticManager.create();
        new GalacticCloud(galacticContainer);

        // Звезды
        const starsManager = new ContainerManager(this.container, { zIndex: '2' });
        const starsContainer = starsManager.create();
        new Stars(starsContainer);

        this.initialized = true;
    }
}

export function initHeroBackground() {
    const heroBackground = new HeroBackground();
    heroBackground.init();
}