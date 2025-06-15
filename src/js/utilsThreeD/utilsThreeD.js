import * as THREE from 'three';

export const DEFAULT_LIGHTS = {
    ambientColor: 0x9933ff,
    ambientIntensity: 0.5,
    pointColor: 0xcc66ff,
    pointIntensity: 2,
    pointPosition: { x: 0, y: 2, z: 0 }
  };

/**
 * @description Returns a random number with normal (Gaussian) distribution
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

/**
 * @description Sets BufferGeometry attributes for positions, colors, and sizes
 * @param {THREE.BufferGeometry} geometry - The geometry to set attributes for
 * @param {Float32Array} positions - Positions array (length multiple of 3)
 * @param {Float32Array} colors - Colors array (length multiple of 3)
 * @param {Float32Array} sizes - Sizes array (length multiple of 1)
 * @returns {void}
 */
export function setupGeometry(geometry, positions, colors, sizes) {
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
}

/**
 * @description Projects a point (x, y) onto the back face with perspective
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} x_c - Center X
 * @param {number} y_c - Center Y
 * @param {number} shrinkK - Shrink factor
 * @returns {number[]} [x, y] on the back face
 */
export function projectToBack(x, y, x_c, y_c, shrinkK) {
    return [
        x_c + (x - x_c) * shrinkK,
        y_c + (y - y_c) * shrinkK
    ];
}

/**
 * @description Linear interpolation between two vectors (3D)
 * @param {number[]} a - Vector 1 [x, y, z]
 * @param {number[]} b - Vector 2 [x, y, z]
 * @param {number} t - Interpolation parameter (0..1)
 * @returns {number[]} Resulting vector
 */
export function lerpVec3(a, b, t) {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ];
}

/**
 * @description Lerps between two colors
 * @param {THREE.Color} colorA - The first color
 * @param {THREE.Color} colorB - The second color
 * @param {number} t - The interpolation factor
 * @returns {THREE.Color} The interpolated color
 */
export function lerpColor(colorA, colorB, t) {
    return new THREE.Color(
        colorA.r + (colorB.r - colorA.r) * t,
        colorA.g + (colorB.g - colorA.g) * t,
        colorA.b + (colorB.b - colorA.b) * t
    );
}