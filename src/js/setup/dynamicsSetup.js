import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Dynamics3D } from '../components/three/dynamics3d';
import * as THREE from 'three';
import decoration1Svg from '../../assets/images/dynamics/decoration_1.svg';
import decoration2Svg from '../../assets/images/dynamics/decoration_2.svg';
import decoration3Svg from '../../assets/images/dynamics/decoration_3.svg';

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
            GLOW: 'GLOW',
        };
        
        this.Z_INDEX = {
            GLOW: '0',
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
                    opacity: 0.7,
                    scale: { min: 1, max: 3},
                    pulseSpeed: 0.3,
                    pulseIntensity: 0.8,
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
                    scale: { min: 1.2, max: 3 },
                    pulseSpeed: 0.3,
                    pulseIntensity: 0.8,
                    color: 0x4169FF
                }
            },
            SANKOPA_CARD: {
                color: 0xFF00FF,
                decoration: decoration3Svg,
                glow: {
                    enabled: true,
                    size: 2.0,
                    opacity: 0.5,
                    scale: { min: 1.2, max: 3.5 },
                    pulseSpeed: 0.3,
                    pulseIntensity: 0.8,
                    color: 0xFF00FF
                }
            }
        };
        
        this.guardiansCard = null;
        this.metaverseCard = null;
        this.sankopaCard = null;
        this.glow = null;
    }

    initScene() {
        if (this.initialized) return;

        // Не создаем renderer и canvas здесь, так как они будут созданы в каждом Dynamics3D компоненте
        this.scene = new THREE.Scene();
        
        // Initialize camera
        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        // Setup additional scene elements
        this.setupScene();
        
        this.initialized = true;
    }

    setupScene() { 
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

        // Create and initialize Metaverse 3D object
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

        // Create and initialize Sankopa 3D object
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

        // Initialize glow effect if needed
        // const glowContainer = this.createContainer(
        //     this.CONTAINER_TYPES.GLOW,
        //     this.Z_INDEX.GLOW
        // );
        // this.glow = new Glow(glowContainer);    
    }

    update() {
        if (this.guardiansCard) {
            this.guardiansCard.update();
        }
        if (this.metaverseCard) {
            this.metaverseCard.update();
        }
        if (this.sankopaCard) {
            this.sankopaCard.update();
        }
        if (this.glow) {
            this.glow.update();
        }
    }

    cleanup() {
        if (this.guardiansCard) {
            this.cleanupContainer(this.CONTAINER_TYPES.GUARDIANS_CARD);
        }
        if (this.metaverseCard) {
            this.cleanupContainer(this.CONTAINER_TYPES.METAVERSE_CARD);
        }
        if (this.sankopaCard) {
            this.cleanupContainer(this.CONTAINER_TYPES.SANKOPA_CARD);
        }
        if (this.glow) {
            this.cleanupContainer(this.CONTAINER_TYPES.GLOW);
        }
        
        super.cleanup();    
    }
}

export function initDynamics() {
    const dynamicsSetup = new DynamicsSetup();
    return dynamicsSetup;
}


