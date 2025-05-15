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
        objectConfig: {
            count: isMobile() ? 3 : 10,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            shuffleColors : true,
            size: {
                min: isMobile() ? 0.5 : 1,
                max: isMobile() ? 1 : 2
            },
            opacity: {
                min: 0.05,
                max: 0.2
            },
            scale: {
                min: 0.5,
                max: 1.5
            },
            pulse: {
                speed: 0.1,
                intensity: 3,
                sync: false
            },
            movement: {
                enabled: true,
                speed: 0.006,
                range: {
                    x: 2,
                    y: 5,
                    z: 0.1
                }
            },
            position: { x: 0, y: 0, z: 0 },
            initialPositions: null
        }   
    },
}
const CONFIG_ROADMAP = {
    zIndex: 1,
    selectors: {
        container: '.roadmap-container',
        quarters: '.roadmap-quarter',
        timeline: '.roadmap-timeline',
        quartersContainer: '.roadmap-quarters-container',
        svgContainer: '.connection-lines',
    },
    classes: {
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
    }
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
    revealDelay: 200,
}


export class RoadmapSetup extends Universal3DSection {
    constructor() {
        super(SECTION_ID, CONFIG_3D);

        new Roadmap(this.container, CONFIG_ROADMAP);
        new MoreButton(this.container, CONFIG_MORE_BUTTON);
    }
}


