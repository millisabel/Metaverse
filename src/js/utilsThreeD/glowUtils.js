import { deepMergeOptions } from '../utils/utils';
import { shuffleArray } from '../utils/utils';
import { SINGLE_GLOW_DEFAULT_OPTIONS } from '../components/three/singleGlow';

/**
 * @description Gets the final glow options
 * @param {Object} individual - The individual
 * @param {Object} localDefaults - The local defaults
 * @param {Object} userOptions - The user options
 * @returns {Object} The final glow options
 */
export function getFinalGlowOptions(individual = {}, localDefaults = {}, userOptions = {}) {
    const result = {
        objectOptions: { ...SINGLE_GLOW_DEFAULT_OPTIONS.objectOptions },
        shaderOptions: { ...SINGLE_GLOW_DEFAULT_OPTIONS.shaderOptions }
    };

    if (localDefaults.objectOptions) {
        result.objectOptions = deepMergeOptions(result.objectOptions, localDefaults.objectOptions);
    }
    if (localDefaults.shaderOptions) {
        result.shaderOptions = deepMergeOptions(result.shaderOptions, localDefaults.shaderOptions);
    }

    if (userOptions.objectOptions) {
        result.objectOptions = deepMergeOptions(result.objectOptions, userOptions.objectOptions);
    }
    if (userOptions.shaderOptions) {
        result.shaderOptions = deepMergeOptions(result.shaderOptions, userOptions.shaderOptions);
    }

    if (individual.objectOptions) {
        result.objectOptions = deepMergeOptions(result.objectOptions, individual.objectOptions);
    }
    if (individual.shaderOptions) {
        result.shaderOptions = deepMergeOptions(result.shaderOptions, individual.shaderOptions);
    }

    return result;
}

// Color

/**
 * @description Extended function for selecting a color by priority for a glow
 * @param {number} index - The index
 * @param {Object} shaderIndividual - The shader individual
 * @param {Object} individual - The individual
 * @param {Object} group - The group
 * @param {Object} classDefaults - The class defaults
 * @param {Object} singleDefaults - The single defaults
 * @param {Array} palette - The palette
 * @returns {string|number} The resolved color
 */
export function resolveGlowColor(index, shaderIndividual, individual, group, classDefaults, singleDefaults, palette) {
    if (shaderIndividual && shaderIndividual.color) return shaderIndividual.color;
    if (individual && individual.color) return individual.color;
    if (group && group.shaderOptions && group.shaderOptions.color) return group.shaderOptions.color;
    if (group && group.color) return group.color;
    if (palette && palette.length) return palette[index % palette.length];
    if (classDefaults && classDefaults.shaderOptions && classDefaults.shaderOptions.color) return classDefaults.shaderOptions.color;
    if (classDefaults && classDefaults.color) return classDefaults.color;
    if (singleDefaults && singleDefaults.shaderOptions && singleDefaults.shaderOptions.color) return singleDefaults.shaderOptions.color;
    if (singleDefaults && singleDefaults.color) return singleDefaults.color;
    return 0xffffff;
}

/**
 * @description Prepares color palette with optional shuffling
 * @param {Array} colorPalette - Array of colors
 * @param {boolean} shouldShuffle - Whether to shuffle the palette
 * @returns {Array} The prepared palette
 */
export function preparePalette(options = {}) {
    let palette = Array.isArray(options.colorPalette) ? [...options.colorPalette] : [];
    if (options.shuffleColors && palette.length > 1) {
        palette = shuffleArray(palette);
    }
    return palette;
}

// Positioning

/**
 * @description Resolves the glow positioning mode
 * @param {Object} options - The options
 * @returns {Object} The resolved positioning mode
 */
export function resolvePositioningMode(options) {
    let positioning = options.positioning || {};

    if (!positioning.mode) {
        if (positioning.targetSelector) {
            positioning.mode = 'element';
        } else if (options.position) {
            positioning.mode = 'fixed';
        } else {
            positioning.mode = 'random';
        }
    }
    return positioning;
}

