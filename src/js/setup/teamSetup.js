import { Glow } from '../components/three/glow';
import { SectionController } from '../controllers/SectionController';

const SECTION_ID = 'team';
const Z_INDEX = {
    SECTION: 0,
    GLOW: -1,
};
const CARD_SELECTOR = {
    CYAN: '#team .card--cyan',
    BLUE: '#team .card--blue',
    PURPLE: '#team .card--purple',
    PINK: '#team .card--pink',
};

const CONFIG_TEAM = {
    GLOW: {
        containerName: 'TEAM_GLOW',
        zIndex: Z_INDEX.GLOW,
        classRef: Glow,
        objectConfig: {
            count: 4,
            objectOptions: {
                positioning: {
                    mode: 'element',
                    align: 'center center',
                    offset: { 
                        x: 0, 
                        y: 0, 
                    }
                },
                intersection: {
                    enabled: true,
                    colorVar: '--card-current-color',
                    lerpSpeed: 0.05,
                },
            },
            shaderOptions: {
                scale: { min: 0, max: 2 },
                opacity: { min: 0, max: 1 },
                hover: {
                    enabled: true,
                    scale: { min: 0, max: 2 },
                    opacity: { min: 0, max: 1 },
                    speed: 0.05, 
                }
            },
            individualOptions: [
                {
                    objectOptions: {
                        positioning: {
                            targetSelector: CARD_SELECTOR.CYAN,
                        },
                        intersection: {
                            selector: CARD_SELECTOR.CYAN,
                        },
                    }
                },
                {
                    objectOptions: {
                        positioning: {
                            targetSelector: CARD_SELECTOR.BLUE,
                        },
                        intersection: {
                            selector: CARD_SELECTOR.BLUE,
                        },
                    }
                },
                {
                    objectOptions: {
                        positioning: {
                            targetSelector: CARD_SELECTOR.PURPLE,
                        },
                        intersection: {
                            enabled: false,
                            selector: CARD_SELECTOR.PURPLE,
                        },
                    },
                    shaderOptions: {
                        color: '#865edd',
                    }
                },
                {
                    objectOptions: {
                        positioning: {
                            targetSelector: CARD_SELECTOR.PINK,
                        },
                        intersection: {
                            selector: CARD_SELECTOR.PINK,
                        },
                    }
                },
            ]
        },
    },
}

export class TeamSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG_TEAM, Z_INDEX.SECTION);

        this.initSection();
    }

    async waitForGlows() {
        const glowController = this.controllers.GLOW;
        return new Promise(resolve => {
            const check = () => {
                if (glowController && Array.isArray(glowController.glows) && glowController.glows.length) {
                    resolve(glowController.glows);
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }

    async initSection() {
        await super.initSection();

        this.cards = [];
        for (const key in CARD_SELECTOR) {
            const card = document.querySelector(CARD_SELECTOR[key]);
            this.cards.push(card);
        }

        const glows = await this.waitForGlows();

        this.cards.forEach((card, i) => {
            const glow = glows[i];
            if (!glow) return;
            card.addEventListener('mouseenter', () => glow.setHighlight(true));
            card.addEventListener('mouseleave', () => glow.setHighlight(false));
        });
    }
}
