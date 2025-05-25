import { isMobile } from "../utils/utils";
import { SectionController } from '../controllers/SectionController';

import { Stars } from "../components/three/stars";
import { Constellation } from '../components/three/constellation';

import { initSlider } from '../components/common/slider';

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
    STARS: 2,
    GALACTIC: 1,
};

const CONFIG = {
    STARS_WHITE: {
        classRef: Stars,
        containerName: NAME_3D_OBJECTS.STARS,
        zIndex: Z_INDEX.STARS,
        objectConfig: {
            count: isMobile() ? 1000 : 2000,
            colors: [0xFFFFFF],
            size: {
                min: 2,
                max: 5,
            },
            depth: {
                range: isMobile() ? 200 : 400,
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
                count: 'isMobile() ? 1000 : 2000',
                depth: {
                    range: 'isMobile() ? 250 : 500',
                },
            }
            
        }
    },
    // CONSTELLATION: {
    //     classRef: Constellation,
    //     containerName: 'CONSTELLATION',
    //     zIndex: 2,
    // }
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

