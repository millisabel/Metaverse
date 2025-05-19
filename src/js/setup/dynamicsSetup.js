import { Universal3DSection } from '../utilsThreeD/Universal3DSection';
import { Dynamics3D } from '../components/three/dynamics3d';
import { Glow } from '../components/three/glow';

import { isMobile } from '../utils/utils';

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
        isSectionController: false, 
        id: 'guardians3d',
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
            glow: {
                enabled: true,
                options: {
                    shaderOptions: {
                        color: CARD_COLORS.GUARDIANS,
                    }
                }
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
        isSectionController: false, 
        id: 'metaverse3d',
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
            glow: {
                enabled: true,
                options: {
                    shaderOptions: {
                        color: CARD_COLORS.METAVERSE
                    }
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
        isSectionController: false, 
        id: 'sankopa3d',
        zIndex: Z_INDEX.CARD,
        objectConfig: {
            type: 'sankopa',
            color: CARD_COLORS.SANKOPA,
            object_3d: {
            },
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
            glow: {
                enabled: true,
                options: {
                    shaderOptions: {
                        color: CARD_COLORS.SANKOPA,
                    }
                }
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
    camera: {
        position: {
            x: 0,
            y: 0,
            z: 0
        }
    },
    classRef: Glow,
    objectConfig: {
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
};

const CONFIG = {
    CARD_GUARDIANS: CONFIG_CARDS.GUARDIANS,
    CARD_METAVERSE: CONFIG_CARDS.METAVERSE,
    CARD_SANKOPA: CONFIG_CARDS.SANKOPA,
    // GLOW: CONFIG_GLOW,
};

export class DynamicsSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, CONFIG, Z_INDEX.SECTION);
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


