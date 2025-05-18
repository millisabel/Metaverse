import { Universal3DSection } from '../utilsThreeD/Universal3DSection';
import { Dynamics3D } from '../components/three/dynamics3d';
import { Glow } from '../components/three/glow';

import { isMobile } from '../utils/utils';

import decoration1Svg from '../../assets/images/dynamics/decoration_1.svg';
import decoration2Svg from '../../assets/images/dynamics/decoration_2.svg';
import decoration3Svg from '../../assets/images/dynamics/decoration_3.svg';

let SECTION_ID = 'dynamics';
const CONFIG_CARDS = {  
    GUARDIANS: {
        containerName: 'GUARDIANS_CARD',
        id: 'guardians3d',
        zIndex: 0, 
        options: {
            type: 'guardians',
            color: 0x00FFFF,
            decoration: decoration1Svg,
            //     textureAnimation: {
            //         rotation: true,
            //         pulse: true,
            //         wave: true
            //     },
            glow: {
                enabled: true,
                size: 2.0,
                opacity: 0.5,
                scale: { min: 2, max: 6 },
                color: 0x00FFFF
            }
        }
    },
    METAVERSE: {
        containerName: 'METAVERSE_CARD',
        id: 'metaverse3d',
        zIndex: 0,
        options: {
            type: 'metaverse',
            color: 0x4169FF,
            decoration: decoration2Svg,
            glow: {
                enabled: true,
                size: 2.0,
                opacity: 0.7,
                scale: { min: 2, max: 6 },
                color: 0x4169FF
            }
        }
    },
    SANKOPA: {
        containerName: 'SANKOPA_CARD',
        id: 'sankopa3d',
        zIndex: 0,
        options: {
            type: 'sankopa',
            color: 0xFF00FF,
            decoration: decoration3Svg,
            glow: {
                enabled: true,
                size: 2.0,
                opacity: 0.4,
                scale: { min: 2, max: 6 },
                color: 0xFF00FF
            }
        }
    },
};
const CONFIG = {
    GLOW: {
        containerName: 'DYNAMICS_GLOW',
        zIndex: 2,
        camera: {
            position: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        classRef: Glow,
        objectConfig: {
            shaderOptions: {
                opacity: { 
                    min: 0.5, 
                    max: 1 
                },
                scale: { 
                    min: 1, 
                    max: 10
                },
            },
            colorPalette: ['#56FFEB', '#4642F4', '#F00AFE'],
            size: { min: 1, max: 1 }, 
            positioning: {
                mode: 'element',
                align: 'top center',
                offset: { x: 0, y: 20 }
            },
            pulseControl: {
                enabled: true,
                randomize: false
            },
            individualOptions: [
                {
                    shaderOptions: {
                        color: '#56FFEB',
                    },
                    positioning: {
                        mode: 'element',
                        targetSelector: '.dynamics .card--3d-left', 
                    }
                },
                {
                    shaderOptions: {
                        color: '#4642F4', 
                    },
                    positioning: {
                        targetSelector: '.dynamics .card--3d-center',
                  }
                },
                {
                    shaderOptions: {
                        color: '#F00AFE', 
                    },
                    positioning: {
                        targetSelector: '.dynamics .card--3d-right',
                  }
                }
            ]
        }
    }
};

export class DynamicsSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, CONFIG);

        Object.values(CONFIG_CARDS).forEach(card => {
            const cardContainer = document.getElementById(card.id);

            if (!cardContainer) {
                console.warn(`[DynamicsSetup] Container not found for card: ${card.id}`);
                return;
            }
            new Dynamics3DWrapper(cardContainer, card.options);
        });
    }

    /**
     * @description Sets the objectPulse value for a glow under a card (for external sync)
     * @param {number} cardIndex - Card index (0-based)
     * @param {number} value - Target value (0..1)
     */
    setGlowPulseForCard(cardIndex, value) {
        if (this.backgroundGlows && typeof this.backgroundGlows.setGlowPulse === 'function') {
            this.backgroundGlows.setGlowPulse(cardIndex, value);
        }
    }
}

/**
 * @param {HTMLElement} container 
 * @param {Object} options
 */
export class Dynamics3DWrapper {
    constructor(container, options = {}) {
        this.container = container;
        this.dynamics3D = null;
        this.options = options;
        void this.init(); 
    }

    async init() {
        this.dynamics3D = new Dynamics3D(this.container, this.options);
        if (typeof this.dynamics3D.initAsync === 'function') {
            await this.dynamics3D.initAsync();
        }
    }

    cleanup() {
        if (this.dynamics3D && typeof this.dynamics3D.cleanup === 'function') {
            this.dynamics3D.cleanup();
            this.dynamics3D = null;
        }
    }
}

// export class DynamicsSetup extends BaseSetup {
//     constructor() {
//         super('dynamics', 'DynamicsSetup', {
//             camera: {
//                 fov: 75,
//                 aspect: 1,
//                 near: 0.1,
//                 far: 1000,
//                 position: { z: 5 },
//                 lookAt: { x: 0, y: 0, z: 0 },
//                 rotation: true,
//                 speed: { x: 0.00001, y: 0.00001 }
//             }
//         });  
//            
        
