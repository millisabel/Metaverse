import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Stars } from "../components/three/stars";
import { Constellation } from '../components/three/constellation';
import { isMobile } from "../utils/utils";
import * as THREE from 'three';

export class AboutSetup extends BaseSetup {
    constructor() {
        super('about', 'AboutSetup', {
            camera: {
                position: { z: -100 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: false,
                speed: { x: 0.0005, y: 0.0005 }
            }
        });
        
        this.CONTAINER_TYPES = {
            STARS: 'STARS',
            CONSTELLATION: 'CONSTELLATION'
        };

        this.Z_INDEX = {
            BACKGROUND: '0',
            STARS: '1',
            CONSTELLATION: '2'
        };

        this.stars = null;
        this.constellation = null;
    }

    setupScene() {
        // create stars 
        const starsContainer = this.createContainer(
            this.CONTAINER_TYPES.STARS,
            this.Z_INDEX.STARS
        );

        this.stars = new Stars(starsContainer, {
            count: isMobile() ? 2000 : 4000,
            colors: [0xFFFFFF],
            size: {
                min: 0.05,
                max: 1,
                attenuation: true,
                multiplier: 1.5
            },
            depth: {
                range: isMobile() ? 500 : 1000,
                z: [300, -300] 
            },
            movement: {
                enabled: true,
                probability: 0.3,
                speed: 0.0003,
                amplitude: {
                    x: 0.02,
                    y: 0.02,
                    z: 0.02
                }
            },
            camera: {
                rotation: false,
                position: { z: -100 },
                speed: { x: 0.0005, y: 0.0005 } 
            },
            material: {
                opacity: 0.7,
                transparent: true,
                blending: THREE.AdditiveBlending
            }
        });

        // create constellation 
        const constellationContainer = this.createContainer(
            this.CONTAINER_TYPES.CONSTELLATION,
            this.Z_INDEX.CONSTELLATION
        );
        this.constellation = new Constellation(constellationContainer);
    }

    update() {
        if (this.stars) {
            this.stars.update();
        }
        if (this.constellation) {
            this.constellation.update();
        }
    }

    cleanup() {
        this.cleanupContainer(this.CONTAINER_TYPES.STARS);
        this.cleanupContainer(this.CONTAINER_TYPES.CONSTELLATION);
        super.cleanup();
    }
}

export function initAbout() {
    const sectionAbout = new AboutSetup();
}