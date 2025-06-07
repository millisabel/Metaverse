import { SectionController } from '../controllers/SectionController';
import { Dynamics3D } from '../components/three/dynamics3d';
import { Glow } from '../components/three/glow';

import { Object3DSyncManager } from '../utilsThreeD/Object3DSyncManager';

import decoration1Svg from '../../assets/images/dynamics/decoration_1.svg';
import decoration2Svg from '../../assets/images/dynamics/decoration_2.svg';
import decoration3Svg from '../../assets/images/dynamics/decoration_3.svg';

let SECTION_ID = 'dynamics';
const Z_INDEX = {
    SECTION: 0,
    GLOW: 1,
    CARD: 2,
};  
const CARD_COLORS = {
    GUARDIANS: 0x00FFFF,
    METAVERSE: 0x4169FF,
    SANKOPA: 0xFF00FF,
};
const CONFIG_CARDS = {  
    GUARDIANS: {
        containerName: 'guardians3d',
        classRef: Dynamics3D,
        zIndex: Z_INDEX.CARD, 
        objectConfig: {
            type: 'guardians',
            color: CARD_COLORS.GUARDIANS,
            decoration: {
                patch: decoration1Svg,
                options: {
                    emissive: CARD_COLORS.GUARDIANS,
                },
            },
            mesh: {
                shape: 'circle',
                geometry: [1, 64],
                scale: { x: 0.8, y: 0.8, z: 1 },
                position: { x: 0, y: 0, z: -0.5 },
                material: {
                    color: CARD_COLORS.GUARDIANS,
                    emissive: CARD_COLORS.GUARDIANS,
                    emissiveIntensity: 0.5,
                    metalness: 0,
                    roughness: 0,
                    transparent: false,
                },
            }, 
            animationParams: {
                group: {
                rotation: {
                    x: { amplitude: 0, speed: 0 }, 
                    y: { amplitude: 0, speed: 0 }, 
                    z: { phase: Math.PI/2} 
                },
                position: {
                    x: { phase: Math.PI/2  }, 
                    y: { phase: Math.PI/2  }, 
                    z: { speed: 0.05, amplitude: 8,  phase: Math.PI/2 } 
                    },
                    scale: { amplitude: 0.005, speed: 0.1 }
                }
            }
        }
    },
    METAVERSE: {
        containerName: 'metaverse3d',
        classRef: Dynamics3D,
        zIndex: Z_INDEX.CARD,
        objectConfig: {
            type: 'metaverse',
            color: CARD_COLORS.METAVERSE,
            decoration: {
                patch: decoration2Svg,
                options: {
                    emissive: CARD_COLORS.METAVERSE,
                    emissiveIntensity: 5,
                    metalness: 0.2,
                },
            },
            mesh: {
                shape: 'box',
                geometry: [1.5, 1.5, 0.5],
                scale: { x: 0.7, y: 0.7, z: 1 },
                position: { x: 0, y: 0, z: -0.5 },
                material: {
                    color: CARD_COLORS.METAVERSE,
                    emissive: CARD_COLORS.METAVERSE,
                    envMapIntensity: 1.0,
                    metalness: 1.0,
                    roughness: 0.05
                },
            },
            animationParams: {
                group: {
                    z: { speed: 0.15, amplitude: 10, phase: 0 }, 
                }
            }
        }
    },
    SANKOPA: {
        containerName: 'sankopa3d', 
        classRef: Dynamics3D, 
        zIndex: Z_INDEX.CARD,
        objectConfig: {
            type: 'sankopa',
            color: CARD_COLORS.SANKOPA,
            decoration: {
                patch: decoration3Svg,
                options: {
                    emissive: CARD_COLORS.SANKOPA,
                },
            },
            mesh: {
                shape: 'box',
                geometry: [1.8, 1, 0.4],
                scale: { x: 0.8, y: 0.5, z: 1 },
                position: { x: 0, y: 0.5, z: -0.5 },
                material: {
                    color: CARD_COLORS.SANKOPA,
                    emissive: CARD_COLORS.SANKOPA,
                },
            },
            animationParams: {
                group: {
                position: {
                    x: {phase: Math.PI/3,},
                    y: {phase: Math.PI/3,},
                    z: {speed: 0.09, amplitude: 9,  phase: Math.PI/3,}
                },
                rotation: {
                    x: { phase: Math.PI/3,},
                    y: { phase: Math.PI/3,},
                    z: { phase: Math.PI/3,},
                    },
                }
            }
        }
    },
};

