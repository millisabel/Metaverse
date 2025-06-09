import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';
import * as THREE from 'three';

const ANIMATED_SVG_DEFAULT_OPTIONS = {
};

export class AnimatedSVGScene extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, ANIMATED_SVG_DEFAULT_OPTIONS);

        this.svgUrl = this.options.svgUrl;
        this.svgOptions = this.options.svgOptions || {};
    }

    async setupScene() {
        // Получаем опции из objectConfig
        let targetElement = this.options.targetElement;
        if (typeof targetElement === 'string') {
            targetElement = document.querySelector(targetElement);
        }
        const meshOptions = {
            ...this.options,
            camera: this.cameraController.camera,
            renderer: this.renderer,
            targetElement
        };
        this.animatedSVGMesh = new AnimatedSVGMesh(this.options.svgUrl, meshOptions);
        this.scene.add(this.animatedSVGMesh);
        await this.animatedSVGMesh.onSVGLoaded();

        const mesh = this.animatedSVGMesh;
        const camera = this.cameraController.camera;
        const domElement = document.getElementById('explore-3d');
        const renderer = this.renderer;

        // fitMeshToElement(mesh, camera, domElement, renderer);
    }

    update(delta) {
        if (this.animatedSVGMesh && this.animatedSVGMesh.update) {
            this.animatedSVGMesh.update(delta);
        }
        super.update();
    }

    cleanup() {
        console.log("dispose");
        if (this.animatedSVGMesh) {
            this.scene.remove(this.animatedSVGMesh);
        }
        super.cleanup();
    }
}


