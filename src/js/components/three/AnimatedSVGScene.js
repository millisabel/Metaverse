import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';

const ANIMATED_SVG_DEFAULT_OPTIONS = {
};

/**
 * @description AnimatedSVGScene
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options object
 * @returns {AnimatedSVGScene}
 */
export class AnimatedSVGScene extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, ANIMATED_SVG_DEFAULT_OPTIONS);

        this.svgUrl = this.options.svgUrl;
        this.svgOptions = this.options.svgOptions || {};
    }

    /**
     * @description Setup the scene
     * @returns {Promise<void>}
     */
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

    /**
     * @description Update the scene
     * @param {number} delta - The delta time
     * @returns {void}
     */
    update(delta) {
        if (this.animatedSVGMesh && this.animatedSVGMesh.update) {
            this.animatedSVGMesh.update(delta);
        }
        super.update();
    }

    /**
     * @description Cleanup the scene
     * @returns {void}
     */
    cleanup() {
        if (this.animatedSVGMesh) {
            this.scene.remove(this.animatedSVGMesh);
        }
        super.cleanup();
    }
}