const CONFIG_GLOW = {
    containerName: 'DYNAMICS_GLOW',
    zIndex: Z_INDEX.GLOW,
    classRef: Glow,
    camera: {
        position: {
            x: 0,
            y: 0,
            z: 2,
        },
    },
    objectConfig: {
        objectOptions: {
            movement: {
                enabled: false,
                zEnabled: false,
                speed: 0.1,
                range: {
                    x: 0,
                    y: 0,   
                    z: 0.5,
                }
            },
            positioning: {
                mode: 'element',
                align: 'center center',
                offset: { 
                    x: 0, 
                    y: 0, 
                }
            },
        },
        shaderOptions: {
            scale: {
                min: 0, 
                max: 1
            },
            opacity: {
                min: 0, 
                max: 0.6,
            },
            pulse: {
                enabled: true, 
                speed: { 
                    min: 0.1, 
                    max: 0.3 
                }, 
                intensity: 1,
                randomize: false,
            },
            sync: {
                enabled: true,
                scale: true,
                opacity: true,
            },
        },
        individualOptions: [
            {
                shaderOptions: {
                    color: '#56FFEB',
                },
                objectOptions: {
                    positioning: {
                        targetSelector: '.dynamics .card--3d-left',
                    }
                }
            },
            {
                shaderOptions: {
                    color: '#4642F4', 
                },
                objectOptions: {
                    positioning: {
                        targetSelector: '.dynamics .card--3d-center',
                    }
                }
            },
            {
                shaderOptions: {
                    color: '#F00AFE', 
                },
                objectOptions: {
                    positioning: {
                        targetSelector: '.dynamics .card--3d-right',
                    }
                }
            }
        ],
    }
};
const CONFIG = {
    GLOW: CONFIG_GLOW,
    CARD_GUARDIANS: CONFIG_CARDS.GUARDIANS,
    CARD_METAVERSE: CONFIG_CARDS.METAVERSE,
    CARD_SANKOPA: CONFIG_CARDS.SANKOPA,
};

export class DynamicsSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG, Z_INDEX.SECTION);
        /**
         * @type {Object3DSyncManager|null}
         */
        this.syncManager = null;
    }

    /**
     * @override
     * @description Initialize the section
     * @returns {Promise<void>}
     */
    async initSection() {
        await super.initSection();

        const cardKeys = ['CARD_GUARDIANS', 'CARD_METAVERSE', 'CARD_SANKOPA'];
        const cards = cardKeys
            .map(key => this.controllers[key])
            .filter(card => !!card);

        let glows = [];
        if (this.controllers.GLOW && Array.isArray(this.controllers.GLOW.glows)) {
            glows = this.controllers.GLOW.glows;
        }

        if (this.syncManager && typeof this.syncManager.cleanup === 'function') {
            this.syncManager.cleanup();
        }

        this.syncManager = new Object3DSyncManager(cards, glows, (card, glow) => {
            if (glow && typeof glow.syncWithObjectPosition === 'function') {
                glow.syncWithObjectPosition(card);
            }
        });

        if (this.controllers.GLOW) {
            this.controllers.GLOW.syncManager = this.syncManager;
        }
    }

    /**
     * @override
     * @description Update the position of the glows by the card
     */
    onResize() {
        super.onResize();
        if (this.controllers.GLOW && Array.isArray(this.controllers.GLOW.glows)) {
            const camera = this.controllers.GLOW.cameraController?.camera;
            this.controllers.GLOW.glows.forEach(glow => {
                if (typeof glow.updatePositionByCard === 'function') {
                    glow.updatePositionByCard(camera);
                }
            });
        } 
    }

    /**
     * @override
     * @description Update the section and synchronize the glows with the cards
     */
    update() {
        super.update();
        if (this.syncManager) {
            this.syncManager.update();
        }
    }

    cleanup() {
        if (this.syncManager && typeof this.syncManager.cleanup === 'function') {
            this.syncManager.cleanup();
            this.syncManager = null;
        }
        super.cleanup();
    }
}


