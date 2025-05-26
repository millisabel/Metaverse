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
    SECTION: 0,
    STARS: 2,
    GALACTIC: 1,
};

/**
 * HERO_3D_OBJECTS
 * @description The 3D objects for the hero section
 * @type {Object}
 * @property {Object} STARS - The stars
 * @property {Object} GALACTIC - The galactic cloud
 */
const CONFIG = {
    // STARS: {
    //     classRef: Stars,
    //     containerName: NAME_3D_OBJECTS.STARS,
    //     zIndex: Z_INDEX.STARS, 
    //     camera: {
    //         rotation: false, 
    //     },
    //     objectConfig: {
    //         count: isMobile() ? 1000 : 2000,
    //         colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0x4642f4, 0xf00afe, 0xffffff],
    //         depth: {
    //             range: isMobile() ? 400 : 800,
    //         },
    //         responsive: {
    //             count: 'isMobile() ? 2000 : 5000',
    //             depth: {
    //                 range: 'isMobile() ? 400 : 800',
    //             },
    //         }
    //     },
    // },
    GALACTIC: {
        classRef: GalacticCloud,
        containerName: NAME_3D_OBJECTS.GALACTIC,
        zIndex: Z_INDEX.GALACTIC,
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

