import { SectionController } from '../controllers/SectionController';
import { ExploreScene } from '../components/three/exploreScene';
import { Glow } from '../components/three/glow';
import { DecorativeLayerExploreScene } from '../components/three/DecorativeLayerExploreScene';

const SECTION_ID = 'explore';

const Z_INDEX = {
    SECTION: 0,
    GLOW: -1,
    EXPLORE_SCENE: 1,
    ANIMATED_SVG: -2,
};
const NAME_3D_OBJECTS = {
    GLOW: 'EXPLORE_GLOW',
    ANIMATED_SVG: 'ANIMATED_SVG',
    EXPLORE_SCENE: 'EXPLORE_SCENE'
};  


const CONFIG_EXPLORE = {
    GLOW: {
        classRef: Glow,
        containerName: SECTION_ID,
        zIndex: Z_INDEX.GLOW, 
        objectConfig: {
            objectOptions: {
                positioning: {
                    mode: 'element',
                    targetSelector: '#explore-3d',
                    align: 'center center',
                    offset: { x: 100, y: 0 },
                    initialPosition: { x: 0, y: 0, z: 0 },
                },
                movement: { enabled: false },
            },
            shaderOptions: {
                pulse: {
                    enabled: true,
                    intensity: 3,
                }
            },
            individualOptions: [
                {
                    objectOptions: {
                        positioning: {
                            offset: { z: 0},
                        }
                    },
                    shaderOptions: {
                        color: 0xf7ea05,
                        opacity: { min: 0.8, max: 1 },
                        scale: { min: 0.7, max: 1 },
                        pulse: {
                            speed: { min: 0.1, max: 0.2 },
                        }
                    }
                },
                {
                    objectOptions: {
                        positioning: {
                            offset: { z: -1},
                        }
                    },
                    shaderOptions: {
                        color: 0x7A42F4,
                        opacity: { min: 0.4, max: 0.8 },
                        scale: { min: 1, max: 1.5 },
                        pulse: {
                            speed: { min: 0.2, max: 0.4 },
                        }
                    }
                },
                {
                    objectOptions: {
                        positioning: {
                            offset: { z: -2},
                        }
                    },
                    shaderOptions: {
                        color: 0xF00AFE,
                        opacity: { min: 0.5, max: 0.9 },
                        scale: { min: 1.4, max: 1.9 },
                        pulse: {
                            speed: { min: 0.3, max: 0.6 },
                        }
                    }
                },
                {
                    objectOptions: {
                        positioning: {
                            offset: { z: -3},
                        }
                    },
                    shaderOptions: {
                        color: 0x7A42F4,
                        opacity: { min: 0.6, max: 1 },
                        scale: { min: 1.8, max: 2 },
                        pulse: {
                            speed: { min: 0.4, max: 0.8 },
                        }
                    }
                },
                
            ]
        }
    },
    EXPLORE_SCENE: {
        classRef: ExploreScene,
        containerName: 'explore-3d',
        zIndex: Z_INDEX.EXPLORE_SCENE,
        objectConfig: {
        }
    },
    ANIMATED_SVG: {
        classRef: DecorativeLayerExploreScene,
        zIndex: Z_INDEX.ANIMATED_SVG,
        camera: {
            type: 'orthographic',
            position: { x: 0, y: 0, z: 5 },
            lookAt: { x: 0, y: 0, z: 0 },
        },
        objectConfig: {
            svgUrl: 'assets/images/explore_3D/grid_background.svg',
            targetElement: '#explore-3d',
            mode: 'dom',
            scaleFactor: { x: 1.2, y: 0.5 },
            position: { x: 0, y: 0, z: 0 },
            rotation: {
                enabled: false,
            },
            pulse: { 
                enabled: true,  
            },
            opacityPulse: {
                enabled: true,
            },
            wave: { 
                enabled: true,
            },
            svg: [
                {
                    color: 0x4642F4,
                    position: { x: 0, y: 0, z: -1 },
                    scaleFactor: { x: 1.1, y: 0.4 },
                    rotation: {
                        direction: 'right',
                        speed: 0.03
                    },
                    pulse: {
                        min: 0.8, 
                        max: 1.2, 
                        speed: 0.05, 
                    },
                    opacityPulse: {
                        min: 0.9,
                        max: 1,
                        base: 1
                    },
                    wave: { 
                        amp: 15, 
                        waveSpeed: 0.7, 
                        smoothRadius: 5, 
                        freq: 1 
                    },
                },
                {
                    color: 0xF00AFE,
                    position: { x: 0, y: 0, z: -2 },
                    scaleFactor: { x: 1.12, y: 0.41 },
                    rotation: { 
                        direction: 'left',
                        speed: 0.04
                    },
                    pulse: { 
                        min: 0.8, 
                        max: 1.2, 
                        speed: 0.06, 
                    },
                    opacityPulse: {
                        min: 0.1,
                        max: 0.2,
                        base: 0.2
                    },
                    wave: { 
                        amp: 10, 
                        waveSpeed: 0.6, 
                        smoothRadius: 10, 
                        freq: 2 
                    }
                },
                {
                    color: 0x7A42F4,
                    position: { x: 0, y: 0, z: -3 },
                    scaleFactor: { x: 1.13, y: 0.42 },
                    rotation: {  
                        direction: 'right',
                        speed: 0.05
                    },
                    pulse: { 
                        min: 0.9, 
                        max: 1.1, 
                        speed: 0.07, 
                    },
                    opacityPulse: {
                        min: 0,
                        max: 0.1,
                        base: 0.1
                    },
                    wave: { 
                        amp: 5, 
                        waveSpeed: 0.5, 
                        smoothRadius: 20, 
                        freq: 3 
                    }
                },
            ],
            responsive: {
                375: {
                    svg: [
                        {
                            scaleFactor: { x: 1.1, y: 0.5 },
                        },
                        {
                            scaleFactor: { x: 1.12, y: 0.51 },
                        },
                        {
                            scaleFactor: { x: 1.12, y: 0.52 },
                        },
                    ]
                },
                768: {
                    svg: [
                        {
                            scaleFactor: { x: 1, y: 0.6 }, 
                        },
                        {
                            scaleFactor: { x: 1.01, y: 0.61 }, 
                        },
                        {
                            scaleFactor: { x: 1.02, y: 0.62 }, 
                        },
                    ]
                },
                1024: {
                    svg: [
                        {
                            scaleFactor: { x: 1.5, y: 0.4 }, 
                        },
                        {
                            scaleFactor: { x: 1.51, y: 0.41 }, 
                        },
                        {
                            scaleFactor: { x: 1.52, y: 0.42 }, 
                        },
                    ]
                },
                1200: {
                    rotation: {
                        enabled: true,
                    },
                    svg: [
                        {
                            scaleFactor: { x: 1.5, y: 0.7 }, 
                            min: 1.8, 
                            max: 2,
                        },
                        {
                            scaleFactor: { x: 1.05, y: 0.705 }, 
                        },
                        {
                            scaleFactor: { x: 1.06, y: 0.8 }, 
                        },
                    ]
                }
            }
        }
    }
};

export class ExploreSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG_EXPLORE, Z_INDEX.SECTION); 
    }
}
