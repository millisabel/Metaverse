import * as THREE from 'three';

export const createCanvas = (container, options = {}) => {
    const {
        antialias = true,
        alpha = true,
        zIndex = '0',
        pointerEvents = 'none',
        powerPreference = 'high-performance'
    } = options;

    const renderer = new THREE.WebGLRenderer({ 
        antialias,
        alpha,
        powerPreference
    });
    
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = zIndex;
    canvas.style.pointerEvents = pointerEvents;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.overflow = 'hidden';
    canvas.style.transform = 'translateZ(0)';
    canvas.style.backfaceVisibility = 'hidden';
    canvas.style.willChange = 'transform';
    
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    container.appendChild(canvas);
    
    return {
        renderer,
        canvas
    };
};

export const updateRendererSize = (renderer, container, camera) => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    
    if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}; 