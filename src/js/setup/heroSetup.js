import { createLogger } from '../utils/logger';
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
const HERO_3D_OBJECTS = {
    STARS: {
        classRef: Stars,
        containerName: 'STARS',
        zIndex: 2, 
        camera: {
            rotation: true, 
            speed: { x: 0.000002, y: 0.000002 },
        },
        count: isMobile() ? 2000 : 4000,
        colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
        size: {
            min: 1,
            max: 3.5,
            multiplier: isMobile() ? 2 : 2.2 
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
        core: {
            size: 2,
        },
        plane: {
            size: isMobile() ? 4 : 15,
            opacity: 0.6,
            transparent: true,
        },
        bloom: {
            strength: 0.5, 
            radius: isMobile() ? 0.1 : 2,
            threshold: 0.2, 
        },
        animation: {
            minScale: 1,
            corePulse: 5,
        },
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
      super(SECTION_ID, HERO_3D_OBJECTS);

      this.logger = createLogger(this.constructor.name);

      this.logger.log({
        functionName: 'constructor',
        conditions: ['init'],
        customData: {
            this: this
        }
      });
    }
  }

