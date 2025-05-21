import { SectionObserver } from '../controllers/SectionObserver';
import { Glow } from '../components/three/glow';
import { CharacterFloatingBadge } from '../components/ui/CharacterFloatingBadge';
import { isMobile } from '../utils/utils';

export class VRMarketSetup extends SectionObserver {
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
            count: isMobile() ? 4 : 8,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: 1,
                max: 3
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
            spread: {
                x: [-8, 8],
                y: [-2, 2],
                z: [-2, 2]
            },
            opacity: {
                min: 0.1,
                max: 0.2
            },
            scale: {
                min: 0.9,
                max: isMobile() ? 3 : 4
            },
            pulse: {
                speed: 0.1,
                intensity: 0.3,
                sync: false
            },
            zIndex: this.Z_INDEX.BACKGROUND_GLOWS
        };
        
        this.glow = null;
        this.characterBadge = null;
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

        // Initialize character badge
        const badgeElement = document.querySelector('.game-character--badge');
        const section = document.getElementById('vr-market');
        
        if (badgeElement && section) {
            // Ensure section has relative positioning for absolute positioning of badge
            section.style.position = 'relative';
            
            this.characterBadge = new CharacterFloatingBadge(badgeElement, section, {
                movement: {
                    enabled: !isMobile(),
                    speed: 0.8,
                    amplitude: 25,
                    frequency: 0.002,
                    verticalLimit: 0.3,
                    waves: {
                        primary: { frequency: 1.2, amplitude: 1 },
                        secondary: { frequency: 0.6, amplitude: 0.4 },
                        micro: { frequency: 3.5, amplitude: 0.2 }
                    },
                    verticalJumps: {
                        probability: isMobile() ? 0 : 0.002,
                        duration: 1800,
                        maxHeight: 0.2
                    }
                },
                horizontalMovement: {
                    enabled: !isMobile(),
                    speed: 0.0002,
                    padding: 50,
                    waves: {
                        primary: { frequency: 1, amplitude: 0.3 },
                        secondary: { frequency: 0.3, amplitude: 0.2 }
                    }
                },
                rotation: {
                    enabled: true,
                    speed: isMobile() ? 0.08 : 0.2,
                    amplitude: isMobile() ? 12 : 25,
                    waves: {
                        primary: { frequency: 0.3, amplitude: 1.5 },
                        secondary: { frequency: 0.15, amplitude: 0.8 }
                    }
                },
                scale: {
                    enabled: true,
                    min: isMobile() ? 0.8 : 0.2,
                    max: 1.3,
                    speed: isMobile() ? 0.0015 : 0.0002,
                    frequency: isMobile() ? 0.8 : 1
                },
                mobilePosition: {
                    right: 20,
                    bottom: isMobile() ? 40 : 0
                }
            });
        }
    }

    update() {
        if (this.glow) {
            this.glow.update();
        }
    }

    cleanup() {
        this.cleanupContainer(this.CONTAINER_TYPES.GLOW);
        if (this.characterBadge) {
            this.characterBadge.cleanup();
            this.characterBadge = null;
        }
        super.cleanup();
    }
}

export function initVRMarket() {
    const vrMarketSetup = new VRMarketSetup();
    return vrMarketSetup;
}
