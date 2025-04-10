import * as THREE from 'three';

export const createStarTexture = (options = {}) => {
    const {
        size = 64,
        innerColor = 'rgba(255, 255, 255, 1)',
        outerColor = 'rgba(255, 255, 255, 0)',
        middleColor = 'rgba(255, 255, 255, 0.6)'
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.1, innerColor);
    gradient.addColorStop(0.3, middleColor);
    gradient.addColorStop(1, outerColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}; 