import * as THREE from 'three';


// addDefaultLights =================================================
/**
 * Adds default ambient and point lights to the scene
 * @param {THREE.Scene} scene - The scene to add lights to
 * @param {Object} options - Light options
 * @param {number} options.ambientColor - Color of ambient light
 * @param {number} options.ambientIntensity - Intensity of ambient light
 * @param {number} options.pointColor - Color of point light
 * @param {number} options.pointIntensity - Intensity of point light
 * @param {Object} options.pointPosition - Position of point light {x, y, z}
 */
export function addDefaultLights(scene, {
    ambientColor = 0x9933ff,
    ambientIntensity = 0.5,
    pointColor = 0xcc66ff,
    pointIntensity = 2,
    pointPosition = { x: 0, y: 2, z: 0 }
} = {}) {
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(pointColor, pointIntensity);
    pointLight.position.set(pointPosition.x, pointPosition.y, pointPosition.z);
    scene.add(pointLight);
}

// gaussianRandom =================================================
/**
 * Returns a random number with normal (Gaussian) distribution
 * @param {number} [mean=0] - Mean value
 * @param {number} [stdev=1] - Standard deviation
 * @returns {number} Random number from normal distribution
 */
export function gaussianRandom(mean = 0, stdev = 1) {
    let u = 1 - Math.random();
    let v = 1 - Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
}

// setupGeometry =================================================
/**
 * Sets BufferGeometry attributes for positions, colors, and sizes
 * @param {THREE.BufferGeometry} geometry - The geometry to set attributes for
 * @param {Float32Array} positions - Positions array (length multiple of 3)
 * @param {Float32Array} colors - Colors array (length multiple of 3)
 * @param {Float32Array} sizes - Sizes array (length multiple of 1)
 */
export function setupGeometry(geometry, positions, colors, sizes) {
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
}