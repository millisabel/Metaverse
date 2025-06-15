import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';
import { deepMergeOptions } from '../../utils/utils';

/**
 * @description DecorativeLayerExploreScene
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options object
 * @returns {DecorativeLayerExploreScene}
 */
export class DecorativeLayerExploreScene extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options);
        this.svgMeshes = [];
    }

    /**
     * @description Setup the scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        if (Array.isArray(this.options.svg)) {
            for (const svgConfig of this.options.svg) {
                let mergedOptions = deepMergeOptions({}, this.options);
                mergedOptions = deepMergeOptions(mergedOptions, svgConfig);

                delete mergedOptions.svg;
                delete mergedOptions.responsive;

                const mesh = new AnimatedSVGMesh(this.options.svgUrl || svgConfig.svgUrl, {
                    ...mergedOptions, 
                    camera: this.cameraController?.camera, 
                    renderer: this.renderer, 
                    container: this.container});
                await mesh.onSVGLoaded();
                this.scene.add(mesh);
                this.svgMeshes.push(mesh);
            }
        }
    }

    /**
     * @description Get the responsive options
     * @param {Object} responsive - The responsive options
     * @param {number} width - The width of the container
     * @returns {Object} The responsive options
     */
    getResponsiveOptions(responsive, width) {
        if (!responsive) return {};
        const breakpoints = Object.keys(responsive)
            .map(Number)
            .filter(bp => width >= bp)
            .sort((a, b) => a - b);
        let result = {};
        for (const bp of breakpoints) {
            result = deepMergeOptions(result, responsive[bp]);
        }
        return result;
    }

    /**
     * @description Update the scene
     * @param {number} delta - The delta time
     * @returns {void}
     */
    update(delta) {
        this.svgMeshes.forEach(mesh => mesh.update && mesh.update(delta));
        super.update();
    }

    /**
     * @description Cleanup the scene
     * @returns {void}
     */
    cleanup() {
        this.svgMeshes.forEach(mesh => {
            mesh.cleanup && mesh.cleanup();
            this.scene.remove(mesh);
        });
        this.svgMeshes = [];
        super.cleanup();
    }
} 