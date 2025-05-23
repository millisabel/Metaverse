import { BaseSetup } from '../utilsThreeD/baseSetup';
import { SocialCard } from '../components/three/socialCards';
import { Glow } from "../components/three/glow";
import { isMobile } from '../utils/utils';

export class SocialSetup extends BaseSetup {
    constructor() {
        super('social', 'SocialSetup', {
            camera: {
                position: { z: -1 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: false,
                speed: { x: 0.0005, y: 0.0005 }
            }
        });

        this.CONTAINER_TYPES = {
            SOCIAL: 'SOCIAL ',
            GLOW: 'GLOW',
        };

        this.Z_INDEX = {
            SOCIAL: '1',
            GLOW: '-1',
        };

        this.SOCIAL_CARDS = [
            { 
                id: 'twitter', 
                name: 'TWITTER', 
                texture: 'assets/images/social/twitter.png', 
                color: 0x56FFEB,
                zIndex: this.Z_INDEX.SOCIAL,
            },
            { 
                id: 'telegram', 
                name: 'TELEGRAM', 
                texture: 'assets/images/social/telegram.png', 
                color: 0xF00AFE,
                zIndex: this.Z_INDEX.SOCIAL,
            },
            { 
                id: 'youtube', 
                name: 'YOUTUBE', 
                texture: 'assets/images/social/youtube.png', 
                color: 0x4642F4,
                zIndex: this.Z_INDEX.SOCIAL,
            },
            { 
                id: 'discord', 
                name: 'DISCORD', 
                texture: 'assets/images/social/discord.png', 
                color: 0x7A42F4,
                zIndex: this.Z_INDEX.SOCIAL,
            }
        ];

        this.GLOW_CONFIG = {
            count: isMobile() ? 4 : 8,
            colors: ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB', '#396eb3', '#693391', '#368084', '#873987'],
            size: {
                min: isMobile() ? 1 : 2,
                max: isMobile() ? 2 : 4
            },
            movement: {
                enabled: true,
                speed: 0.001,
                range: {
                    x: 1,
                    y: 0.9,
                    z: 0.3
                }
            },
            opacity: {
                min: 0.1,
                max: 0.3
            },
            scale: {
                min: 0.8,
                max: 2
            },
            pulse: {
                speed: 0.2,
                intensity: 0.1,
                sync: false
            },
            zIndex: this.Z_INDEX.GLOW
        };


        this.socialCardsInstances = [];
        this.glow = null;
    }

    async setupScene() {
        const carouselInner = document.querySelector('#carouselSocial .carousel-inner');
        if (!carouselInner) return;
    
        this.cleanup();
        this.socialCardsInstances = [];
    
        carouselInner.innerHTML = '';
    
        for (let i = 0; i < this.SOCIAL_CARDS.length; i++) {
            const cardData = this.SOCIAL_CARDS[i];
            this.createSocialCard(carouselInner, cardData, i);
        }

        this._boundHandleResizeAll = this.handleResizeAll.bind(this);
        window.addEventListener('resize', this._boundHandleResizeAll);

        const glowContainer = this.createContainer(
            this.CONTAINER_TYPES.GLOW, 
            this.Z_INDEX.GLOW
        );
        
        this.glow = new Glow(glowContainer, this.GLOW_CONFIG);
    }

    createSocialCard(parent,cardData, i) {  
        const carouselItem = document.createElement('div');
        carouselItem.classList.add('carousel-item');
        carouselItem.setAttribute('data-social-id', cardData.id);
        if (i === 0) carouselItem.classList.add('active');

        const carouselLink = document.createElement('a');
        carouselLink.href = cardData.link || '#';
        carouselLink.classList.add('carousel-link');
        carouselItem.appendChild(carouselLink);
    
        const cardOptions = {
            data: cardData
        };

        const socialCard = new SocialCard(carouselLink, cardOptions);
        
        this.socialCardsInstances.push(socialCard);

        parent.appendChild(carouselItem);   
    }

    handleResizeAll() {
        this.socialCardsInstances.forEach(card => {
            if (typeof card.handleResize === 'function') {
                card.handleResize();
            }
        });
    }

    update() {
        if (this.glow) {
            this.glow.update();
        }
        
    }

    cleanup() {
        if (this.glow) {
            this.cleanupContainer(this.CONTAINER_TYPES.GLOW);
            this.glow = null;
        }
        

        if (this.socialCardsInstances && this.socialCardsInstances.length) {
            this.socialCardsInstances.forEach(card => {
                if (card && typeof card.dispose === 'function') {
                    card.dispose();
                }
            });
        }
        this.socialCardsInstances = [];
        const carouselInner = document.querySelector('#carouselSocial .carousel-inner');
        if (carouselInner) {
            const items = carouselInner.querySelectorAll('.carousel-item');
            items.forEach(item => {
                if (item.hasAttribute('data-social-id')) {
                    carouselInner.removeChild(item);
                }
            });
        }
        window.removeEventListener('resize', this._boundHandleResizeAll);
        super.cleanup();
    }
}

export function initSocial() {
    const sectionSocial = new SocialSetup();
    sectionSocial.setupScene();
}

