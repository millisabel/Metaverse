import * as THREE from 'three';

import { getRandomValue } from '../../utils/utils';
import { gaussianRandom, setupGeometry } from '../../utilsThreeD/utilsThreeD';
import { createStarTexture } from '../../utilsThreeD/textureUtils';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { ShaderController } from '../../controllers/ShaderController';

import vertexShaderSource from '../../shaders/star.vert';
import fragmentShaderSource from '../../shaders/star.frag';

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
    count: 3000,
    colors: [0xFFFFFF],
    size: {
        min: 2,
        max: 6,
    },
    depth: {
        range: 500,
        z: [200, -500]
    },
    movement: {
        enabled: true,
        probability: 0.2,
        speed: 0.03,
        amplitude: { x: 0.1, y: 0.05, z: 25 }
    },
    flicker: {
        fast: {
            probability: 0.05,
            speed: { min: 0.05, max: 0.1 },
            amplitude: { min: 0.5, max: 5.5 }
        },
        slow: {
            probability: 0.5,
            speed: { min: 0.01, max: 0.09 },
            amplitude: { min: 1.5, max: 1.5 }
        }
    },
    shader: {
        texture: { 
            size: 64, 
            color: 0xffffff, 
        },
        opacity: 1,
        transparent: true,
        uniforms: {
            glowColor: 0xFFFFFF,
            glowStrength: 5,
        }
    },
    responsive: {}
};

