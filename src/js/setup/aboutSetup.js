import { SectionController } from '../controllers/SectionController';

import { Stars } from "../components/three/stars";
import { Constellation } from '../components/three/constellation';

import { initSlider } from '../components/common/slider';
import constellationsData from '../data/constellations.json';

const SECTION_ID = 'about';

/**
 * NAME_3D_OBJECTS
 * @description The name of the 3D objects
 * @type {Object}
 */
const NAME_3D_OBJECTS = {
    STARS: 'STARS_WHITE',
    GALACTIC: 'CONSTELLATION',
};

/**
 * Z_INDEX
 * @description The z-index for the about section
 * @type {Object}
 */
const Z_INDEX = {
    SECTION: 0,
    STARS: 1,
    CONSTELLATION: 2,
};

const CONFIG = {
    STARS_WHITE: {
        classRef: Stars,
        containerName: NAME_3D_OBJECTS.STARS,
        zIndex: Z_INDEX.STARS,
        objectConfig: {
            count: 1000,
            colors: [0xFFFFFF],
            size: {
                min: 3,
                max: 5,
            },
            depth: {
                range: 200,
                z: [200, -300]
            },
            movement: {
                enabled: false,
            },
            flicker: {
                fast: {
                    probability: 0.5,
                    speed: { min: 0.1, max: 0.2 },
                    amplitude: { min: 0.5, max: 1.5 },  
                },
                slow: {
                    probability: 0.5,
                    speed: { min: 0.01, max: 0.05 },
                    amplitude: { min: 0.5, max: 1.5 },
                }
            },
            shader: {
                opacity: 0.5,
                uniforms: {
                    glowStrength: { value: 2.5 },
                }
            },
            responsive: {
                768: {
                    count: 1500,
                    size: {
                        min: 2,
                        max: 5,
                    },
                    depth: {
                        range: 250,
                    },
                },
                1200: {
                    count: 2000,
                    depth: {
                        range: 500,
                    },
                },
            },
        }
    },
    CONSTELLATION: {
        classRef: Constellation,
        containerName: 'CONSTELLATION',
        zIndex: Z_INDEX.CONSTELLATION,
        objectConfig: {
            countConstellations: 6,
            constellation: {
                distance: {
                    max: -50,
                    min: -10,
                },
                screen: {
                    max: 20,
                },
            },
            stars: {
                size: 0.7,
                opacity: 0.8,
                activeSize: 2,
                nextSize: 1,
                pulseAmplitude: 1,
                pulseSpeed: 0.05,
                transitionSpeed: 0.02,
            },
            responsive: {
                768: {
                    countConstellations: 30,
                    constellation: {
                        distance: {
                            max: -100,
                        },
                        screen: {
                            max: 100,
                        },
                    },
                },
                1200: {
                    countConstellations: constellationsData.length,
                    constellation: {
                        distance: {
                            max: -150,
                        },
                        screen: {
                            max: 150,
                        },
                    },
                    stars: {
                        size: 0.5,
                        pulseAmplitude: 0.7,
                    },
                },
            },
        },
    }
}

/**
 * AboutSetup
 * @description The setup for the about section
 * @type {Object}
 * @property {Object} STARS_WHITE - The white stars
 * @property {Object} CONSTELLATION - The constellation
 * @extends {Universal3DSection}
 */
export class AboutSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG, Z_INDEX.SECTION);

        initSlider();
    }
}

