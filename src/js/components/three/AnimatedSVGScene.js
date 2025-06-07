import { Object_3D_Controller } from '../../controllers/Object_3D_Controller';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';

export class AnimatedSVGScene extends Object_3D_Controller {
    constructor(container, options = {}) {
        super(container, {
            ...options,
            camera: {
                type: 'orthographic',
                position: { x: 0, y: 0, z: 10 }, 
                lookAt: { x: 0, y: 0, z: 0 },
                ...options.camera
            }
        });
        this.svgUrl = options.svgUrl;
        this.svgOptions = options.svgOptions || {};
    }

    setupScene() {
        this.animatedSVGMesh = new AnimatedSVGMesh(this.svgUrl, {
            ...this.svgOptions,
            container: this.container
        });
        this.scene.add(this.animatedSVGMesh);
    }

    update(delta) {
        if (this.animatedSVGMesh && this.animatedSVGMesh.update) {
            this.animatedSVGMesh.update(delta);
        }
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    dispose() {
        console.log("dispose");
        if (this.animatedSVGMesh) {
            this.scene.remove(this.animatedSVGMesh);
        }
        super.dispose();
    }
}


