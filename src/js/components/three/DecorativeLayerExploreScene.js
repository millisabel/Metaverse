import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';
import { SingleGlow } from './singleGlow';

export class DecorativeLayerExploreScene extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options);
        this.svgMeshes = [];
        this.glowMeshes = [];
    }

    async setupScene() {
        // SVG
        if (Array.isArray(this.options.svg)) {
            for (const svgConfig of this.options.svg) {
                const mesh = new AnimatedSVGMesh(svgConfig.svgUrl, {
                    ...svgConfig,
                    camera: this.cameraController?.camera,
                    renderer: this.renderer,
                    container: this.container,
                });
                await mesh.onSVGLoaded();
                this.scene.add(mesh);
                this.svgMeshes.push(mesh);
            }
        }
        // Glow
        if (Array.isArray(this.options.glow)) {
            for (const glowConfig of this.options.glow) {
                const glow = new SingleGlow(glowConfig);
                glow.setup();
                this.scene.add(glow.mesh);
                this.glowMeshes.push(glow);
            }
        }
    }

    update(delta) {
        this.svgMeshes.forEach(mesh => mesh.update && mesh.update(delta));
        this.glowMeshes.forEach(glow => glow.update && glow.update(delta));
        super.update();
    }

    cleanup() {
        this.svgMeshes.forEach(mesh => this.scene.remove(mesh));
        this.glowMeshes.forEach(glow => this.scene.remove(glow));
        this.svgMeshes = [];
        this.glowMeshes = [];
        super.cleanup();
    }
} 