export const createCanvas = (renderer, options = {}) => {
    const { zIndex = '0', canvasName = '', containerType = '' } = options;

    const canvas = renderer.domElement;

    // Set canvas styles
    Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: zIndex,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform'
    });

    // Add data attributes
    if (canvasName) {
        canvas.dataset.canvasName = canvasName;
    }
    if (containerType) {
        canvas.dataset.containerType = containerType;
    }
    
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