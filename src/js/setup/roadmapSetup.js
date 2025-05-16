import { Glow } from "../components/three/glow";
import { Roadmap } from "../components/ui/roadmap";
import { MoreButton } from "../controllers/moreButton";
import { isMobile } from "../utils/utils";
import { Universal3DSection } from '../utilsThreeD/Universal3DSection';

const SECTION_ID = 'roadmap';
const CONFIG_3D = {
    GLOW: {
        classRef: Glow,
        containerName: 'GLOW',
        zIndex: 0,
        camera: {
            position: {
                x: 0,
                y: 0,
                z: 5
            }
        },
        objectConfig: {
            count: isMobile() ? 3 : 12,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            shuffleColors : true,
            size: {
                min: isMobile() ? 0.5 : 1.5,
                max: isMobile() ? 2 : 2
            },
            opacity: {
                min: 0.2,
                max: 0.3
            },
            scale: {
                min: 1,
                max: 2
            },
            pulse: {
                enabled: true,
                speed: 0.5,
                intensity: 1,
                sync: false
            },
            movement: {
                enabled: true,    
                zEnabled: true,
                speed: 0.1,
                range: {
                    x: 2,
                    y: 4,
                    z: 0.5,
                }
            },
            intersection: {
                enabled: true,
                selector: '.roadmap-quarter',
                lerpSpeed: 0.01,
            },
            position: { x: 0, y: 0, z: 0 },
            initialPositions: null,
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


