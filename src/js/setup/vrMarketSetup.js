import { SectionController } from '../controllers/SectionController';
import { Glow } from '../components/three/glow';
import { CharacterFloatingBadge } from '../components/ui/CharacterFloatingBadge';

const SECTION_ID = 'vr-market';
const Z_INDEX = {
    SECTION: 0,
    GLOW_VR_MARKET: -1,
    CARD_VR_MARKET: 2,
}; 
const CONFIG_VR_MARKET = {
    GLOW_VR_MARKET: {
        containerName: 'VR_MARKET_GLOW',
        zIndex: Z_INDEX.GLOW_VR_MARKET,
        classRef: Glow,
        objectConfig: {
            count: 4,
            colorPalette: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            objectOptions: {
                movement: {
                    enabled: true,
                    speed: 0.01,
                    range: { x: 1, y: 1, z: 1 }
                }
            },
            shaderOptions: {
                opacity: { min: 0, max: 0.1 },
                scale: { min: 0.5, max: 2 },
                pulse: {
                    enabled: true,
                    speed: 0.1,
                    intensity: 3,
                    randomize: true,
                }
            },
            responsive: {
                768: {
                    objectOptions: {
                        movement: {
                            range: { x: 2, y: 2, z: 1 }
                        }
                    },
                }
            }
        }
    }
};

export class VRMarketSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG_VR_MARKET, Z_INDEX.SECTION);

        this.setupBadge();
    }

    setupBadge() {
        const badgeElement = document.querySelector('.game-character--badge');
        const section = document.getElementById(SECTION_ID);
        
        if (badgeElement && section) {
            this.characterBadge = new CharacterFloatingBadge(badgeElement, section);
        }
    }
}
