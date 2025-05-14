import { isMobile } from "../utils/utils";
import { Universal3DSection } from '../utilsThreeD/Universal3DSection';

import { Stars } from "../components/three/stars";
import { Constellation } from '../components/three/constellation';

import { initSlider } from '../components/common/slider';

const SECTION_ID = 'about';
const CONFIG = {
    STARS_WHITE: {
        classRef: Stars,
        containerName: 'STARS_WHITE',
        zIndex: 1,
        objectConfig: {
            count: isMobile() ? 2000 : 4000,
            colors: [0xFFFFFF],
            size: {
                min: 0.05,
                max: 1,
                multiplier: 1.5
            },
            depth: {
                z: [200, -300] 
            },
            movement: {
                probability: 0.2,
                speed: 0.0002,
                amplitude: {
                    x: 0.01,
                    y: 0.01,
                    z: 0.01
                }
            },
            material: {
                opacity: 0.7,
            },
        }
    },
    CONSTELLATION: {
        classRef: Constellation,
        containerName: 'CONSTELLATION',
        zIndex: 2,
        camera: {
            fov: 75,
            far: 1000,
            position: { x: 0, y: 0, z: 0 },
            rotation: false,
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
export class AboutSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, CONFIG);

        initSlider();
    }
}

