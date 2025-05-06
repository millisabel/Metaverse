import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Glow } from '../components/three/glow';
import { isMobile } from '../utils/utils';

export class VRMarketSetup extends BaseSetup {
    constructor() {
        super('vr-market', 'VRMarketSetup', {
            camera: {
                position: { z: 5 },
                lookAt: { x: 0, y: 0, z: 0 }
            }
        });   
    
        this.CONTAINER_TYPES = {
            BACKGROUND_GLOWS: 'BACKGROUND_GLOWS',
            VR_MARKET_CARD: 'VR_MARKET_CARD'
        };
        
        this.Z_INDEX = {
            BACKGROUND_GLOWS: '-2',
            CARD: '0',
            CHARACTERS: '1'
        };

        this.GLOW_CONFIG = {
            count: isMobile() ? 3 : 7,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: isMobile() ? 0.2 : 1,
                max: isMobile() ? 1.5 : 3
            },
            movement: {
                enabled: true,
                speed: isMobile() ? 0.2 : 0.001,
                range: {
                    x: 1,
                    y: 0.9,
                    z: 0.3
                }
            },
            spread: {
                x: [-8, 8],
                y: [-2, 2],
                z: [-2, 2]
            },
            opacity: {
                min: 0.1,
                max: 0.3
            },
            scale: {
                min: 0.9,
                max: 4
            },
            pulse: {
                speed: isMobile() ? 0.1 : 0.1,
                intensity: 0.3,
                sync: false
            },
            zIndex: this.Z_INDEX.BACKGROUND_GLOWS
        };
        
        this.glow = null;
    }

    setupScene() { 
        const glowContainer = this.createContainer(
            this.CONTAINER_TYPES.BACKGROUND_GLOWS,
            this.Z_INDEX.BACKGROUND_GLOWS
        );

        this.glow = new Glow(glowContainer, {
            count: this.GLOW_CONFIG.count,
            colors: this.GLOW_CONFIG.colors,
            randomizeColors: true,
            size: this.GLOW_CONFIG.size,
            opacity: this.GLOW_CONFIG.opacity,
            scale: this.GLOW_CONFIG.scale,
            pulse: this.GLOW_CONFIG.pulse,
            movement: this.GLOW_CONFIG.movement
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

export function initVRMarket() {
    const vrMarketSetup = new VRMarketSetup();
    return vrMarketSetup;
}
