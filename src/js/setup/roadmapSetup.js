import { Glow } from "../components/three/glow";
import { Roadmap } from "../components/ui/roadmap";
import { MoreButton } from "../controllers/moreButton";
import { isMobile } from "../utils/utils";
import { Universal3DSection } from '../utilsThreeD/Universal3DSection';

const SECTION_ID = 'roadmap';
const CONFIG_3D = {
    GLOW: {
        classRef: Glow,
        containerName: 'ROADMAP_GLOW',
        zIndex: 2,
        camera: {
            position: {
                x: 0,
                y: 0,
                z: 10
            }
        },
        objectConfig: {
            count: isMobile() ? 3 : 12,
            colorPalette: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            shuffleColors : true,
            sizePx: 150,
            size: {
                min: isMobile() ? 0.5 : 1,
                max: isMobile() ? 2 : 2
            },
            movement: {
                enabled: true,    
                zEnabled: true,
                speed: 0.1,
                range: {
                    x: isMobile() ? 1 : 4,
                    y: 7,
                    z: 0.5,
                }
            },
            intersection: {
                enabled: true,
                selector: '.roadmap-quarter',
                colorVar: '--roamap-color',
                lerpSpeed: 0.005,
            },
            positioning: {
                mode: 'random', 
            },
            pulseControl: {
                enabled: true,
                randomize: true
            },
            shaderOptions: {
                opacity: {
                    min: 0.1,
                    max: 0.3
                },
                scale: {
                    min: 0.8,
                    max: 2.5
                },
                pulse: {
                    speed: { min: 0.1, max: 0.3 },
                    intensity: 1,
                    sync: false,
                },
                objectPulse: 0
            },
        },
    },
}
const CONFIG_ROADMAP = {
    zIndex: 1,
    classes: {
        container: 'roadmap-container',
        quarters: 'roadmap-quarter',
        timeline: 'roadmap-timeline',
        quartersContainer: 'roadmap-quarters-container',
        svgContainer: 'connection-lines',
    },
    dots: {
        count: 15,
        minSize: 1,
        maxSize: 5,
        minDuration: 2,
        maxDuration: 6,
        minOpacity: 0.05,
        maxOpacity: 1,
    },
}
const CONFIG_MORE_BUTTON = {
    classes: {
        button: 'more-btn',
        showItems: 'show',
        hiddenItems: 'hidden-items',
        list: 'roadmap-quarter-list',
    },
    revealDelay: 200,
    typingSpeed: 20,
    eraseSpeed: 15,
}

/**
 * @description RoadmapSetup class
 * @extends {Universal3DSection}
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options object
 */
export class RoadmapSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, CONFIG_3D);

        new Roadmap(this.container, CONFIG_ROADMAP);
        new MoreButton(this.container, CONFIG_MORE_BUTTON);
    }
}


