import { SectionController } from '../controllers/SectionController';

import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';


/**
 * SECTION_ID
 * @description The section id for the hero section
 * @type {string}
 */
const SECTION_ID = 'hero';

/**
 * NAME_3D_OBJECTS
 * @description The name of the 3D objects
 * @type {Object}
 */
const NAME_3D_OBJECTS = {
    STARS: 'STARS',
    GALACTIC: 'GALACTIC',
};

/**
 * Z_INDEX
 * @description The z-index for the hero section
 * @type {Object}
 */
const Z_INDEX = {
    SECTION: 2,
    STARS: 1,
    GALACTIC: 0,
};

/**
 * HERO_3D_OBJECTS
 * @description The 3D objects for the hero section
 * @type {Object}
 * @property {Object} STARS - The stars
 * @property {Object} GALACTIC - The galactic cloud
 */
const CONFIG = {
    STARS: {
        classRef: Stars,
        containerName: NAME_3D_OBJECTS.STARS,
        zIndex: Z_INDEX.STARS, 
        camera: {
            rotation: true, 
            speed: { x: 0, y: 0, z: 0.00005 },
        },
        objectConfig: {
            count: 1000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0x4642f4, 0xf00afe, 0xffffff],
            size: {
                min: 4,
                max: 6,
            },
            depth: {
                range: 400,
            },
            responsive: {
                768: {
                    count: 2000,
                    depth: {
                        range: 600,
                    },
                },
                1200: {
                    count: 3000,
                    size: {
                        min: 3,
                        max: 6,
                    },
                    depth: {
                        range: 700,
                    },
                },
            }
        },
    },
    GALACTIC: {
        classRef: GalacticCloud,
        containerName: NAME_3D_OBJECTS.GALACTIC,
        zIndex: Z_INDEX.GALACTIC,
        objectConfig: {
            orbit: {
                rotation: {
                    x: Math.PI / 3,
                    y: 0,
                    z: 0,
                },
                initialOffset: {
                    x: 0,
                    y: -2,
                    z: -2,
                },
                amplitude: {
                    x: { min: 0, max: 0 },
                    y: { min: -2, max: 1 },
                    z: { min: -2, max: -5 },
                },
                scale: {
                    min: 1,
                    max: 3,
                },
                speedPulse: 0.005,
                speedMove: 0,
            },
            core: {
                size: 2,               
                segments: 4,           
                shader: {               
                    opacity: 0.5, 
                    color: {
                        core: [1.0, 1.0, 1.0], 
                        edge: [0.8, 0.4, 1.0],
                    },
                    transitionRadius: 0.3,
                    pulse: {
                        amplitudeCore: 0.10, 
                        amplitudeEdge: 0.50, 
                        speedCore: 0.5,
                        speedEdge: 1.3,
                    },
                }
            },
            plane: {
                size: 2,
                opacity: 1,
                transparent: false,
                rotationSpeed: 0.0005,
            },
            responsive: {
                768: {
                    core: {
                        size: 3, 
                    },
                    plane: {
                        size: 3,
                    },
                },
                1200: {
                    orbit: {
                        initialOffset: {
                            x: 3,
                            y: -2,
                        },
                        amplitude: {
                            x: { min: -5, max: 3 },
                            y: { min: -1, max: 3 },
                            z: { min: -2, max: -5 },
                        },
                        speedMove: 0.01,
                    },
                },
            },
        }
    }
};

/**
 * HERO_3D_OBJECTS
 * @description The 3D objects for the hero section
 * @type {Object}
 * @property {Object} STARS - The stars
 * @property {Object} GALACTIC - The galactic cloud
 */
export class HeroSetup extends SectionController {
    constructor() {
      super(SECTION_ID, CONFIG, Z_INDEX.SECTION);
    }
  }

