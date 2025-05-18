export const createCanvas = (renderer, options = {}) => {
    const { 
        zIndex = '0', 
        containerName = 'threejs',
        canvasName = '',  } = options;

    const canvas = renderer.domElement;

    // Set canvas styles
    Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: Number(zIndex),
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform'
    });

    if (canvasName) {
        canvas.dataset.canvasName = canvasName;
    }
    if (containerName) {
        canvas.dataset.containerName = containerName;
    }
    if (zIndex) {
        canvas.dataset.zIndex = zIndex;
    }

    canvas.classList.add('threejs-canvas');
    
    return canvas;
};

export const updateThreeRendererSize = (renderer, container, camera, options = {}) => {
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

/**
 * Find all "dead" Three.js/WebGL canvas in DOM.
 * @param {string} [selector='.threejs-canvas, canvas[data-container-name]'] - Selector for identifying 3D canvases
 * @returns {HTMLCanvasElement[]} - Array of found canvas elements
 */
export function findDeadCanvas(selector = '.threejs-canvas, canvas[data-container-name]') {
  return Array.from(document.querySelectorAll(selector));
}

/**
 * Log warning if there are "dead" canvas in DOM.
 * @param {string} [selector]
 */
export function assertNoDeadCanvas(selector) {
  const deadCanvas = findDeadCanvas(selector);
  if (deadCanvas.length > 0) {
    console.warn(`⚠️ Found ${deadCanvas.length} dead canvas in DOM:`, deadCanvas);
  } else {
    console.info('✅ No dead canvas in DOM');
  }
}