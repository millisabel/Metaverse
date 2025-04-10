import * as THREE from 'three';

export const createCanvas = (renderer, options = {}) => {
    const { zIndex = '0' } = options;

    const canvas = renderer.domElement;

    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = zIndex;
    canvas.style.pointerEvents = 'none';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.overflow = 'hidden';
    canvas.style.transform = 'translateZ(0)';
    canvas.style.backfaceVisibility = 'hidden';
    canvas.style.willChange = 'transform';
    
    return canvas;
};

export const updateRendererSize = (renderer, container, camera, options = {}) => {
    const { clearColor = null, composer = null } = options;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    
    if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    if (clearColor !== null) {
        renderer.setClearColor(clearColor.color, clearColor.alpha);
    }

    if (composer) {
        composer.setSize(width, height);
    }
};

export function cleanupResources(renderer, scene) {
    if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
    }

    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}