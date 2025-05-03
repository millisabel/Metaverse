import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Dynamics3D } from '../components/three/dynamics3d';
import * as THREE from 'three';
import decoration1Svg from '../../assets/images/dynamics/decoration_1.svg';
import decoration2Svg from '../../assets/images/dynamics/decoration_2.svg';
import decoration3Svg from '../../assets/images/dynamics/decoration_3.svg';
import { Glow } from '../components/three/glow';

export class DynamicsSetup extends BaseSetup {
    constructor() {
        super('dynamics', 'DynamicsSetup', {
            camera: {
                fov: 75,
                aspect: 1,
                near: 0.1,
                far: 1000,
                position: { z: 5 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: true,
                speed: { x: 0.00001, y: 0.00001 }
            }
        });   
    
        this.CONTAINER_TYPES = {
            BACKGROUND_GLOWS: 'BACKGROUND_GLOWS',
            GUARDIANS: 'GUARDIANS_CARD',
            METAVERSE: 'METAVERSE_CARD',
            SANKOPA: 'SANKOPA_CARD'
        };
        
        this.Z_INDEX = {
            BACKGROUND_GLOWS: '-2',
            CARDS: '0'
        };

        this.CARD_CONFIG = {
            GUARDIANS_CARD: {
                color: 0x00FFFF,
                decoration: decoration1Svg,
                glow: {
                    enabled: true,
                    size: 2.0,
                    opacity: 0.5,
                    scale: { min: 2, max: 5 },
                    color: 0x00FFFF
                }
            },
            METAVERSE_CARD: {
                color: 0x4169FF,
                decoration: decoration2Svg,
                glow: {
                    enabled: true,
                    size: 2.0,
                    opacity: 0.7,
                    scale: { min: 2, max: 6 },
                    color: 0x4169FF
                }
            },
            SANKOPA_CARD: {
                color: 0xFF00FF,
                decoration: decoration3Svg,
                glow: {
                    enabled: true,
                    size: 2.0,
                    opacity: 0.4,
                    scale: { min: 2, max: 6 },
                    color: 0xFF00FF
                }
            }
        };
        
        this.backgroundGlows = null;
        this.cards = {};  // Store card references
    }

    initScene() {
        if (this.initialized) return;

        this.scene = new THREE.Scene();
        
        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        this.setupScene();
        
        this.initialized = true;
    }

    setupScene() { 
        // Create background glows first
        const dynamicsSection = document.getElementById('dynamics');
        if (dynamicsSection) {
            const glowContainer = this.createContainer(
                this.CONTAINER_TYPES.BACKGROUND_GLOWS,
                this.Z_INDEX.BACKGROUND_GLOWS
            );
            
            // Ensure the glow container is added first
            if (dynamicsSection.firstChild) {
                dynamicsSection.insertBefore(glowContainer, dynamicsSection.firstChild);
            } else {
                dynamicsSection.appendChild(glowContainer);
            }

            // Create three background glows with colors matching the cards
            this.backgroundGlows = new Glow(glowContainer, {
                count: 3,
                colors: [
                    this.CARD_CONFIG.GUARDIANS_CARD.color,
                    this.CARD_CONFIG.METAVERSE_CARD.color,
                    this.CARD_CONFIG.SANKOPA_CARD.color
                ],
                randomizeColors: false,
                size: {
                    min: 1.0,
                    max: 2.0
                },
                opacity: {
                    min: 0.05,
                    max: 0.3
                },
                scale: {
                    min: 1.0,
                    max: 4.0
                },
                pulse: {
                    enabled: false
                },
                movement: {
                    enabled: false
                },
                initialPositions: [
                    { x: -1.5, y: 0, z: -2 },
                    { x: 0, y: 0, z: -2 },
                    { x: 1.5, y: 0, z: -2 }
                ]
            });
        }

        // Setup cards
        const guardiansContainer = document.getElementById('guardians3d');
        if (guardiansContainer) {
            this.cards.guardians = new Dynamics3D(guardiansContainer, {
                type: this.CONTAINER_TYPES.GUARDIANS,
                ...this.CARD_CONFIG.GUARDIANS_CARD
            });
        }

        const metaverseContainer = document.getElementById('metaverse3d');
        if (metaverseContainer) {
            this.cards.metaverse = new Dynamics3D(metaverseContainer, {
                type: this.CONTAINER_TYPES.METAVERSE,
                ...this.CARD_CONFIG.METAVERSE_CARD
            });
        }

        const sankopaContainer = document.getElementById('sankopa3d');
        if (sankopaContainer) {
            this.cards.sankopa = new Dynamics3D(sankopaContainer, {
                type: this.CONTAINER_TYPES.SANKOPA,
                ...this.CARD_CONFIG.SANKOPA_CARD
            });
        }

        // Start syncing background glows with cards
        this.startBackgroundGlowSync();
    }

    startBackgroundGlowSync() {
        if (!this.backgroundGlows) return;

        const animate = () => {
            // Sync each background glow with its corresponding card
            if (this.cards.guardians) {
                this.backgroundGlows.syncWithCard(this.cards.guardians, 0);
            }
            if (this.cards.metaverse) {
                this.backgroundGlows.syncWithCard(this.cards.metaverse, 1);
            }
            if (this.cards.sankopa) {
                this.backgroundGlows.syncWithCard(this.cards.sankopa, 2);
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    update() {
        // Update cards
        if (this.cards.guardians) {
            this.cards.guardians.update();
        }
        if (this.cards.metaverse) {
            this.cards.metaverse.update();
        }
        if (this.cards.sankopa) {
            this.cards.sankopa.update();
        }
    }

    cleanup() {
        if (this.backgroundGlows) {
            this.cleanupContainer(this.CONTAINER_TYPES.BACKGROUND_GLOWS);
        }
        if (this.cards.guardians) {
            this.cleanupContainer(this.CONTAINER_TYPES.GUARDIANS);
        }
        if (this.cards.metaverse) {
            this.cleanupContainer(this.CONTAINER_TYPES.METAVERSE);
        }
        if (this.cards.sankopa) {
            this.cleanupContainer(this.CONTAINER_TYPES.SANKOPA);
        }
        
        super.cleanup();    
    }
}

export function initDynamics() {
    const dynamicsSetup = new DynamicsSetup();
    return dynamicsSetup;
}


