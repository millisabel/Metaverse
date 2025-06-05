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
            depth: {
                range: 400,
            },
            responsive: {
                768: {
                    count: 2000,
                    depth: {
                        range: 800,
                    },
                },
            }
        },
    },
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

