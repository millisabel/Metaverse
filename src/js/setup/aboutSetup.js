import * as THREE from 'three';

import { ContainerManager } from '../utils/containerManager';
import { Stars } from '../components/three/stars';
import { Constellation } from '../components/three/constellation';

export class AboutSetup {
    constructor() {
        this.container = document.getElementById('about');
        this.initialized = false;
    }

    init() {
        if (!this.container || this.initialized) return;

        const starsManager = new ContainerManager(this.container, { zIndex: '0' });

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

        const constellationManager = new ContainerManager(this.container, { zIndex: '2' });
        const constellationContainer = constellationManager.create();
        new Constellation(constellationContainer);

        this.initialized = true;
    }
}

export function initAbout() {
    const aboutBackground = new AboutSetup();
    aboutBackground.init();
}