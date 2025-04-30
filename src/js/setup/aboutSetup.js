import * as THREE from 'three';

import { ThreeDContainerManager } from '../utilsThreeD/ThreeDContainerManager';
import { Stars } from '../components/three/stars';
import { Constellation } from '../components/three/constellation';

import { createLogger } from '../utils/logger';

export class AboutSetup {
    constructor() {
        this.container = document.getElementById('about');
        this.initialized = false;
        
        this.name = 'AboutSetup';
        this.logger = createLogger(this.name);

        this.CONTAINER_TYPES = {
            STARS: 'STARS',
            CONSTELLATION: 'CONSTELLATION'
        };

        this.Z_INDEX = {
            BACKGROUND: '0',
            STARS: '1',
            CONSTELLATION: '2',
        };
    }

    init() {
        if (!this.container || this.initialized) return;

        this.logger.log({
            conditions: 'init',
            functionName: 'init'
        });

        // create stars 
        const starsManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.STARS,
            zIndex: this.Z_INDEX.STARS
        });
        const starsContainer = starsManager.create();
        new Stars(starsContainer, {
            count: window.innerWidth < 768 ? 2000 : 4000,
            colors: [0xFFFFFF],
            size: {
                min: 0.05,
                max: 1,
                attenuation: true,
                multiplier: 1.5
            },
            depth: {
                range: window.innerWidth < 768 ? 500 : 1000,
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
        const constellationManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.CONSTELLATION,
            zIndex: this.Z_INDEX.CONSTELLATION
        });
        const constellationContainer = constellationManager.create();
        new Constellation(constellationContainer);

        this.initialized = true;

        this.logger.log({
            type: 'success',
            functionName: 'init'
        });
    }

    cleanup() {
        if (!this.initialized) return;
        
        const starsManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.STARS
        });
        const constellationManager = new ThreeDContainerManager(this.container, { 
            type: this.CONTAINER_TYPES.CONSTELLATION
        });
        
        starsManager.cleanup();
        constellationManager.cleanup();
        
        this.initialized = false;
    }
}

export function initAbout() {
    const sectionAbout = new AboutSetup();
    sectionAbout.init();
}