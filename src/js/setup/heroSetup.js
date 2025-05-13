import { createLogger } from '../utils/logger';
import { isMobile } from "../utils/utils";

import { Stars } from "../components/three/stars";
import { GalacticCloud } from '../components/three/galactic';
import { Universal3DSection } from '../utilsThreeD/Universal3DSection';

const SECTION_ID = 'hero';
const HERO_3D_OBJECTS = {
    STARS: {
        classRef: Stars,
        containerName: 'STARS',
        zIndex: 2, 
        count: isMobile() ? 1000 : 4000,
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
            enabled: true,
            probability: 0.15,
            speed: 0.0015,
            amplitude: {
                x: 0.01,
                y: 0.01,
                z: 0.01
            }
        },
        material: {
            opacity: 1,
            transparent: true
        },
        camera: {
            rotation: true,
            position: { z: -50 }, 
            speed: { x: 0.00001, y: 0.00001 }
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
        }
    }
};

export class HeroSetup extends Universal3DSection {
    constructor() {
      // Передаём id контейнера и объект с параметрами 3D-объектов
      super(SECTION_ID, HERO_3D_OBJECTS);

      this.logger.log({
        functionName: 'constructor',
        conditions: ['init'],
        customData: {
            this: this
        }
      });
    }
  }

export function initHero() {
    const sectionHero = new HeroSetup();
}