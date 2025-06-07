import * as THREE from 'three';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { SingleGlow } from './singleGlow';

import { createLogger } from "../../utils/logger";
import { SINGLE_GLOW_DEFAULT_OPTIONS } from './singleGlow';
import { 
    resolveGlowColor, 
    resolveGlowPosition, 
    resolvePositioningMode, 
    getFinalGlowOptions,
    preparePalette,
    checkIntersection,
    getElementColor
} from '../../utilsThreeD/glowUtils';

/**
 * @description Default options for the glows
 * @type {Object}
 * @property {number} count - The number of glows
 * @property {Array} colorPalette - The color palette
 * @property {boolean} shuffleColors - Whether to shuffle the colors
 * @property {Object} objectOptions - The object options
 * @property {Object} shaderOptions - The shader options
 * @property {Object} individualOptions - The individual options
 */
export const GLOWS_DEFAULT_OPTIONS = {
    count: 1,
    colorPalette: [],
    shuffleColors: false,
    objectOptions: {
        positioning: {
            mode: 'random',
            targetSelector: null,
            align: 'center center',
            offset: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0, z: 0 },
        },
        movement: {
            enabled: false,
            zEnabled: true,
            speed: 0.1,
            range: { x: 2, y: 2, z: 1 },
        },
    },
    shaderOptions: {
        color: null,
        opacity: { min: 0, max: 1 },
        scale: { min: 0, max: 1 },
        pulse: {
            enabled: false,
            speed: { min: 0.1, max: 0.3 },
            intensity: 2,
            randomize: false,
            highlightIntensity: 0,
        },
        sync: {
            scale: false,
            opacity: false,
        },
    },
    individualOptions: [],
};

/**
 * @extends {AnimationController}
 * @description Glow class
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options
 */
export class Glow extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, GLOWS_DEFAULT_OPTIONS);
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.glows = [];
        console.log('this.options в конструкторе', this);
    }

    /**
     * @description Sets up the scene
     * @returns {void}
     */
    async setupScene() {
        // Only create glows if they don't exist
        if (!this.glows || this.glows.length === 0) {
            this._createGlows();
        }
    }

    onResize() {
        console.log('this.options до', this);
        if (super.onResize) super.onResize();
        console.log('this.options после', this);
    }

    /**
     * @description Updates the glows
     * @returns {void}
     */
    update() {
        const time = performance.now() / 1000;

        if (this.syncManager) {
            this.syncManager.update();
        }
        
        if (this.glows && Array.isArray(this.glows)) {
            this.glows.forEach(glow => {
                if (glow && glow.update) {
                    try {
                        // Update position if positioning mode is 'element'
                        if (glow.options.objectOptions?.positioning?.mode === 'element' && 
                            glow.options.objectOptions?.positioning?.targetSelector) {
                            glow.updatePositionByCard(this.cameraController?.camera);
                        }
                        
                        if (glow.options.objectOptions.intersection?.enabled) {
                            const color = this._calculateIntersectionColor(glow);
                            if (color) {
                                glow.updateTargetColor(color);
                            }
                        }
                        glow.update(time);
                    } catch (error) {
                        console.error('Error updating glow:', error);
                    }
                }
            });
        }
        
        super.update();
    }

    /**
     * @description Cleans up the glows
     * @returns {void}
     */
    cleanup() {
        if (this.glows && Array.isArray(this.glows)) {
            this.glows.forEach((glow) => {
                if (glow && typeof glow.cleanup === 'function') {
                    glow.cleanup();
                    if (glow.mesh && this.scene) {
                        this.scene.remove(glow.mesh);
                    }
                }
            });
        }
        this.glows = [];
        
        super.cleanup();
    }

    /**
     * @description Gets the glow count
     * @returns {number}
     */
    _getGlowCount() {
        const individualOptions = Array.isArray(this.options.individualOptions) ? this.options.individualOptions : [];
        let count = this.options.count || 1;

        if (individualOptions.length > count) count = individualOptions.length;
        if (individualOptions.length > 0) {
            return typeof count === 'number' && count > individualOptions.length
                ? count
                : individualOptions.length;
        }
        if (typeof count === 'number' && count > 0) {
            return count;
        }
        return count;
    }

    /**
     * @description Prepares merged options for all glows
     * @returns {Array<Object>}
     */
    _prepareGlowOptions() {
        const glowCount = this._getGlowCount();
        const palette = preparePalette(this.options);
        const optionsArray = [];

        for (let i = 0; i < glowCount; i++) {
            const individual = this.options.individualOptions?.[i] || {};
            const finalOptions = getFinalGlowOptions(individual, GLOWS_DEFAULT_OPTIONS, this.options);
            
            finalOptions.objectOptions.positioning = finalOptions.objectOptions.positioning || {};
            finalOptions.objectOptions.positioning.container = this.container;
            
            this._preparePositioning(finalOptions.objectOptions, i, glowCount);

            finalOptions.shaderOptions.color = resolveGlowColor(
                i,
                individual.shaderOptions || {},
                individual,
                this.options,
                GLOWS_DEFAULT_OPTIONS,
                SINGLE_GLOW_DEFAULT_OPTIONS,
                palette
            );
            
            optionsArray.push(finalOptions);
        }

        return optionsArray;
    }

    /**
     * @description Prepares the positioning
     * @param {Object} options - The options
     * @param {number} index - The index
     * @returns {void}
     */
    _preparePositioning(options, index, glowCount) {
        options.positioning = resolvePositioningMode(options);
        options.positioning.position = resolveGlowPosition(options, index, glowCount);
    }

    /**
     * @description Creates the glows with individual options
     * @returns {void}
     */
    _createGlows() {
        const optionsArray = this._prepareGlowOptions();
        
        optionsArray.forEach((options) => {
            options.container = this.container;
            options.index = optionsArray.indexOf(options);
            
            const glow = new SingleGlow(options);
            glow.setup();
            
            if (glow.mesh) {
                this.scene.add(glow.mesh);
            }
            
            this.glows.push(glow);
        });
    }
    
    /**
     * @description Calculates the color of the glow based on the intersection with the DOM elements
     * @private
     * @param {SingleGlow} glow - The glow instance
     * @returns {THREE.Color|null} The calculated color or null
     */
    _calculateIntersectionColor(glow) {
        const intersection = glow.options.objectOptions.intersection;
        if (!intersection?.enabled || !intersection.selector) return null;

        const containerRect = this.container.getBoundingClientRect();
        const vector = glow.mesh.position.clone().project(this.cameraController.camera);
        
        const screenPoint = {
            x: (vector.x * 0.5 + 0.5) * containerRect.width + containerRect.left,
            y: (1 - (vector.y * 0.5 + 0.5)) * containerRect.height + containerRect.top
        };

        const elements = Array.from(document.querySelectorAll(intersection.selector));
        const foundColors = [];

        for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (checkIntersection(screenPoint, rect)) {
                const colorStr = getElementColor(el, intersection.colorVar);
                if (colorStr) {
                    try {
                        foundColors.push(new THREE.Color(colorStr));
                    } catch (e) {
                        console.warn('Failed to parse color:', colorStr, e);
                    }
                }
            }
        }

        if (foundColors.length > 0) {
            let r = 0, g = 0, b = 0;
            foundColors.forEach(c => { r += c.r; g += c.g; b += c.b; });
            const color = new THREE.Color(
                r / foundColors.length,
                g / foundColors.length,
                b / foundColors.length
            );
            return color;
        }

        return new THREE.Color(glow.options.shaderOptions.color);
    }
}

