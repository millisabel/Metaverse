import * as THREE from 'three';

import { createLogger } from "../../utils/logger";
import { isMobile, getRandomValue } from '../../utils/utils';
import { createStarTexture } from '../../utilsThreeD/textureUtils';

import { AnimationController } from '../../utilsThreeD/animationController_3D';

import { gaussianRandom, setupGeometry } from '../../utilsThreeD/utilsThreeD';

/**
 * Stars component
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
        super(container, {
            containerName: options.containerName,
            zIndex: options.zIndex,
            camera: options.camera,
        });

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.starsOptions = AnimationController.mergeOptions(defaultOptions, options);
        
        this.stars = null;
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;

        this.logger.log({
            conditions: ['init'],
            functionName: 'constructor',
        });
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
     * Initialize the star attributes
     * @description Initialize the star attributes
     * @param {Float32Array} positions - Positions of the stars
     * @param {Float32Array} colors - Colors of the stars
     * @param {Float32Array} sizes - Sizes of the stars
     * @returns {Promise<void>}
     */
    _initStarAttributes(positions, colors, sizes) {
        for (let i = 0; i < this.starsOptions.count; i++) {
            // Positions with gaussian distribution
            positions[i * 3] = gaussianRandom(0, this.starsOptions.depth.range / 3);
            positions[i * 3 + 1] = gaussianRandom(0, this.starsOptions.depth.range / 3);
            positions[i * 3 + 2] = this.starsOptions.depth.z[0] + Math.random() * (this.starsOptions.depth.z[1] - this.starsOptions.depth.z[0]);

            // Colors
            const color = this.starsOptions.colors[Math.floor(Math.random() * this.starsOptions.colors.length)];
            colors[i * 3] = (color >> 16 & 255) / 255;
            colors[i * 3 + 1] = (color >> 8 & 255) / 255;
            colors[i * 3 + 2] = (color & 255) / 255;

            // Sizes
            sizes[i] = getRandomValue(this.starsOptions.size.min, this.starsOptions.size.max);

            // Animation parameters
            this.phases[i] = Math.random() * Math.PI * 2;
            this.isMoving[i] = this.starsOptions.movement.enabled && Math.random() < this.starsOptions.movement.probability ? 1 : 0;
            this.movePhases[i] = Math.random() * Math.PI * 2;

            if (Math.random() < this.starsOptions.flicker.fast.probability) {
                this.flickerSpeeds[i] = getRandomValue(
                    this.starsOptions.flicker.fast.speed.min,
                    this.starsOptions.flicker.fast.speed.max
                );
                this.flickerAmplitudes[i] = getRandomValue(
                    this.starsOptions.flicker.fast.amplitude.min,
                    this.starsOptions.flicker.fast.amplitude.max
                );
            } else {
                this.flickerSpeeds[i] = this.starsOptions.flicker.slow.speed;
                this.flickerAmplitudes[i] = this.starsOptions.flicker.slow.amplitude;
            }
        }
    }

    /**
     * Create star points
     * @description Create star points
     * @param {THREE.BufferGeometry} geometry - Geometry of the stars
     * @returns {Promise<void>}
     */
    _createStarPoints(geometry) {
        const material = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: this.starsOptions.size?.attenuation ?? true,
            size: this.starsOptions.size?.multiplier ?? 2,
            transparent: this.starsOptions.material?.transparent ?? true,
            opacity: this.starsOptions.material?.opacity ?? 1,
            blending: this.starsOptions.material?.blending ?? THREE.NormalBlending,
            map: createStarTexture(this.starsOptions.texture)
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    /**
     * Create stars
     * @description Create stars
     * @returns {Promise<void>}
     */
    _createStars() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.starsOptions.count * 3);
        const colors = new Float32Array(this.starsOptions.count * 3);
        const sizes = new Float32Array(this.starsOptions.count);

        this.phases = new Float32Array(this.starsOptions.count);
        this.isMoving = new Float32Array(this.starsOptions.count);
        this.movePhases = new Float32Array(this.starsOptions.count);
        this.flickerSpeeds = new Float32Array(this.starsOptions.count);
        this.flickerAmplitudes = new Float32Array(this.starsOptions.count);

        this._initStarAttributes(positions, colors, sizes);
        setupGeometry(geometry, positions, colors, sizes);
        this._createStarPoints(geometry);
    }

    /**
     * Update the stars
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
        
        const positions = this.stars.geometry.attributes.position.array;
        const sizes = this.stars.geometry.attributes.size.array;
        const depthRange = this.starsOptions.depth.range;
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            this.phases[index] += this.flickerSpeeds[index];
            const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
            sizes[index] = brightness * getRandomValue(this.starsOptions.size.min, this.starsOptions.size.max);
            
            if (this.isMoving[index] === 1) {
                this.movePhases[index] += this.starsOptions.movement.speed;
                
                // Use default amplitude if not specified
                const amplitude = this.starsOptions.movement.amplitude || { x: 0.05, y: 0.05, z: 0.02 };
                
                positions[i] += Math.sin(this.movePhases[index]) * amplitude.x;
                positions[i + 1] += Math.cos(this.movePhases[index]) * amplitude.y;
                positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * amplitude.z;
            }
            
            // Boundary checks
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < this.starsOptions.depth.z[0]) positions[i + 2] = this.starsOptions.depth.z[1];
            if (positions[i + 2] > this.starsOptions.depth.z[1]) positions[i + 2] = this.starsOptions.depth.z[0];
        }
        
        this.stars.geometry.attributes.position.needsUpdate = true;
        this.stars.geometry.attributes.size.needsUpdate = true;
        
        this.updateCamera();
        this.renderScene();
    }

    /**
     * Cleanup the stars
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