export class Stars extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, defaultOptions);
        
        this.stars = null;
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
        this.baseSizes = null;
        this.shaderController = null;
        this.starTexture = null;  // Store texture reference
    }

    /**
     * Setup the stars scene
     * @description Setup the stars scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        this._createStars();
    }

    onResize() {
        if (super.onResize) super.onResize();
    }

    /**
     * @description Update the stars position, size, and color
     * @returns {Promise<void>}
     */
    update() {
        if (!this.stars) return;
        this._updateStarAttributes();
        super.update();
    }

    /**
     * @description Cleanup the stars
     * @returns {Promise<void>}
     */
    cleanup() {
        if (this.stars) {
            this.stars.geometry?.dispose();
            this.stars.material?.dispose();
            this.stars = null;
        }
        
        if (this.starTexture) {
            this.starTexture.dispose();
            this.starTexture = null;
        }
        
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
        this.baseSizes = null;

        super.cleanup();
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

        this.baseSizes = this._getBaseSizes();

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.options.count * 3);
        const colors = new Float32Array(this.options.count * 3);
        const sizes = new Float32Array(this.options.count);

        this._initStarAttributes(positions, colors, sizes, this.options.flicker);
        setupGeometry(geometry, positions, colors, sizes);
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        this._createStarPoints(geometry);
    }

    /**
     * @description Initialize the star attributes
     * @param {Float32Array} positions - Positions of the stars
     * @param {Float32Array} colors - Colors of the stars
     * @param {Float32Array} sizes - Sizes of the stars
     * @param {Object} flicker - Flicker options
     * @returns {Promise<void>}
     */
    _initStarAttributes(positions, colors, sizes, flicker) {
        for (let i = 0; i < this.options.count; i++) {
            const starPosition = this._getRandomStarPosition();
            this._setStarPosition(positions, i, starPosition);

            const color = this._getRandomStarColor();
            this._setStarColor(colors, i, color);

            sizes[i] = getRandomValue(this.options.size.min, this.options.size.max);

            this._initStarAnimationParams(i, flicker);
        }
    }

    /**
     * @description Create star points
     * @param {THREE.BufferGeometry} geometry - Geometry of the stars
     * @returns {Promise<void>}
     */
    _createStarPoints(geometry) {
        // Create texture only once
        if (!this.starTexture) {
            this.starTexture = createStarTexture(this.options.shader.texture);
        }
        
        this.shaderController = new ShaderController({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                pointTexture: { value: this.starTexture },
                glowColor: { value: new THREE.Color(this.options.shader.uniforms.glowColor) },
                glowStrength: { value: this.options.shader.uniforms.glowStrength },
                opacity: { value: this.options.shader.opacity },
            },
            options: {
                vertexColors: true,
                transparent: this.options.shader.transparent,
                depthTest: true,
                blending: THREE.AdditiveBlending,
            }
        });
        const material = this.shaderController.getMaterial();
        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
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
            this._updateStarFlickerAndSize(index, sizes);
            this._updateStarMovement(index, positions);
            this._handleStarBounds(index, positions, depthRange);
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
     * @description Get the base sizes of the stars
     * @returns {Float32Array} - Base sizes of the stars
     */
    _getBaseSizes() {
        this.baseSizes = new Float32Array(this.options.count);

        for (let i = 0; i < this.options.count; i++) {
            this.baseSizes[i] = getRandomValue(this.options.size.min, this.options.size.max);
        }

        return this.baseSizes;
    }

    /**
     * @description Get a random star position
     * @returns {Array} - Random star position
     */
    _getRandomStarPosition() {
        const x = gaussianRandom(0, this.options.depth.range / 3);
        const y = gaussianRandom(0, this.options.depth.range / 3);
        const z = this.options.depth.z[0] + Math.random() * (this.options.depth.z[1] - this.options.depth.z[0]);
        return [x, y, z];
    }

    /**
     * @description Set the star position
     * @param {Float32Array} positions - Positions of the stars
     * @param {number} index - Index of the star
     * @param {Array} starPosition - Position of the star
     * @returns {Promise<void>}
     */
    _setStarPosition(positions, index, starPosition) {
        const i = index * 3;
        const [x, y, z] = starPosition;

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;
    }

    /**
     * @description Get a random star color
     * @returns {number} - Random star color
     */ 
    _getRandomStarColor() {
        return this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
    }

    /**
     * @description Set the star color
     * @param {Float32Array} colors - Colors of the stars
     * @param {number} index - Index of the star
     * @param {number} color - Color of the star
     * @returns {Promise<void>}
     */
    _setStarColor(colors, index, color) {
        const i = index * 3;
        colors[i] = (color >> 16 & 255) / 255;
        colors[i + 1] = (color >> 8 & 255) / 255;
        colors[i + 2] = (color & 255) / 255;
    }

    /**
     * @description Initialize the star animation parameters
     * @param {number} i - Index of the star
     * @param {Object} flicker - Flicker options
     * @returns {Promise<void>}
     */
    _initStarAnimationParams(i, flicker) {
        this.phases[i] = Math.random() * Math.PI * 2;
        this.isMoving[i] = this.options.movement.enabled && Math.random() < this.options.movement.probability ? 1 : 0;
        this.movePhases[i] = Math.random() * Math.PI * 2;
    
        if (Math.random() < flicker.fast.probability) {
            this.flickerSpeeds[i] = getRandomValue(
                flicker.fast.speed.min,
                flicker.fast.speed.max
            );
            this.flickerAmplitudes[i] = getRandomValue(
                flicker.fast.amplitude.min,
                flicker.fast.amplitude.max
            );
        } else if (Math.random() < flicker.slow.probability) {
            this.flickerSpeeds[i] = getRandomValue(flicker.slow.speed.min, flicker.slow.speed.max);
            this.flickerAmplitudes[i] = getRandomValue(flicker.slow.amplitude.min, flicker.slow.amplitude.max);
        } else {
            this.flickerSpeeds[i] = 0.005;
            this.flickerAmplitudes[i] = 2;
        }
    }

    /**
     * @description Update the star flicker and size
     * @param {number} index - Index of the star
     * @param {Float32Array} sizes - Sizes of the stars
     * @returns {Promise<void>}
     */ 
    _updateStarFlickerAndSize(index, sizes) {
        this.phases[index] += this.flickerSpeeds[index];
        const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
        sizes[index] = brightness * this.baseSizes[index];
    }

    /**
     * @description Update the star movement
     * @param {number} index - Index of the star
     * @param {Float32Array} positions - Positions of the stars
     * @returns {Promise<void>}
     */
    _updateStarMovement(index, positions) {
        if (this.isMoving[index] === 1) {
            this.movePhases[index] += this.options.movement.speed || this._moveProgressStep;
            const amplitude = this.options.movement.amplitude || { x: 0.05, y: 0.05, z: 0.02 };
            const i = index * 3;
            positions[i] += Math.sin(this.movePhases[index]) * amplitude.x;
            positions[i + 1] += Math.cos(this.movePhases[index]) * amplitude.y;
            positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * amplitude.z;
        }
    }

    /**
     * @description Handle the star bounds
     * @param {number} index - Index of the star
     * @param {Float32Array} positions - Positions of the stars
     * @param {number} depthRange - Depth range of the stars
     * @returns {Promise<void>}
     */
    _handleStarBounds(index, positions, depthRange) {
        const i = index * 3;
        if (positions[i] < -depthRange) positions[i] = depthRange;
        if (positions[i] > depthRange) positions[i] = -depthRange;
        if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
        if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
        if (positions[i + 2] < this.options.depth.z[0]) positions[i + 2] = this.options.depth.z[1];
        if (positions[i + 2] > this.options.depth.z[1]) positions[i + 2] = this.options.depth.z[0];
    }
}