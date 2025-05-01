import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Dynamics3D } from '../components/three/dynamics3d';

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
            GUARDIANS_CARD: 'GUARDIANS_CARD ',
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
        
        this.guardiansCard = null;
        this.metaverseCard = null;
        this.sankopaCard = null;
        this.glow = null;
    }

    setupScene() { 
        const guardiansContainer = document.getElementById('guardians3d');
        if (guardiansContainer) {
            this.guardiansCard = this.createContainer(
                this.CONTAINER_TYPES.GUARDIANS_CARD,
                this.Z_INDEX.GUARDIANS_CARD
            );
            this.guardiansCard = new Dynamics3D(guardiansContainer, {
                type: this.CONTAINER_TYPES.GUARDIANS_CARD,
                color: 0x38DBFF
            });
        }

        // Create and initialize Metaverse 3D object
        const metaverseContainer = document.getElementById('metaverse3d');
        if (metaverseContainer) {
            this.metaverseCard = this.createContainer(  
                this.CONTAINER_TYPES.METAVERSE_CARD,
                this.Z_INDEX.METAVERSE_CARD
            );
            this.metaverseCard = new Dynamics3D(metaverseContainer, {
                type: this.CONTAINER_TYPES.METAVERSE_CARD,
                color: 0x2B6BF3
            });
        }

        // Create and initialize Sankopa 3D object
        const sankopaContainer = document.getElementById('sankopa3d');
        if (sankopaContainer) {
            this.sankopaCard = this.createContainer(
                this.CONTAINER_TYPES.SANKOPA_CARD,
                this.Z_INDEX.SANKOPA_CARD
            );
            this.sankopaCard = new Dynamics3D(sankopaContainer, {
                type: this.CONTAINER_TYPES.SANKOPA_CARD,
                color: 0xE431FF
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
        if (this.guardiansObject) {
            this.guardiansObject.update();
        }
        if (this.metaverseObject) {
            this.metaverseObject.update();
        }
        if (this.sankopaObject) {
            this.sankopaObject.update();
        }
        if (this.glow) {
            this.glow.update();
        }
    }

    cleanup() {
        if (this.guardiansObject) {
            this.cleanupContainer(this.CONTAINER_TYPES.GUARDIANS_CARD);
        }
        if (this.metaverseObject) {
            this.cleanupContainer(this.CONTAINER_TYPES.METAVERSE_CARD);
        }
        if (this.sankopaObject) {
            this.cleanupContainer(this.CONTAINER_TYPES.SANKOPA_CARD);
        }
        if (this.glow) {
            this.cleanupContainer(this.CONTAINER_TYPES.GLOW);
        }
        
        super.cleanup();    
    }
}

export function initDynamics() {
    const sectionDynamics = new DynamicsSetup();
}


