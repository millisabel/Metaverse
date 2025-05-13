import * as THREE from 'three';

/**
 * Create star texture
 * @param {Object} options - Options for the star texture
 * @param {number} [options.size=64] - Size of the star texture
 * @param {string} [options.innerColor=rgba(255, 255, 255, 1)] - Inner color of the star texture
 * @param {string} [options.outerColor=rgba(255, 255, 255, 0)] - Outer color of the star texture
 * @param {string} [options.middleColor=rgba(255, 255, 255, 0.6)] - Middle color of the star texture
 * @returns {THREE.Texture} - Star texture  
 */

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