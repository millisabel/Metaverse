import { Glow } from "../components/three/glow";
import { Roadmap } from "../components/ui/roadmap";
import { MoreButton } from "../components/common/moreButton";
import { isMobile } from "../utils/utils";
import { SectionController } from '../controllers/SectionController';

const SECTION_ID = 'roadmap';
const NAME_3D_OBJECTS = {
    GLOW: 'ROADMAP_GLOW',
};
const Z_INDEX = {
    SECTION: 0,
    ROADMAP: 1,
    GLOW: 2,
};
const CONFIG_3D = {
    GLOW: {
        classRef: Glow,
        containerName: NAME_3D_OBJECTS.GLOW,
        zIndex: Z_INDEX.GLOW,
        objectConfig: {
            count: isMobile() ? 4 : 12,
            colorPalette: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            shuffleColors : true,
            objectOptions: {
                movement: {
                    enabled: true,    
                    zEnabled: true,
                    speed: 0.05,
                    range: {
                        x: isMobile() ? 1 : 3,
                        y: 4,
                        z: 2,
                    }
                },
                intersection: {
                    enabled: true,
                    selector: '.roadmap-quarter',
                    colorVar: '--roamap-color',
                    lerpSpeed: 0.005,
                },
            },
            shaderOptions: {
                opacity: {
                    min: 0.05,
                    max: 0.3
                },
                scale: {
                    min: 0.9,
                    max: 2.5
                },
                pulse: {
                    enabled: true,
                    speed: { min: 0.2, max: 0.5 },
                    intensity: 1.1,
                    randomize: true,
                },
            },
            responsive: {
                count: 'isMobile() ? 4 : 12',
                objectOptions: {
                    movement: {
                        range: {
                            x: 'isMobile() ? 1 : 3',
                            y: '4',
                            z: '2',
                        }
                    },
                },
            },
        },
    },
}
const CONFIG_ROADMAP = {
    zIndex: Z_INDEX.ROADMAP,
    classes: {
        container: 'roadmap-container',
        quarters: 'roadmap-quarter',
        timeline: 'roadmap-timeline',
        quartersContainer: 'roadmap-quarters-container',
        svgContainer: 'connection-lines',
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
 * @description The setup for the roadmap section
 * @type {Object}
 * @property {Object} GLOW - The glow
 * @extends {SectionController}
 */
export class RoadmapSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG_3D, Z_INDEX.SECTION);
        
        new Roadmap(this.container, CONFIG_ROADMAP);
        new MoreButton(this.container, CONFIG_MORE_BUTTON);
    }
}


