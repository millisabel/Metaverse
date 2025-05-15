import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from "../../utils/logger";
import { SingleGlow } from './singleGlow';
import { shuffleArray } from '../../utils/utils';

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
        speed:  0.5,
        intensity: 0.6,
        sync: false
    },
    movement: {
        enabled:  true,
        speed:  0.05,
        range:  { x: 0.8, y: 0.8, z: 0.5 }
    },
    position: { x: 0, y: 0, z: 0 },
    initialPositions: null

};


export class Glow extends AnimationController {
    constructor(container, options = {}) {
        super(container, options, DEFAULT_OPTIONS);

        this.glowConfigs = this.options || null;

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.glows = [];
    }

    /**
     * Sets up the scene
     * @returns {void}
     */
    setupScene() {
        this._createGlows();
    }

    /**
     * Creates the glows
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
     * Gets the colors for the glows
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
     * Creates a glow object
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
        return glow;
    }

    /**
     * Calculates the initial position of a glow object
     * @param {number} index - The index of the glow object
     * @returns {Object} The initial position of the glow object
     */
    _calculatePosition(index) {          
        return this.options.initialPositions ? 
        this.options.initialPositions[index % this.options.initialPositions.length] :
        this._calculateInitialPosition();
    }

    /**
     * Calculates the initial position of a glow object
     * @param {number} index - The index of the glow object
     * @returns {Object} The initial position of the glow object
     */
    _calculateInitialPosition() {
        // Диапазон разброса в мировых координатах
        const xSpread = (this.options.movement.range.x || 1); 
        const ySpread = (this.options.movement.range.y || 1);
        const zRange = this.options.movement.range.z || 0.1;
    
        const zEnabled = this.options.movement.zEnabled !== false;
        const x = (Math.random() - 0.5) * xSpread;
        const y = (Math.random() - 0.5) * ySpread;
        const z = zEnabled ? (Math.random() * 2 - 1) * zRange : 0;
    
        console.log('[Glow] Initial position:', { x, y, z, zEnabled });
        return { x, y, z };
    }

    /**
     * Updates the glows
     * @returns {void}
     */
    update() {
        if (!this.canAnimate()) return;
        
        this.glows.forEach(glow => glow.update(this.camera));
        this.renderScene();
    }

    /**
     * Cleans up the glows
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
