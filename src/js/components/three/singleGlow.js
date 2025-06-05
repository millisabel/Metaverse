import * as THREE from 'three';
import { createLogger } from "../../utils/logger";

import vertexShader from '../../shaders/glow.vert';
import fragmentShader from '../../shaders/glow.frag';

import { 
    generateTrajectoryParams, 
    calculateMovementPosition,
    applyRandomizedPulseOptions,
    getPositionByElement
} from '../../utilsThreeD/glowUtils';



export const SINGLE_GLOW_DEFAULT_OPTIONS = {
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
            zEnabled: false,
            speed: 0.1,
            range: { x: 0, y: 0, z: 0 },
        },
        intersection: {
            enabled: false,
            selector: null,
            colorVar: null,
            lerpSpeed: 0,
        },
    },
    shaderOptions: {
        color: 0xFFFFFF,
        radius: 1,
        segments: 4,
        opacity: { min: 0.5, max: 1 },
        scale: { min: 1, max: 2 },
        pulse: {
            enabled: true,
            speed: { min: 0.1, max: 0.3 },
            intensity: 2,
            randomize: false,
            highlightIntensity: 0,
        },
        sync: {
            enabled: false,
            scale: false,
            opacity: false,
        },
    },
};

const SHADER_UNIFORMS = {
    color: v => ({ value: new THREE.Color(v.options.shaderOptions.color) }),
    opacity: v => ({ value: v.options.shaderOptions.opacity.max }),
    time: v => ({ value: 0 }),
    scaleMin: v => ({ value: v.options.shaderOptions.scale.min }),
    scaleMax: v => ({ value: v.options.shaderOptions.scale.max }),
    pulseSpeed: v => ({ value: v._pulseSpeed }),
    pulseIntensity: v => ({ value: typeof v.options.shaderOptions.pulse.intensity === 'number' ? 
        v.options.shaderOptions.pulse.intensity : 
        v.options.shaderOptions.pulse.intensity.max ?? 2 }),
    objectPulse: v => ({ value: v.options.shaderOptions.objectPulse }),
};

/**
 * SingleGlow class
 * @param {THREE.Scene} parentScene - The parent scene
 * @param {THREE.WebGLRenderer} parentRenderer - The parent renderer
 * @param {HTMLElement} container - The container element
 * @param {THREE.Camera} camera - The camera
 * @param {Object} options - The options
 */
export class SingleGlow {
    constructor(options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.options = options;
        this.index = options.index ?? 0;

        this.mesh = null;
        this.position = null;
        this.range = null;
        this._trajectory = null;
        this._pulseSpeed = null;
        this._currentColor = null;
        this._targetColor = null;

        this._initPositionAndMovement();
        this._initPulseSettings();
        this._initIntersectionColors();
    }

    /**
     * @description Sets up the glow
     * @returns {void}
     */
    setup() {
        this.mesh = this._createMesh();
        this._trajectory = generateTrajectoryParams(this.range);
        this._setPosition(this.position);
    }

    /**
     * @description Updates the position of the glow (movement animation)
     * @param {number} time - The current time (seconds)
     * @returns {void}
     */
    update(time) {
        this._updateTime(time);
        this._updatePulse(time);
        this._updateMovement(time);
        this._updateIntersectionColor();
    }

