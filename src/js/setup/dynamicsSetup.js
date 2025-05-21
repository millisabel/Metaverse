import { Universal3DSection } from '../controllers/Universal3DSection';
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
const CARD_NAMES = {
    GUARDIANS: 'CARD_GUARDIANS',
    METAVERSE: 'CARD_METAVERSE',
    SANKOPA: 'CARD_SANKOPA',
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
    classRef: Glow,
    objectConfig: {
        objectOptions: {
            size: { min: 0.1, max: 0.1 }, 
            movement: {
                enabled: false,
                zEnabled: true,
                speed: 0.1,
                range: {
                    x: 0,
                    y: 0,   
                    z: 0.5,
                }
            },
            scale: {
                min: 0, 
                max: 10
            },
            positioning: {
                mode: 'element',
                align: isMobile ? 'top center' : 'center center',
                offset: { x: 0, y: isMobile ? 0 : -100 }
            },
            pulseControl: {
                enabled: true,
                randomize: false,
            },
        },
        shaderOptions: {
            scale: {
                min: 0, 
                max: 10
            },
            opacity: {
                min: 0, 
                max: 0.3,
            },
            pulse: {
                enabled: true, 
                speed: { 
                    min: 0.1, 
                    max: 0.3 
                }, 
                intensity: 1,
                randomize: false,
                sync: {
                    enabled: false,
                    scale: true,
                    opacity: true,
                },
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
        ]
    }
};
const cardKeys = ['CARD_GUARDIANS', 'CARD_METAVERSE', 'CARD_SANKOPA'];
const CONFIG = {
    CARD_GUARDIANS: CONFIG_CARDS.GUARDIANS,
    CARD_METAVERSE: CONFIG_CARDS.METAVERSE,
    CARD_SANKOPA: CONFIG_CARDS.SANKOPA,
    GLOW: CONFIG_GLOW,
};

export class DynamicsSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, CONFIG, Z_INDEX.SECTION);
    }

    syncWithCard(card3D, cardIndex) {
        if (this.controllers.GLOW && typeof this.controllers.GLOW.syncWithCard === 'function') {
            this.controllers.GLOW.syncWithCard(card3D, cardIndex);
        }
    }

    update() {
        super.update();
        cardKeys.forEach((key, index) => {
            const card = this.controllers[key];
            if (card) {
                this.syncWithCard(card, index);
            }
        });
    }
}


