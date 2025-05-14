import { isMobile } from "../utils/utils";
import { Universal3DSection } from '../utilsThreeD/Universal3DSection';

import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';

/**
 * SECTION_ID
 * @description The section id for the hero section
 * @type {string}
 */
const SECTION_ID = 'hero';

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
        containerName: 'STARS',
        zIndex: 2, 
        camera: {
            containerName: 'STARS',
            rotation: true, 
            speed: { x: 0.000002, y: 0.000002 },
        },
        objectConfig: {
            count: isMobile() ? 2000 : 5000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
            size: {
                min: 1,
                max: 4,
                multiplier: isMobile() ? 2 : 2.3, 
            },
            depth: {
                range: isMobile() ? 300 : 800, 
                z: [300, -400] 
            },
            movement: {
                speed: 0.0015,
                amplitude: {
                    x: 0.01,
                    y: 0.01,
                    z: 0.01
                    }
                },
            },
        },
    GALACTIC: {
        classRef: GalacticCloud,
        containerName: 'GALACTIC',
        zIndex: 1,
        camera: {
            fov: 60,
            far: 1000,
            position: { x: 0, y: 5, z: 15 },
            rotation: true,
        },
        objectConfig: {
            core: {
                size: 2,
            },
            plane: {
                size: isMobile() ? 4 : 8,
                opacity: 0.6,
                transparent: true,
            },
            bloom: {
                strength: 2, 
                radius: 3,
                threshold: 0.2, 
            },
            animation: {
                minScale: 1,
                    corePulse: 5,
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
export class HeroSetup extends Universal3DSection {
    constructor() {
      super(SECTION_ID, CONFIG);
    }
  }

