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
            GUARDIANS_CARD: 'GUARDIANS_CARD',
            METAVERSE_CARD: 'METAVERSE_CARD',
            SANKOPA_CARD: 'SANKOPA_CARD',
            BACKGROUND_GLOWS: 'BACKGROUND_GLOWS'
        };
        
        this.Z_INDEX = {
            BACKGROUND_GLOWS: '-1',
            GUARDIANS_CARD: '1',
            METAVERSE_CARD: '1',
            SANKOPA_CARD: '1',
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
        
        this.guardiansCard = null;
        this.metaverseCard = null;
        this.sankopaCard = null;
        this.backgroundGlows = null;
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
            dynamicsSection.appendChild(glowContainer);

            // Create three background glows with colors matching the cards
            this.backgroundGlows = new Glow(glowContainer, {
                count: 3, // One for each card
                colors: [
                    this.CARD_CONFIG.GUARDIANS_CARD.color,
                    this.CARD_CONFIG.METAVERSE_CARD.color,
                    this.CARD_CONFIG.SANKOPA_CARD.color
                ],
                randomizeColors: false,
                size: {
                    min: 0.0,
                    max: 1.0
                },
                opacity: {
                    min: 0.1,
                    max: 0.4
                },
                scale: {
                    min: 0,
                    max: 4
                },
                movement: {
                    enabled: false
                },
                initialPositions: [
                    { x: -1.5, y: 0.5, z: -2 }, // Left for Guardians
                    { x: 0, y: 0.5, z: -2 },  // Center for Metaverse
                    { x: 1.5, y: 0.5, z: -2 }   // Right for Sankopa
                ]
            });
        }

        // Setup cards
        const guardiansContainer = document.getElementById('guardians3d');
        if (guardiansContainer) {
            const container = this.createContainer(
                this.CONTAINER_TYPES.GUARDIANS_CARD,
                this.Z_INDEX.GUARDIANS_CARD
            );
            guardiansContainer.appendChild(container);
            this.guardiansCard = new Dynamics3D(container, {
                type: this.CONTAINER_TYPES.GUARDIANS_CARD,
                ...this.CARD_CONFIG.GUARDIANS_CARD
            });
        }

        const metaverseContainer = document.getElementById('metaverse3d');
        if (metaverseContainer) {
            const container = this.createContainer(  
                this.CONTAINER_TYPES.METAVERSE_CARD,
                this.Z_INDEX.METAVERSE_CARD
            );
            metaverseContainer.appendChild(container);
            this.metaverseCard = new Dynamics3D(container, {
                type: this.CONTAINER_TYPES.METAVERSE_CARD,
                ...this.CARD_CONFIG.METAVERSE_CARD
            });
        }

        const sankopaContainer = document.getElementById('sankopa3d');
        if (sankopaContainer) {
            const container = this.createContainer(
                this.CONTAINER_TYPES.SANKOPA_CARD,
                this.Z_INDEX.SANKOPA_CARD
            );
            sankopaContainer.appendChild(container);
            this.sankopaCard = new Dynamics3D(container, {
                type: this.CONTAINER_TYPES.SANKOPA_CARD,
                ...this.CARD_CONFIG.SANKOPA_CARD
            });
        }
    }

    update() {
        // Update cards
        if (this.guardiansCard) {
            this.guardiansCard.update();
            if (this.backgroundGlows) {
                this.backgroundGlows.syncWithCard(this.guardiansCard, 0); // sync first glow
            }
        }
        if (this.metaverseCard) {
            this.metaverseCard.update();
            if (this.backgroundGlows) {
                this.backgroundGlows.syncWithCard(this.metaverseCard, 1); // sync second glow
            }
        }
        if (this.sankopaCard) {
            this.sankopaCard.update();
            if (this.backgroundGlows) {
                this.backgroundGlows.syncWithCard(this.sankopaCard, 2); // sync third glow
            }
        }
    }

    cleanup() {
        if (this.backgroundGlows) {
            this.cleanupContainer(this.CONTAINER_TYPES.BACKGROUND_GLOWS);
        }
        if (this.guardiansCard) {
            this.cleanupContainer(this.CONTAINER_TYPES.GUARDIANS_CARD);
        }
        if (this.metaverseCard) {
            this.cleanupContainer(this.CONTAINER_TYPES.METAVERSE_CARD);
        }
        if (this.sankopaCard) {
            this.cleanupContainer(this.CONTAINER_TYPES.SANKOPA_CARD);
        }
        
        super.cleanup();    
    }
}

export function initDynamics() {
    const dynamicsSetup = new DynamicsSetup();
    return dynamicsSetup;
}


