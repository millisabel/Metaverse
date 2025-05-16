import * as THREE from 'three';

import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { SingleGlow } from './singleGlow';

import { createLogger } from "../../utils/logger";
import { getQuarterColorFromVar, shuffleArray } from '../../utils/utils';
import { lerpColor, averageColors, isPointInRect, initGlowCurrentColor } from '../../utilsThreeD/utilsThreeD';

const DEFAULT_OPTIONS = {
    count: 5,
    colors: ['#FFFFFF'],
    shuffleColors : false,
    size: {
        min:  0.2,
        max:  0.8,
    },
    opacity: {
        min:  0.1,
        max:  0.2,
    },
    scale: {
        min:  0.5,
        max:  1.2,
    },
    pulse: {
        enabled: true,
        speed:  0.5,
        intensity: 0.6,
        sync: false
    },
    movement: {
        enabled:  true, 
        zEnabled: true,
        speed:  0.05,
        range:  { x: 0.8, y: 0.8, z: 0.5 }
    },
    intersection: {
        enabled: false,
        selector: null,
        lerpSpeed: 0.05,
    },
    position: { x: 0, y: 0, z: 0 },
    initialPositions: null,

};

/**
 * @extends {AnimationController}
 * @description Glow class
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options
 * @param {Object} defaultOptions - The default options
 */
export class Glow extends AnimationController {
    constructor(container, options = {}) {
        super(container, options, DEFAULT_OPTIONS);

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.glows = [];
        this._quarterBlocks = [];
        this._updateQuarterBlocks();
    }

    /**
     * @description Updates the quarter blocks
     * @returns {void}
     */
    _updateQuarterBlocks() {
        const intersectionOpts = this.options.intersection || {};
        const selector = intersectionOpts.selector;
        if (!intersectionOpts.enabled || !selector) {
            intersectionOpts.enabled = false;
            this._quarterBlocks = [];
            return;
        }
        const elements = document.querySelectorAll(selector);
        if (!elements.length) {
            intersectionOpts.enabled = false;
            this._quarterBlocks = [];
            return;
        }
        intersectionOpts.enabled = true;
        this._quarterBlocks = Array.from(elements).map(el => ({
            el,
            rect: el.getBoundingClientRect()
        }));
    }

    /**
     * @description Sets up the scene
     * @returns {void}
     */
    setupScene() {
        this._createGlows();
    }

    /**
     * @description Creates the glows
     * @returns {void}
     */
    _createGlows() {
        let colors = this._getColors();
        
        for (let i = 0; i < this.options.count; i++) {
            const colorIndex = i % colors.length;
            const position = this._calculatePosition(i);
            const glow = this._createGlow(colors[colorIndex], position);
            
            this.glows.push(glow);

            // this.logger.log(`Glow ${i + 1} created`, {
            //     customData: {
            //         position: `x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}`,
            //         color: colors[colorIndex]
            //     },
            //     conditions: ['created'],
            //     functionName: '_createGlows'
            // });
        }
    }

    /**
     * @description Gets the colors for the glows
     * @returns {Array} The colors for the glows
     */
    _getColors() {
        let colors = [...this.options.colors];
        if (this.options.shuffleColors) {
            colors = shuffleArray(colors);
        }
        return colors;
    }

    /**
     * @description Creates a glow object
     * @param {string} color - The color of the glow
     * @param {Object} position - The position of the glow
     * @returns {Object} The glow object
     */
    _createGlow(color, position) {
        const glow = new SingleGlow(
            this.scene,
            this.renderer,
            this.container,
            {
                color: color,
                size: THREE.MathUtils.randFloat(this.options.size.min, this.options.size.max),                
                opacity: this.options.opacity,
                scale: this.options.scale,
                pulse: this.options.pulse,
                position: position,
                movement: this.options.movement
            }
        );
        initGlowCurrentColor(glow, color);
        return glow;
    }

    /**
     * @description Calculates the initial position of a glow object
     * @param {number} index - The index of the glow object
     * @returns {Object} The initial position of the glow object
     */
    _calculatePosition(index) {          
        return this.options.initialPositions ? 
        this.options.initialPositions[index % this.options.initialPositions.length] :
        this._calculateInitialPosition();
    }

    /**
     * @description Calculates the initial position of a glow object
     * @param {number} index - The index of the glow object
     * @returns {Object} The initial position of the glow object
     */
    _calculateInitialPosition() {
        const xSpread = (this.options.movement.range.x || 1); 
        const ySpread = (this.options.movement.range.y || 1);
        const zRange = this.options.movement.range.z || 0.1;
    
        const zEnabled = this.options.movement.zEnabled !== false;
        const x = (Math.random() - 0.5) * xSpread;
        const y = (Math.random() - 0.5) * ySpread;
        const z = zEnabled ? (Math.random() * 2 - 1) * zRange : 0;
    
        return { x, y, z };
    }

    /**
     * @description Checks the intersection of glows with DOM blocks and smoothly changes their color
     * @returns {void}
     */
    _handleGlowQuarterIntersection() {
        if (!this.glows || !this._quarterBlocks.length) return;
        const camera = this.camera;
        const intersectionOpts = this.options.intersection || {};
        const lerpSpeed = intersectionOpts.lerpSpeed ?? 0.05;
        this.glows.forEach(glow => {
            if (!glow.mesh) return;
            const vector = glow.mesh.position.clone().project(camera);
            const x = (vector.x + 1) / 2 * window.innerWidth;
            const y = (-vector.y + 1) / 2 * window.innerHeight;
            let intersectedColors = [];
            this._quarterBlocks.forEach(({el, rect}) => {
                if (isPointInRect(x, y, rect)) {
                    const colorStr = getQuarterColorFromVar(el);
                    if (colorStr) {
                        const color = new THREE.Color(colorStr);
                        intersectedColors.push(color);
                    }
                }
            });
            let targetColor;

            glow.isIntersecting = intersectedColors.length > 0;
            if (intersectedColors.length === 1) {
                targetColor = intersectedColors[0];
            } else if (intersectedColors.length > 1) {
                targetColor = averageColors(intersectedColors);
            } else {
                targetColor = new THREE.Color(glow.options.color);
            }

            if (!glow.currentColor) {
                if (glow.mesh.material.uniforms && glow.mesh.material.uniforms.color) {
                    glow.currentColor = glow.mesh.material.uniforms.color.value.clone();
                } else {
                    glow.currentColor = new THREE.Color(glow.options.color);
                }
            }
            glow.currentColor = lerpColor(glow.currentColor, targetColor, lerpSpeed);
            glow.setColor(glow.currentColor);
        });
    }

    /**
     * @description Updates the glows
     * @returns {void}
     */
    update() {
        if (!this.canAnimate()) return;
        
        this.glows.forEach(glow => glow.update(this.camera));
        this._updateQuarterBlocks(); 
        if (this.options.intersection && this.options.intersection.enabled) {
            this._handleGlowQuarterIntersection();
        }
        this.renderScene();
    }

    /**
     * @description Cleans up the glows
     * @returns {void}
     */
    cleanup() {
        let logMessage = `starting cleanup in ${this.constructor.name}\n`;

        if (this.glows && Array.isArray(this.glows)) {
            this.glows.forEach((glow, index) => {
                if (glow && typeof glow.cleanup === 'function') {
                    glow.cleanup();
                    logMessage += `${this.constructor.name} glow disposed: ${index}\n`;
                }
            });
        }
        
        this.glows = [];

        super.cleanup(logMessage);
    }
}
