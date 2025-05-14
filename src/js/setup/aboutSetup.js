import { createLogger } from '../utils/logger';
import { isMobile } from "../utils/utils";
import { Universal3DSection } from '../utilsThreeD/Universal3DSection';

import { Stars } from "../components/three/stars";
import { Constellation } from '../components/three/constellation';


const SECTION_ID = 'about';
const OBJECTS_3D_ABOUT = {
    STARS_WHITE: {
        classRef: Stars,
        containerName: 'STARS_WHITE',
        zIndex: 1,
        count: isMobile() ? 2000 : 4000,
        colors: [0xFFFFFF],
        size: {
            min: 0.05,
            max: 1,
            attenuation: true,
            multiplier: 1.5
        },
        depth: {
            range: isMobile() ? 500 : 1000,
            z: [200, -300] 
        },
        movement: {
            enabled: true,
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
            transparent: true,
            // blending: THREE.AdditiveBlending
        },
    },
    CONSTELLATION: {
        classRef: Constellation,
        containerName: 'CONSTELLATION',
        zIndex: 2,
        lights: {
            ambientColor: 0xffffff,
            ambientIntensity: 0.7,
            pointColor: 0xffffff,
            pointIntensity: 1.5,
            pointPosition: { x: 0, y: 10, z: 10 },
        },
        // color: 0xffffff, // цвет по умолчанию
        // count: 20,        // количество созвездий
        animationSpeed: 0.3, // скорость анимации
        starCount: 100, // количество звезд в созвездии
        starSize: 0.05, // размер звезды
        starSpeed: 0.0001, // скорость звезды
        starOpacity: 0.7, // прозрачность звезды
        starColor: 0xFFFFFF, // цвет звезды
        starPosition: {
            x: 0,       
        }

    }
}

export class AboutSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, OBJECTS_3D_ABOUT);

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

