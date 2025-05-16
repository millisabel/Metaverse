import * as THREE from 'three';

import { createLogger } from "../../utils/logger";
import { isMobile, getRandomValue } from '../../utils/utils';
import { createStarTexture } from '../../utilsThreeD/textureUtils';

import { AnimationController } from '../../utilsThreeD/animationController_3D';

import { gaussianRandom, setupGeometry } from '../../utilsThreeD/utilsThreeD';

/**
 * @description Stars component
 * @extends AnimationController
 * @param {Object} container - Container element
 * @param {Object} options - Options for the stars
 * @param {string} options.containerName - Name of the container element
 * @param {number} options.zIndex - Z-index of the stars
 * @param {Object} options.camera - Camera object
 */

const defaultOptions = {
    count: 4000,
    colors: [0xFFFFFF],
    size: {
        min: isMobile() ? 2 : 1,
        max: isMobile() ? 3 : 1.5,
        attenuation: true,
        multiplier: isMobile() ? 1.5 : 2
    },
    depth: {
        range: isMobile() ? 500 : 1000,
        z: [-300, -100]
    },
    movement: {
        enabled: true,
        probability: 0.15,
        speed: 0.003,
        amplitude: { x: 0.05, y: 0.05, z: 0.02 }
    },
    flicker: {
        fast: {
            probability: 0.3,
            speed: { min: 0.05, max: 0.15 },
            amplitude: { min: 0.5, max: 1.0 }
        },
        slow: {
            speed: 0.005,
            amplitude: 0.2
        }
    },
    material: {
        opacity: 1,
        transparent: true,
        blending: THREE.NormalBlending
    },
};

export class Stars extends AnimationController {
    constructor(container, options = {}) {
        super(container, options, defaultOptions);

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);
        
