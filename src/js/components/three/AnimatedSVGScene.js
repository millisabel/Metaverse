import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';

const ANIMATED_SVG_DEFAULT_OPTIONS = {
};

export class AnimatedSVGScene extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, ANIMATED_SVG_DEFAULT_OPTIONS);

        this.svgUrl = this.options.svgUrl;
        this.svgOptions = this.options.svgOptions || {};
    }

    async setupScene() {
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


