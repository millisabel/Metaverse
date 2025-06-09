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


/**
 * Fit and align a THREE.Group or Mesh to a DOM element under an orthographic camera.
 * @param {THREE.Group|THREE.Mesh} mesh - The mesh/group to position and scale.
 * @param {THREE.OrthographicCamera} camera - The ortho camera.
 * @param {HTMLElement} domElement - The target DOM element.
 * @param {THREE.WebGLRenderer} renderer - The renderer (to get canvas size).
 * @param {number} [scaleFactor=1.0] - Optional scale multiplier.
 */
function fitMeshToElement(mesh, camera, domElement, renderer, scaleFactor = 1) {
    if (!mesh || !camera || !domElement || !renderer) return;

    // 1. Get DOM element and canvas rects
    const elemRect = domElement.getBoundingClientRect();
    const canvas = renderer.domElement;
    const canvasRect = canvas.getBoundingClientRect();

    // 2. Center and size of element relative to canvas
    const elemCenterX = elemRect.left + elemRect.width / 2 - canvasRect.left;
    const elemCenterY = elemRect.top + elemRect.height / 2 - canvasRect.top;
    const elemWidth = elemRect.width;
    const elemHeight = elemRect.height;

    // 3. Convert to NDC [-1, 1]
    const ndcX = (elemCenterX / canvasRect.width) * 2 - 1;
    const ndcY = -((elemCenterY / canvasRect.height) * 2 - 1);

    // 4. Ortho camera visible area
    const orthoWidth = camera.right - camera.left;
    const orthoHeight = camera.top - camera.bottom;

    // 5. Scene coordinates for center
    const sceneX = camera.left + (ndcX + 1) / 2 * orthoWidth;
    const sceneY = camera.bottom + (ndcY + 1) / 2 * orthoHeight;

    // 6. Mesh bounding box
    const meshBox = new THREE.Box3().setFromObject(mesh);
    const meshWidth = meshBox.max.x - meshBox.min.x;
    const meshHeight = meshBox.max.y - meshBox.min.y;

    // 7. Target size in scene units
    const sceneElemWidth = (elemWidth / canvasRect.width) * orthoWidth;
    const sceneElemHeight = (elemHeight / canvasRect.height) * orthoHeight;

    // 8. Scale mesh to fit element (без искажения)
    const scaleX = (sceneElemWidth / meshWidth) * scaleFactor;
    const scaleY = (sceneElemHeight / meshHeight) * scaleFactor;
    const uniformScale = Math.min(scaleX, scaleY); // или Math.max(...) если хотите crop

    mesh.scale.set(uniformScale, uniformScale, 1);

    // 9. Center mesh
    const newBox = new THREE.Box3().setFromObject(mesh);
    const meshCenterX = (newBox.max.x + newBox.min.x) / 2;
    const meshCenterY = (newBox.max.y + newBox.min.y) / 2;
    mesh.position.set(
        sceneX - meshCenterX,
        sceneY - meshCenterY,
        0
    );
}