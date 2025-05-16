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
            count: isMobile() ? 2000 : 6000,
            colors: [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF],
            size: {
                min: 1,
                max: 3,
                attenuation: true,
                multiplier: isMobile() ? 2 : 2.3, 
            },
            depth: {
                range: isMobile() ? 300 : 800, 
                z: [300, -400] 
            },
            movement: {
                enabled: true,
                probability: 0.15,
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
            orbitSpeed: 0.2, 
            zoomPrimaryFreq: 0.3,
            zoomSecondaryFreq: 0.1,
            zoomMicroFreq: 0.8,

        },
        objectConfig: {
            core: {
                size: 2,
                minScale: 1.5,
                pulse: 4,
                opacity: 0.4,
                pulseFreq: 2.0
            },
            plane: {
                size: isMobile() ? 4 : 8,
                opacity: 0.7,
                transparent: true,
                animation: {
                    baseScale: 1.0,
                }
            },
            bloom: {
                strength: 1, 
                radius: 3,
                threshold: 0.4, 
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