/** 
 * @description Resolves the glow position based on positioning mode
 * @param {Object} options - The options
 * @param {number} index - The index
 * @returns {Object} The resolved position
 */
export function resolveGlowPosition(options, index, glowCount) {
    const mode = options.positioning?.mode;
    
    if (mode === 'element' && !options.positioning.container) {
        console.warn('Container is required for element positioning, falling back to random');
        return getRandomGlowPosition(options, index, glowCount);
    }
    
    let position;
    switch (mode) {
        case 'fixed':
            position = { ...options.position };
            break;
            
        case 'random':
            position = getRandomGlowPosition(options, index, glowCount);
            break;
            
        case 'element':
            position = getPositionByElement(options);
            break;
            
        default:
            console.warn(`Unknown positioning mode: ${mode}, falling back to random`);
            position = getRandomGlowPosition(options, index, glowCount);
    }

    return position;
}

/**
 * @description Gets the random glow position
 * @param {Object} options - The options
 * @param {number} index - The index
 * @returns {Object} The random glow position
 */
export function getRandomGlowPosition(options, index, glowCount) {
    if (Array.isArray(options.initialPositions) && options.initialPositions.length > 0) {
        return { ...options.initialPositions[index % options.initialPositions.length] };
    }

    const movement = options.movement || {};
    const range = movement.range || {};
    
    const xRange = range.x || 0;
    const yRange = range.y || 0;
    const zRange = range.z || 0;
    const zEnabled = movement.zEnabled !== false;

    const totalGlows = glowCount || 12; 
    
    const progress = index / totalGlows; 
    const angle = progress * Math.PI * 4; 
    const radius = progress * 0.8; 
    
    const x = Math.cos(angle) * radius * xRange;
    const y = Math.sin(angle) * radius * yRange;
    
    const z = zEnabled ? Math.sin(angle * 2) * zRange : 0;

    const position = { x, y, z };
    
    return position;
}

/**
 * @description Gets the position by element
 * @param {Object} options - The options
 * @param {THREE.Camera} [options.camera] - Optional camera for accurate projection
 * @returns {Object} The position by element
 */
export function getPositionByElement(options) {
    const targetSelector = options.positioning.targetSelector;
    const container = options.positioning.container;
    const align = options.positioning.align || 'center center';
    const offset = options.positioning.offset || { x: 0, y: 0 };
    const zPosition = options.positioning.z || 0;
    const camera = options.camera;

    const el = document.querySelector(targetSelector);

    if (!el) {
        console.warn('Element not found:', targetSelector);
        return { x: 0, y: 0, z: zPosition };
    }

    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const [vertical = 'center', horizontal = 'center'] = align.split(' ');

    let x, y;

    switch (horizontal) {
        case 'left':
            x = rect.left;
            break;
        case 'right':
            x = rect.right;
            break;
        default: // center
            x = rect.left + (rect.width / 2);
    }

    switch (vertical) {
        case 'top':
            y = rect.top;
            break;
        case 'bottom':
            y = rect.bottom;
            break;
        default: // center
            y = rect.top + (rect.height / 2);
    }

    x += offset.x || 0;
    y += offset.y || 0;

    // Convert from screen coordinates to normalized device coordinates (-1 to 1)
    const normalizedX = ((x - containerRect.left) / containerRect.width) * 2 - 1;
    const normalizedY = -((y - containerRect.top) / containerRect.height) * 2 + 1;

    // If camera is provided and it's a perspective camera, calculate world coordinates
    if (camera && camera.isPerspectiveCamera) {
        const aspect = containerRect.width / containerRect.height;
        const fov = camera.fov * (Math.PI / 180); // Convert to radians
        const cameraZ = camera.position.z;
        const distance = cameraZ - zPosition;
        
        // Calculate the visible height at the z position
        const visibleHeight = 2 * Math.tan(fov / 2) * distance;
        const visibleWidth = visibleHeight * aspect;
        
        // Convert normalized coordinates to world coordinates
        const worldX = normalizedX * (visibleWidth / 2);
        const worldY = normalizedY * (visibleHeight / 2);
        
        return { x: worldX, y: worldY, z: zPosition };
    }
    
    // If no camera or orthographic camera, return normalized coordinates
    return { x: normalizedX, y: normalizedY, z: zPosition };
}