        this.stars = null;
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
    }

    /**
     * Setup the stars scene
     * @description Setup the stars scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        this.logger.log('Setting up stars scene', {
            conditions: ['initializing-scene'],
            functionName: 'setupScene'
        });

        this._createStars();
    }

    /**
     * @description Initialize the star attributes
     * @param {Float32Array} positions - Positions of the stars
     * @param {Float32Array} colors - Colors of the stars
     * @param {Float32Array} sizes - Sizes of the stars
     * @returns {Promise<void>}
     */
    _initStarAttributes(positions, colors, sizes) {
        for (let i = 0; i < this.options.count; i++) {
            // Positions with gaussian distribution
            positions[i * 3] = gaussianRandom(0, this.options.depth.range / 3);
            positions[i * 3 + 1] = gaussianRandom(0, this.options.depth.range / 3);
            positions[i * 3 + 2] = this.options.depth.z[0] + Math.random() * (this.options.depth.z[1] - this.options.depth.z[0]);

            // Colors
            const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
            colors[i * 3] = (color >> 16 & 255) / 255;
            colors[i * 3 + 1] = (color >> 8 & 255) / 255;
            colors[i * 3 + 2] = (color & 255) / 255;

            // Sizes
            sizes[i] = getRandomValue(this.options.size.min, this.options.size.max);

            // Animation parameters
            this.phases[i] = Math.random() * Math.PI * 2;
            this.isMoving[i] = this.options.movement.enabled && Math.random() < this.options.movement.probability ? 1 : 0;
            this.movePhases[i] = Math.random() * Math.PI * 2;

            if (Math.random() < this.options.flicker.fast.probability) {
                this.flickerSpeeds[i] = getRandomValue(
                    this.options.flicker.fast.speed.min,
                    this.options.flicker.fast.speed.max
                );
                this.flickerAmplitudes[i] = getRandomValue(
                    this.options.flicker.fast.amplitude.min,
                    this.options.flicker.fast.amplitude.max
                );
            } else {
                this.flickerSpeeds[i] = this.options.flicker.slow.speed;
                this.flickerAmplitudes[i] = this.options.flicker.slow.amplitude;
            }
        }
    }

    /**
     * @description Create star points
     * @param {THREE.BufferGeometry} geometry - Geometry of the stars
     * @returns {Promise<void>}
     */
    _createStarPoints(geometry) {
        const material = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: this.options.size?.attenuation ?? true,
            size: this.options.size?.multiplier ?? 2,
            transparent: this.options.material?.transparent ?? true,
            opacity: this.options.material?.opacity ?? 1,
            blending: this.options.material?.blending ?? THREE.NormalBlending,
            map: createStarTexture(this.options.texture)
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    /**
     * @description Create stars
     * @returns {Promise<void>}
     */
    _createStars() {
        this.phases = new Float32Array(this.options.count);
        this.isMoving = new Float32Array(this.options.count);
        this.movePhases = new Float32Array(this.options.count);
        this.flickerSpeeds = new Float32Array(this.options.count);
        this.flickerAmplitudes = new Float32Array(this.options.count);

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.options.count * 3);
        const colors = new Float32Array(this.options.count * 3);
        const sizes = new Float32Array(this.options.count);

        this._initStarAttributes(positions, colors, sizes);
        setupGeometry(geometry, positions, colors, sizes);
        this._createStarPoints(geometry);
    }

    /**
     * @description Update the star attributes
     * @returns {Promise<void>}
     */
    _updateStarAttributes() {
        const positions = this.stars.geometry.attributes.position.array;
        const sizes = this.stars.geometry.attributes.size.array;
        const depthRange = this.options.depth.range;
    
        let positionChanged = false;
        let sizeChanged = false;

        const batchSize = Math.ceil(this.options.count / 4); 
        this._starBatchIndex = (this._starBatchIndex || 0) % 4;

        const start = this._starBatchIndex * batchSize;
        const end = Math.min(start + batchSize, this.options.count);

        for (let index = start; index < end; index++) {
            const i = index * 3;
    
            this.phases[index] += this.flickerSpeeds[index];
            const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
            sizes[index] = brightness * getRandomValue(this.options.size.min, this.options.size.max);
    
            if (this.isMoving[index] === 1) {
                this.movePhases[index] += this.options.movement.speed;
                const amplitude = this.options.movement.amplitude || { x: 0.05, y: 0.05, z: 0.02 };
    
                positions[i] += Math.sin(this.movePhases[index]) * amplitude.x;
                positions[i + 1] += Math.cos(this.movePhases[index]) * amplitude.y;
                positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * amplitude.z;
            }
    
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < this.options.depth.z[0]) positions[i + 2] = this.options.depth.z[1];
            if (positions[i + 2] > this.options.depth.z[1]) positions[i + 2] = this.options.depth.z[0];
        }
    
        this._starBatchIndex++;

        if (positionChanged) {
            this.stars.geometry.attributes.position.needsUpdate = true;
        }
        if (sizeChanged) {
            this.stars.geometry.attributes.size.needsUpdate = true;
        }

        this.stars.geometry.attributes.position.needsUpdate = true;
        this.stars.geometry.attributes.size.needsUpdate = true;
    }

    /**
     * @description Update the stars position, size, and color
     * @returns {Promise<void>}
     */
    update() {
        if (!this.canAnimate() || !this.stars || !this.phases || !this.flickerSpeeds || !this.flickerAmplitudes) {
            this.logAnimationState('paused');
            return;
        }

        if (!this.animationFrameId) {
            this.logAnimationState('running');
        }

        this._updateStarAttributes();
        this.updateCamera();
        this.renderScene();
    }

    /**
     * @description Cleanup the stars
     * @returns {Promise<void>}
     */
    cleanup() {
        let logMessage = `starting cleanup in ${this.constructor.name}\n`;

        if (this.stars) {
            this.stars.geometry?.dispose();
            this.stars.material?.dispose();
            this.stars = null;
            logMessage += `${this.constructor.name} disposed: ${this.stars}\n`;
        }

        super.cleanup(logMessage);
        
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
    }
}