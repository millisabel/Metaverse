import { SectionController } from '../controllers/SectionController';

import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';

import { isMobile } from "../utils/utils";


/**
 * SECTION_ID
 * @description The section id for the hero section
 * @type {string}
 */
const SECTION_ID = 'hero';

/**
 * Z_INDEX
 * @description The z-index for the hero section
 * @type {Object}
 */
const Z_INDEX = {
    SECTION: 0,
    STARS: 2,
    GALACTIC: 1,
};

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
            rotation: false, 
        },
        objectConfig: {
            count: isMobile() ? 2000 : 5000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0x4642f4, 0xFFFFFF],
            },
        },
    // GALACTIC: {
    //     classRef: GalacticCloud,
    //     containerName: NAME_3D_OBJECTS.GALACTIC,
    //     zIndex: Z_INDEX.GALACTIC,
    //     camera: {
    //         fov: 60,
    //         far: 1000,
    //         position: { x: 0, y: 5, z: 15 },
    //         rotation: true,
    //         orbitSpeed: 0.2, 
    //         zoomPrimaryFreq: 0.3,
    //         zoomSecondaryFreq: 0.1,
    //         zoomMicroFreq: 0.8,

    //     },
    //     objectConfig: {
    //         core: {
    //             size: 2,
    //             minScale: 1.5,
    //             pulse: 4,
    //             opacity: 0.4,
    //             pulseFreq: 2.0
    //         },
    //         plane: {
    //             size: isMobile() ? 4 : 8,
    //             opacity: 0.7,
    //             transparent: true,
    //             animation: {
    //                 baseScale: 1.0,
    //             }
    //         },
    //         bloom: {
    //             strength: 1, 
    //             radius: 3,
    //             threshold: 0.4, 
    //         },
    //     }
    // }
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

