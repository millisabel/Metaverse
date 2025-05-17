import * as THREE from 'three';

export const DEFAULT_LIGHTS = {
    ambientColor: 0x9933ff,
    ambientIntensity: 0.5,
    pointColor: 0xcc66ff,
    pointIntensity: 2,
    pointPosition: { x: 0, y: 2, z: 0 }
  };

/**
 * @description Adds default ambient and point lights to the scene
 * @param {THREE.Scene} scene - The scene to add lights to
 * @param {Object} options - Light options
 * @returns {void}
 */
export function addDefaultLights(scene, options = {}) {
    const config = { ...DEFAULT_LIGHTS, ...options };
    // ambient
    const ambient = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity);
    scene.add(ambient);
    // point
    const point = new THREE.PointLight(config.pointColor, config.pointIntensity);
    point.position.set(config.pointPosition.x, config.pointPosition.y, config.pointPosition.z);
    scene.add(point);
}

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
 * @description Deep merges two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * @description Deep clones an object
   * @param {Object} obj - The object to clone
   * @returns {Object} Cloned object
   */
  export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepClone);
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
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

/**
 * @description Averages an array of colors
 * @param {THREE.Color[]} colors - The colors to average
 * @returns {THREE.Color} The averaged color
 */
export function averageColors(colors) {
    if (!colors.length) return new THREE.Color(0,0,0);
    let r = 0, g = 0, b = 0;
    colors.forEach(c => { r += c.r; g += c.g; b += c.b; });
    r /= colors.length;
    g /= colors.length;
    b /= colors.length;
    return new THREE.Color(r, g, b);
}

/**
 * @description Checks if a point is inside a rectangle
 * @param {number} x - The x coordinate of the point
 * @param {number} y - The y coordinate of the point
 * @param {Object} rect - The rectangle to check against
 * @returns {boolean} True if the point is inside the rectangle, false otherwise
 */
export function isPointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * @description Initializes the current color of a glow
 * @param {Object} glow - The glow to initialize
 * @param {THREE.Color} color - The color to initialize the glow with
 * @returns {void}
 */
export function initGlowCurrentColor(glow, color) {
    glow.currentColor = new THREE.Color(color);
}

/**
 * @description Converts a desired size in screen pixels to world units for a given camera and z-position.
 * @param {number} sizePx - Desired size in pixels on the screen
 * @param {THREE.PerspectiveCamera} camera - The camera used for rendering
 * @param {number} [z=0] - Z position of the object in world coordinates
 * @returns {number} Scale in world units to achieve the desired pixel size
 */
export function getWorldScaleForPixelSize(sizePx, camera, z = 0) {
    if (!camera || typeof camera.fov !== 'number') return 1;
    const vFOV = THREE.MathUtils.degToRad(camera.fov); // vertical fov in radians
    const distance = Math.abs(camera.position.z - z);
    const height = 2 * Math.tan(vFOV / 2) * distance;
    const pxPerUnit = window.innerHeight / height;
    return sizePx / pxPerUnit;
}