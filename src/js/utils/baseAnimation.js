import * as THREE from 'three';
import { AnimationController } from './animationController_3D';
import { createCanvas, updateRendererSize } from './canvasUtils';

export class BaseAnimation extends AnimationController {
    constructor(container, options = {}) {
        super(container);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.options = {
            fov: 75,
            near: 0.1,
            far: 2000,
            zIndex: '0',
            ...options
        };
    }

    initScene() {
        if (this.isInitialized) return;
        console.log(`[${this.name}] Initializing scene`);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            this.options.fov,
            this.container.clientWidth / this.container.clientHeight,
            this.options.near,
            this.options.far
        );
        
        const { renderer } = createCanvas(this.container, { 
            zIndex: this.options.zIndex 
        });
        this.renderer = renderer;
        
        this.isInitialized = true;
    }

    onResize() {
        if (!this.renderer || !this.camera) return;
        updateRendererSize(this.renderer, this.container, this.camera);
    }

    cleanup() {
        console.log(`[${this.name}] Starting cleanup`);
        super.cleanup();
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
            console.log(`[${this.name}] Renderer disposed`);
        }
        
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.scene = null;
            console.log(`[${this.name}] Scene disposed`);
        }
        
        console.log(`[${this.name}] Cleanup completed`);
    }
} 