    /**
     * @description Cleans up the glow
     * @returns {void}
     */
    cleanup() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
    }

    /**
     * @description Synchronizes the scale and opacity of the glow with the position of the object (e.g. card) along the Z axis
     * @param {Dynamics3D} object - object with the position to synchronize
     */
    syncWithObjectPosition(object) {
        if (!object) return;
        const syncOptions = this.options.shaderOptions.sync || {};
        if (!syncOptions.scale && !syncOptions.opacity) return;

        const position = object.currentPosition?.position;
        if (!position || typeof position.z !== 'number') return;

        const z = position.z;
        const zParams = object.animationParams.group?.position?.z || {};
        const baseZ = zParams.basePosition ?? 0;
        const amplitudeZ = zParams.amplitude ?? 0;
        const realMinZ = baseZ - amplitudeZ;
        const realMaxZ = baseZ;
        const tolerance = Math.abs(amplitudeZ) * 0.01;
        const minZ = realMinZ - tolerance;
        const maxZ = realMaxZ + tolerance;

        let normalizedZ = (z - minZ) / (maxZ - minZ);
        normalizedZ = Math.max(0, Math.min(1, normalizedZ));
        if (minZ > maxZ) {
            normalizedZ = 1 - normalizedZ;
        }

        const scaleRange = this.options.shaderOptions.scale;
        const opacityRange = this.options.shaderOptions.opacity;
        const calculatedScale = scaleRange.min + (scaleRange.max - scaleRange.min) * normalizedZ;
        const finalScale = Math.max(scaleRange.min, Math.min(scaleRange.max, calculatedScale));

        const calculatedOpacity = opacityRange.min + (opacityRange.max - opacityRange.min) * normalizedZ;
        const finalOpacity = Math.max(opacityRange.min, Math.min(opacityRange.max, calculatedOpacity));
        
        if (this.index === 0) {
            this.logger.log(`[SingleGlow][syncWithObjectPosition][index=0] Z: ${z.toFixed(2)}, NormalizedZ: ${normalizedZ.toFixed(2)}, Scale: ${finalScale.toFixed(2)}, Opacity: ${finalOpacity.toFixed(2)}`);
        }

        if (syncOptions.scale) this._setShaderScale(finalScale);
        if (syncOptions.opacity) this._setOpacity(finalOpacity);
    }

    /**
     * @description Initializes position and movement properties
     * @private
     */
    _initPositionAndMovement() {
        this.position = this.options.objectOptions.positioning?.position;
        this.range = this.options.objectOptions.movement?.range;
    }

    /**
     * @description Initializes pulse settings if enabled
     * @private
     */
    _initPulseSettings() {
        if (this.options.shaderOptions.pulse?.enabled) {
            if (this.options.shaderOptions.pulse.randomize) {
                applyRandomizedPulseOptions(this.options.shaderOptions);
            }
            this._pulseSpeed = this._initPulseSpeed();
        }
    }

    /**
     * @description Initializes intersection colors if enabled
     * @private
     */
    _initIntersectionColors() {
        if (this.options.objectOptions.intersection?.enabled) {
            this._currentColor = new THREE.Color(this.options.shaderOptions.color);
            this._targetColor = new THREE.Color(this.options.shaderOptions.color);
        }
    }

    /**
     * @description Creates a mesh for the glow
     * @returns {THREE.Mesh}
     */
    _createMesh() {
        const geometry = this._createGeometry();
        const material = this._createMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    /**
     * @description Creates a geometry for the glow (default circle)
     * @returns {THREE.Geometry}
     */
    _createGeometry() {
        const radius = this.options.shaderOptions.radius ?? 1;
        const segments = this.options.shaderOptions.segments ?? 16;
        const geometry = new THREE.CircleGeometry(radius, segments);
        return geometry;
    }

    /**
     * @description Creates a ShaderMaterial for the glow
     * @returns {THREE.ShaderMaterial}
     */
    _createMaterial() {
        const uniforms = this._initializeUniforms();

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        return material;
    }

    /**
     * @description Initializes shader uniforms with appropriate values
     * @returns {Object} The uniforms object
     * @private
     */
    _initializeUniforms() {
        const uniforms = {};
        
        for (const key in SHADER_UNIFORMS) {
            uniforms[key] = SHADER_UNIFORMS[key](this);
        }

        const syncEnabled = this.options.shaderOptions.sync?.enabled;
        uniforms.syncScale = { value: this._getInitialScale(syncEnabled) };
        uniforms.opacity = { value: this._getInitialOpacity(syncEnabled) };

        return uniforms;
    }

    /**
     * @description Gets initial scale value based on sync state
     * @param {boolean} syncEnabled - Whether sync is enabled
     * @returns {number} Initial scale value
     * @private
     */
    _getInitialScale(syncEnabled) {
        if (syncEnabled) {
            return this.options.shaderOptions.scale?.min ?? 0;
        }
        return this.options.shaderOptions.scale?.max ?? 1.0;
    }

    /**
     * @description Gets initial opacity value based on sync state
     * @param {boolean} syncEnabled - Whether sync is enabled
     * @returns {number} Initial opacity value
     * @private
     */
    _getInitialOpacity(syncEnabled) {
        if (syncEnabled) {
            return this.options.shaderOptions.opacity?.min ?? 0;
        }
        return this.options.shaderOptions.opacity?.max ?? 1.0;
    }

    /**
     * @description Updates the time uniform in the shader
     * @param {number} time - The current time
     * @private
     */
    _updateTime(time) {
        if (this.mesh && this.mesh.material) {
            this.mesh.material.uniforms.time.value = time;
        }
    }

    /**
     * @description Updates pulse animation if enabled and not synced
     * @param {number} time - The current time
     * @private
     */
    _updatePulse(time) {
        if (this.options.shaderOptions.pulse?.enabled && !this.options.shaderOptions.sync?.scale) {
            const pulse = this._calculatePulse(time);
            this._setShaderScale(pulse);
        }
    }

    /**
     * @description Updates movement animation if enabled
     * @param {number} time - The current time
     * @private
     */
    _updateMovement(time) {
        if (this.options.objectOptions.movement?.enabled) {
            this._applyMovement(time);
        }
    }

    /**
     * @description Updates intersection color interpolation if enabled
     * @private
     */
    _updateIntersectionColor() {
        if (this.options.objectOptions.intersection?.enabled) {
            this._lerpColor();
        }
    }

    /**
     * @description Sets the position of the glow mesh
     * @param {Object} position - The position {x, y, z}
     * @private
     */
    _setPosition(position) {
        if (!this.mesh || !position) {
            console.warn('_setPosition: no mesh or position', { mesh: this.mesh, position });
            return;
        }
        
        const newPosition = new THREE.Vector3(
            position.x || 0,
            position.y || 0,
            position.z || 0
        );
        
        this.mesh.position.copy(newPosition);
    }

    /**
     * @description Applies movement to the glow
     * @param {number} time - The current time
     * @returns {void}
     */
    _applyMovement(time) {
        const { movement, positioning } = this.options.objectOptions;
        if (!movement?.enabled) return;

        const newPosition = calculateMovementPosition(
            time,
            this._trajectory,
            positioning.initialPosition,
            movement.speed,
            movement.zEnabled
        );

        this._setPosition(newPosition);
    }

    /**
     * @description Updates the target color for interpolation
     * @param {THREE.Color} color - New target color
     */
    updateTargetColor(color) {
        if (this._targetColor) {
            this._targetColor.copy(color);
        }
    }

    /**
     * @description Smoothly changes the current color to the target
     * @private
     */
    _lerpColor() {
        const lerpSpeed = this.options.objectOptions.intersection?.lerpSpeed ?? 0.05;
        this._currentColor.lerp(this._targetColor, lerpSpeed);
        
        if (this.mesh.material.uniforms.color) {
            this.mesh.material.uniforms.color.value.copy(this._currentColor);
        }
    }

    /**
     * @description Initializes the pulse speed
     * @private
     * @returns {number} The pulse speed
     */
    _initPulseSpeed() {
        const pulseSpeed = this.options.shaderOptions?.pulse?.speed;
        if (typeof pulseSpeed === 'number') {
            return pulseSpeed;
        }
        
        return pulseSpeed?.max ?? 0.5;
    }

    /**
     * @description Calculates the pulse based on the current time
     * @param {number} time - The current time (seconds)
     * @returns {number} The calculated pulse
     */
    _calculatePulse(time) {
        const pulse = this.options.shaderOptions.pulse;
        const speed = typeof pulse.speed === 'number' ? pulse.speed : (pulse.speed?.max ?? 0.3);
        const min = this.options.shaderOptions.scale.min ?? 0.8;
        const max = this.options.shaderOptions.scale.max ?? 1.2;
        
        const basePulseValue = (Math.sin(time * speed) + 1) / 2; 

        const highlightIntensity = pulse.highlightIntensity ?? 0; 
        const syncEnabledFlag = this.options.shaderOptions.sync?.enabled ? 1.0 : 0.0; 

        const objectInfluence = THREE.MathUtils.smoothstep(highlightIntensity, 0.0, 1.0) * syncEnabledFlag;

        const combinedEffect = THREE.MathUtils.lerp(
            basePulseValue,
            basePulseValue * (1.0 + objectInfluence),
            THREE.MathUtils.smoothstep(objectInfluence, 0.0, 1.0) 
        );

        const finalPulseFactor = Math.pow(combinedEffect, 1.2) * pulse.intensity;

        return min + (max - min) * finalPulseFactor;
    }

    /**
     * @description Sets the opacity of the glow dynamically
     * @param {number} opacity - New opacity for the glow
     */	
    _setOpacity(opacity) {
        if (!this.mesh || !this.mesh.material?.uniforms?.opacity) return;
        this.mesh.material.uniforms.opacity.value = opacity;
    }


    /**
     * @description Sets the scale of the glow through the uniform (scale in the shader)
     * @param {number} scale - New scale for the shader
     */
    _setShaderScale(scale) {
        if (!this.mesh || !this.mesh.material?.uniforms?.syncScale) return;
        this.mesh.material.uniforms.syncScale.value = scale;
    }

    /**
     * @description Updates the position of the glow by the card
     * @returns {void}
     */
    updatePositionByCard() {
        const targetSelector = this.options.objectOptions?.positioning?.targetSelector;
        const align = this.options.objectOptions?.positioning?.align || 'center center';
        const container = this.options.container;
        const offset = this.options.objectOptions?.positioning?.offset || { x: 0, y: 0 };

        const options = {
            positioning: {
                targetSelector,
                container,
                align,
                offset,
            },
        };

        const position = getPositionByElement(options);

        this.mesh.position.x = position.x;
        this.mesh.position.y = position.y;
    }
} 
