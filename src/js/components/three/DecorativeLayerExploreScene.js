import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';
import { deepMergeOptions } from '../../utils/utils';

export class DecorativeLayerExploreScene extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options);
        this.svgMeshes = [];
    }

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

    update(delta) {
        this.svgMeshes.forEach(mesh => mesh.update && mesh.update(delta));
        super.update();
    }

    cleanup() {
        this.svgMeshes.forEach(mesh => {
            mesh.cleanup && mesh.cleanup();
            this.scene.remove(mesh);
        });
        this.svgMeshes = [];
        super.cleanup();
    }
} 