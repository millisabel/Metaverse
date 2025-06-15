import { SectionController } from '../controllers/SectionController';
import { SocialCard } from '../components/three/socialCards';
import { Glow } from "../components/three/glow";

import { canUseWebP } from '../utilsThreeD/utilsThreeD';

const twitter = canUseWebP()
? './assets/images/social/twitter.webp'
: './assets/images/social/twitter.png';

const telegram = canUseWebP()
? './assets/images/social/telegram.webp'
: './assets/images/social/telegram.png';

const youtube = canUseWebP()
? './assets/images/social/youtube.webp'
: './assets/images/social/youtube.png';

const discord = canUseWebP()
? './assets/images/social/discord.webp'
: './assets/images/social/discord.png';

const SECTION_ID = 'social';
const NAME_3D_OBJECTS = {
    SOCIAL_CARDS: {
        TWITTER: 'TWITTER',
        TELEGRAM: 'TELEGRAM',
        YOUTUBE: 'YOUTUBE',
        DISCORD: 'DISCORD',
    },
    GLOW: 'GLOW',
};
const Z_INDEX = {
    SECTION: 0,
    SOCIAL_CARDS: 1,
    GLOW: -1,
};
const CONFIG_SOCIAL_CARDS = {
    TWITTER: {
        containerName: NAME_3D_OBJECTS.SOCIAL_CARDS.TWITTER,
        classRef: SocialCard,
        zIndex: Z_INDEX.SOCIAL_CARDS,
        objectConfig: {
            type: 'twitter',
            texture: twitter,
            color: 0x7A42F4,
        },
    },
    TELEGRAM: {
        containerName: NAME_3D_OBJECTS.SOCIAL_CARDS.TELEGRAM,
        classRef: SocialCard,
        zIndex: Z_INDEX.SOCIAL_CARDS,
        objectConfig: {
            type: 'telegram',
            texture: telegram,
            color: 0x4642F4,    
        },
    },
    YOUTUBE: {
        containerName: NAME_3D_OBJECTS.SOCIAL_CARDS.YOUTUBE,
        classRef: SocialCard,
        zIndex: Z_INDEX.SOCIAL_CARDS,
        objectConfig: {
            type: 'youtube',
            texture: youtube,
            color: 0xF00AFE,
        },
    },
    DISCORD: {
        containerName: NAME_3D_OBJECTS.SOCIAL_CARDS.DISCORD,
        classRef: SocialCard,
        zIndex: Z_INDEX.SOCIAL_CARDS,
        objectConfig: {
            type: 'discord',
            texture: discord,
            color: 0x56FFEB,
        },
    },
};

const CONFIG_SOCIAL_GLOW = {
    GLOW: {
        classRef: Glow,
        containerName: NAME_3D_OBJECTS.GLOW,
        zIndex: Z_INDEX.GLOW,
        objectConfig: {
            count: 1,
            colorPalette: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB', '#396eb3', '#693391', '#368084', '#873987'],
            shuffleColors : true,
            objectOptions: {
                positioning: {
                    mode: 'fixed',
                    targetSelector: null,
                    align: 'center center',
                    offset: { x: 0, y: 0 },
                    initialPosition: { x: 0, y: 0, z: 0 },
                },
                movement: {
                    enabled: false,    
                    zEnabled: false,
                    speed: 0.2,
                    range: {
                        x: 0.5,
                        y: 1,
                        z: 1
                    }
                },
                intersection: {
                    enabled: true,
                    selector: '#carouselSocial .carousel-item',
                    colorVar: '--item-color',
                    lerpSpeed: 0.005,
                },
            },
            shaderOptions: {
                opacity: {
                    min: 0.2,
                    max: 0.9
                },
                scale: {
                    min: 1,
                    max: 3
                },
                pulse: {
                    enabled: true,
                    speed: { min: 0.2, max: 1 },
                    intensity: 4,
                    randomize: true,
                },
            },
            responsive: {
                768:{
                    count: 4,
                    objectOptions: {
                        positioning: {
                            mode: 'random',
                        },
                        movement: {
                            enabled: true,
                            range: {
                                x: 1,
                                y: 1,
                                z: 1
                            }
                        },
                    },
                    shaderOptions: {
                        pulse: {
                            intensity: 1,
                        },
                    },
                },
                1024:{  
                    count: 6,
                    objectOptions: {
                        movement: {
                            enabled: true,
                            range: {
                                x: 3,
                                y: 2,
                                z: 1
                            }
                        },
                    },
                    shaderOptions: {
                        opacity: { min: 0.1, max: 0.5 },
                        pulse: {
                            intensity: 4,
                        },
                        scale: { min: 1, max: 1.5 },
                    },
                },
                1440:{
                    objectOptions: {
                        movement: {
                            range: {
                                x: 5,
                                y: 3,
                                z: 1
                            }
                        },
                    },
                },
            }
        }
    }
}

const CONFIG_SOCIAL = {
    GLOW: CONFIG_SOCIAL_GLOW.GLOW,
    SOCIAL_CARDS_TWITTER: CONFIG_SOCIAL_CARDS.TWITTER,
    SOCIAL_CARDS_TELEGRAM: CONFIG_SOCIAL_CARDS.TELEGRAM,
    SOCIAL_CARDS_YOUTUBE: CONFIG_SOCIAL_CARDS.YOUTUBE,
    SOCIAL_CARDS_DISCORD: CONFIG_SOCIAL_CARDS.DISCORD,
}


export class SocialSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG_SOCIAL, Z_INDEX.SECTION);
    }
}