// Pulse

/**
 * @description Applies the randomized pulse options
 * @param {Object} shaderOptions - The shader options
 * @returns {void}
 */
export function applyRandomizedPulseOptions(shaderOptions) {
    const pulse = shaderOptions.pulse;
    if (!pulse) return;
    // Speed
    if (pulse.speed && typeof pulse.speed === 'object') {
        const min = pulse.speed.min ?? 0.1;
        const max = pulse.speed.max ?? 0.5;
        pulse.speed = Math.random() * (max - min) + min;
    }
    // Intensity
    if (pulse.intensity && typeof pulse.intensity === 'object') {
        const min = pulse.intensity.min ?? 1;
        const max = pulse.intensity.max ?? 3;
        pulse.intensity = Math.random() * (max - min) + min;
    }
}

// Movement

/**
 * @description Generates trajectory parameters for movement
 * @param {Object} range - The range of movement
 * @returns {Object} The trajectory parameters
 */
export function generateTrajectoryParams(range = {}) {
    return {
        freq: {
            x: Math.random() * 0.5 + 0.5,
            y: Math.random() * 0.5 + 0.5,
            z: Math.random() * 0.5 + 0.5
        },
        amplitude: {
            x: (range.x || 1) * (0.5 + Math.random() * 0.5),
            y: (range.y || 1) * (0.5 + Math.random() * 0.5),
            z: (range.z || 1) * (0.5 + Math.random() * 0.5)
        },
        phase: {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 2
        }
    };
}

/**
 * @description Calculates the new position based on time and trajectory
 * @param {number} time - The current time
 * @param {Object} trajectory - The trajectory parameters
 * @param {Object} initialPosition - The initial position
 * @param {number} speed - The speed of movement
 * @param {boolean} zEnabled - Whether movement is enabled on the Z-axis
 * @returns {Object} The new position {x, y, z}
 */
export function calculateMovementPosition(time, trajectory, initialPosition, speed, zEnabled) {
    const t = time * speed;
    const { freq, amplitude, phase } = trajectory;

    return {
        x: initialPosition.x + Math.sin(t * freq.x + phase.x) * amplitude.x,
        y: initialPosition.y + Math.cos(t * freq.y + phase.y) * amplitude.y,
        z: initialPosition.z + (zEnabled ? Math.sin(t * freq.z + phase.z) * amplitude.z : 0)
    };
}

// Intersection

/**
 * @description Converts RGBA color to RGB
 * @param {string} colorStr - String with color in rgba or rgb format
 * @returns {string} Color in rgb format
 */
export function stripAlphaFromColor(colorStr) {
    if (typeof colorStr === 'string' && colorStr.startsWith('rgba')) {
        const match = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
            return `rgb(${match[1]},${match[2]},${match[3]})`;
        }
    }
    return colorStr;
}

/**
 * @description Checks if a point intersects with a rectangle with a tolerance
 * @param {Object} point - The coordinates of the point {x, y}
 * @param {DOMRect} rect - The rectangle
 * @param {number} tolerance - The tolerance in pixels
 * @returns {boolean} Whether there is an intersection
 */
export function checkIntersection(point, rect, tolerance = 4) {
    return (
        point.x >= rect.left - tolerance && 
        point.x <= rect.right + tolerance &&
        point.y >= rect.top - tolerance && 
        point.y <= rect.bottom + tolerance
    );
}

/**
 * @description Gets the color of an element
 * @param {Element} element - The DOM element
 * @param {string} colorVar - The CSS variable with the color
 * @returns {string|null} The color of the element
 */
export function getElementColor(element, colorVar) {
    let colorStr = null;
    if (colorVar) {
        colorStr = getComputedStyle(element).getPropertyValue(colorVar).trim();
    }
    if (!colorStr) {
        colorStr = getComputedStyle(element).backgroundColor;
    }
    return colorStr ? stripAlphaFromColor(colorStr) : null;
}