//         this.backgroundGlows = null;
//         this.cards = {};  
        
//         // Add resize observer
//         this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
//     }

//     handleResize() {
//         if (!this.backgroundGlows) return;

//         const positions = this.calculateGlowPositions();
//         this.updateGlowPositions(positions);
//     }
// const initialPositions = calculateGlowPositions();
    function calculateGlowPositions() {
        
        if (isMobile()) {
            return [
                { x: 0, y: 1.5, z: -2 },  
                { x: 0, y: 0, z: -2 },   
                { x: 0, y: -1.5, z: -2 }  
            ];
        } else {
            return [
                { x: -1.5, y: 0, z: 0 },
                { x: 0, y: 0, z: 0 },
                { x: 1.5, y: 0, z: 0 }
            ];
        }
    }


//     updateGlowPositions(positions) {
//         if (!this.backgroundGlows || !this.backgroundGlows.glows) return;

//         positions.forEach((position, index) => {
//             const glow = this.backgroundGlows.glows[index];
//             if (glow && glow.mesh) {
//                 glow.mesh.position.set(position.x, position.y, position.z);
//             }
//         });
//     }

//     initScene() {
//         if (this.initialized) return;

//         this.scene = new THREE.Scene();
        
//         this.cameraController.init(this.container);
//         this.camera = this.cameraController.camera;

//         this.setupScene();
        
//         this.initialized = true;
//     }

//     setupScene() { 
//         // Create background glows first
//         const dynamicsSection = document.getElementById('dynamics');
//         if (dynamicsSection) {
//             const glowContainer = this.createContainer(
//                 this.CONTAINER_TYPES.BACKGROUND_GLOWS,
//                 this.Z_INDEX.BACKGROUND_GLOWS
//             );
            
//             if (dynamicsSection.firstChild) {
//                 dynamicsSection.insertBefore(glowContainer, dynamicsSection.firstChild);
//             } else {
//                 dynamicsSection.appendChild(glowContainer);
//             }

            

//             this.backgroundGlows = new Glow(glowContainer, {

//             });

//             setTimeout(() => {
//                 this.resizeObserver.observe(document.body);
//             }, 100);
//         }

//         const guardiansContainer = document.getElementById('guardians3d');
//         if (guardiansContainer) {
//             this.cards.guardians = new Dynamics3D(guardiansContainer, {
//                 type: this.CONTAINER_TYPES.GUARDIANS,
//                 ...this.CARD_CONFIG.GUARDIANS_CARD
//             });
//         }

//         const metaverseContainer = document.getElementById('metaverse3d');
//         if (metaverseContainer) {
//             this.cards.metaverse = new Dynamics3D(metaverseContainer, {
//                 type: this.CONTAINER_TYPES.METAVERSE,
//                 ...this.CARD_CONFIG.METAVERSE_CARD
//             });
//         }

//         const sankopaContainer = document.getElementById('sankopa3d');
//         if (sankopaContainer) {
//             this.cards.sankopa = new Dynamics3D(sankopaContainer, {
//                 type: this.CONTAINER_TYPES.SANKOPA,
//                 ...this.CARD_CONFIG.SANKOPA_CARD
//             });
//         }

//         this.startBackgroundGlowSync();
//     }

//     startBackgroundGlowSync() {
//         if (!this.backgroundGlows) return;

//         const animate = () => {
//             if (this.cards.guardians) {
//                 this.backgroundGlows.syncWithCard(this.cards.guardians, 0);
//             }
//             if (this.cards.metaverse) {
//                 this.backgroundGlows.syncWithCard(this.cards.metaverse, 1);
//             }
//             if (this.cards.sankopa) {
//                 this.backgroundGlows.syncWithCard(this.cards.sankopa, 2);
//             }

//             requestAnimationFrame(animate);
//         };

//         animate();
//     }

//     update() {
//         if (this.cards.guardians) {
//             this.cards.guardians.update();
//         }
//         if (this.cards.metaverse) {
//             this.cards.metaverse.update();
//         }
//         if (this.cards.sankopa) {
//             this.cards.sankopa.update();
//         }
//     }

//     cleanup() {
//         if (this.resizeObserver) {
//             this.resizeObserver.disconnect();
//         }

//         if (this.backgroundGlows) {
//             this.cleanupContainer(this.CONTAINER_TYPES.BACKGROUND_GLOWS);
//         }
//         if (this.cards.guardians) {
//             this.cleanupContainer(this.CONTAINER_TYPES.GUARDIANS);
//         }
//         if (this.cards.metaverse) {
//             this.cleanupContainer(this.CONTAINER_TYPES.METAVERSE);
//         }
//         if (this.cards.sankopa) {
//             this.cleanupContainer(this.CONTAINER_TYPES.SANKOPA);
//         }
        
//         super.cleanup();    
//     }
// }

// export function initDynamics() {
//     const dynamicsSetup = new DynamicsSetup();
//     return dynamicsSetup;
// }


