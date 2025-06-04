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
            sync: {
                scale: false,
                opacity: false,
            },
            highlightIntensity: 0,
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
    }

    /**
     * @description Sets up the scene
     * @returns {void}
     */
    async setupScene() {
        this._createGlows();
    }

    /**
     * @description Updates the glows
     * @returns {void}
     */
    update() {
        const time = performance.now() / 1000;
        
        if (this.glows && Array.isArray(this.glows)) {
            this.glows.forEach(glow => {
                if (glow && glow.update) {
                    try {
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

    // setGlowScale(cardIndex, scale) {
    //     if (this.glows && this.glows[cardIndex]) {
    //         this.glows[cardIndex].setScale(scale);
    //     }
    // }

    /**
     * @description Sets the highlightIntensity value for a specific glow (for external sync)
     * @param {number} index - Glow index
     * @param {number} value - Target value (0..1)
     */
    // setGlowHighlightIntensity(index, value) {
    //     if (this.glows[index] && typeof this.glows[index].setHighlightIntensity === 'function') {
    //         this.glows[index].setHighlightIntensity(value);
    //     }
    // }

    /**
     * @description Sets the opacity value for a specific glow
     * @param {number} cardIndex - Glow index
     * @param {number} opacity - Target opacity value (0..1)
     */
    // setGlowOpacity(cardIndex, opacity) {
    //     console.log('setGlowOpacity', cardIndex, opacity);
    //     if (this.glows && this.glows[cardIndex]) {
    //         this.glows[cardIndex].setOpacity(opacity);
    //     }
    // }

    /**
     * @description Синхронизирует блик под карточкой с позицией и анимацией карточки
     * @param {Dynamics3D} card - объект карточки Dynamics3D
     * @param {number} glowIndex - индекс блика
     */
    // syncWithCard(card, glowIndex = 0) {
    //     if (!card || !this.glows || !this.glows[glowIndex]) return;
    //     this.glows[glowIndex].syncWithObjectPosition(card);
    // }

}

