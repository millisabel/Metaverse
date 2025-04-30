import { BaseSetup } from '../utilsThreeD/baseSetup';
import { Stars } from "../components/three/stars";
import { Constellation } from '../components/three/constellation';
import { isMobile } from "../utils/utils";
import * as THREE from 'three';

export class AboutSetup extends BaseSetup {
    constructor() {
        super('about', 'AboutSetup');
        
        this.CONTAINER_TYPES = {
            STARS: 'STARS',
            CONSTELLATION: 'CONSTELLATION'
        };

        this.Z_INDEX = {
            BACKGROUND: '0',
            STARS: '1',
            CONSTELLATION: '2'
        };
    }

    init() {
        if (!this.canInitialize()) return;

        // create stars 
        const starsContainer = this.createContainer(
            this.CONTAINER_TYPES.STARS,
            this.Z_INDEX.STARS
        );

        new Stars(starsContainer, {
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
                z: [300, -400] 
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
        new Constellation(constellationContainer);

        this.completeInitialization();
    }

    cleanup() {
        if (!this.canCleanup()) return;
        
        this.cleanupContainer(this.CONTAINER_TYPES.STARS);
        this.cleanupContainer(this.CONTAINER_TYPES.CONSTELLATION);
        this.completeCleanup();
    }
}

export function initAbout() {
    const sectionAbout = new AboutSetup();
    sectionAbout.init();
}