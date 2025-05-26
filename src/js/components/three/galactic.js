import * as THREE from 'three';

import { createLogger } from "../../utils/logger";
import { isMobile } from '../../utils/utils';
import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { ShaderController } from '../../controllers/ShaderController';

import vertexShader from '../../shaders/galacticCore.vert';
import fragmentShader from '../../shaders/galacticCore.frag';

const galacticTexture = './assets/images/galaxy-texture.png';

/**
 * @description The default options for the galactic cloud
 * @type {Object}
 * @property {number} core.size - The size of the core
 * @property {number} core.segments - The segments of the core
 */

const DEFAULT_OPTIONS = {
    orbit: {
        radius: 5,
        speed: 1,
        phase: { 
            x: -Math.PI / 2, 
            y: 0 },
        verticalOffset: 0,
        amplitude: { 
            x: { min: -3, max: 3 }, 
            y: { min: -1, max: 2 }, 
            z: { min: 10, max: 20 } 
        },
        rotation: {
            x: Math.PI / 4,
            y: 0,
            z: 0,
        },
    },
    core: {
        size: 3,               
        segments: 16,           
        scale: {
            min: 1.8,
            max: 5.0,
            waves: [
                { freq: 0.5, amp: 1.08, phase: 0.0 },
                { freq: 0.13, amp: 0.4, phase: 1.3 },
                { freq: 0.23, amp: 3.03, phase: -2.1 }
            ]
        },
        rotation: {
            x: Math.PI / 4,
            y: 0,
            z: 0,
        },
        shader: {               
            opacity: 1.0,
            color: {
                core: [1.0, 1.0, 1.0],
                edge: [0.8, 0.4, 1.0],
            },
            glow: {
                color: [0.4, 0.0, 0.6],
                strength: 10.0,
                coreStrength: 0.5,
                coreRadius: 0.35,
            },
            pulseWaves: [
                { freq: 1.0, amp: 0.5, phase: 0.0 },
                { freq: 0.37, amp: 0.3, phase: 1.7 },
                { freq: 1.31, amp: 0.2, phase: -2.0 }
            ],
            pulseNoise: { scale: 0.05, speed: 0.5 },
        }
    },
    plane: {
        size: isMobile() ? 4 : 8,
        opacity: 1,
        transparent: false,
        animation: {
            baseScale: 1.0,
            pulsePrimary: { freq: 0.5, amp: 0.15 },
            pulseSecondary: { freq: 0.2, amp: 0.1 },
            pulseMicro: { freq: 1.5, amp: 0.05 },
        }
    },
};

/**
 * @description The galactic cloud
 * @type {Object}
 * @property {Object} core - The core of the galactic cloud
 * @property {Object} plane - The plane of the galactic cloud
 */
export class GalacticCloud extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, DEFAULT_OPTIONS);

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.galaxyCore = null;
        this.galaxyPlane = null;
        this.shaderController = null;
        this._initialPositioned = false;
        this._useInitialOffset = true;
    }

    /**
     * @public
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        this._createGalaxyCore();
        // await this._galaxyPlane();
        // this.setupLights();
    }

    /**
     * @public
     * @description Updates the scene (animation, rendering)
     * @returns {Promise<void>}
     */
    update() {
        const time = performance.now() * 0.0001;

        this._updateGalaxyCorePulse(time);
        // this._updateGalaxyPlanePulse(time);
        this._updateCameraOrbit(time);

        super.update();
    }

    /**
     * @public
     * @description Handles window resize
     * @returns {Promise<void>}
     */
    onResize() {
        if (!this.renderer || !this.camera) return;

        super.onResize();
        this._updateCameraOrbit(0); 

        if (this.galaxyPlane) {
            const planeSize = this.options.plane.size;
            this.galaxyPlane.scale.set(planeSize/8, planeSize/8, planeSize/8);
        }

        if (this.galaxyCore) {
            this.galaxyCore.material.uniforms.resolution.value.set(this.container.clientWidth, this.container.clientHeight);
        }
    }

    /**
     * @public
     * @description Cleans up the galaxy resources and postprocessing
     * @returns {Promise<void>}
     */
    cleanup() {
        let message = `starting cleanup in ${this.constructor.name}\n`;

        super.cleanup(message);
    }

    /**
     * @description Creates the galaxy core
     * @returns {Promise<void>}
     * @protected
     */     
    _createGalaxyCore() {
        const { size, segments, shader } = this.options.core;
        const coreGeometry = new THREE.CircleGeometry(
            size, 
            segments, 
        );
        this.shaderController = new ShaderController({
            vertexShader,
            fragmentShader,
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                opacity: { value: shader.opacity },
                coreColor: { value: new THREE.Vector3(...shader.color.core) },
                edgeColor: { value: new THREE.Vector3(...shader.color.edge) },
                glowColor: { value: new THREE.Vector3(...shader.glow.color) },
                glowStrength: { value: shader.glow.strength },
                coreGlowStrength: { value: shader.glow.coreStrength },
                coreGlowRadius: { value: shader.glow.coreRadius },
                pulseFreqs: { value: new Float32Array(shader.pulseWaves.map(w => w.freq)) },
                pulseAmps: { value: new Float32Array(shader.pulseWaves.map(w => w.amp)) },
                pulsePhases: { value: new Float32Array(shader.pulseWaves.map(w => w.phase)) },
                pulseNoiseScale: { value: shader.pulseNoise.scale },
                pulseNoiseSpeed: { value: shader.pulseNoise.speed }
            },
            options: {
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            }
        });
        this.galaxyCore = new THREE.Mesh(coreGeometry, this.shaderController.getMaterial());
        this._setGalaxyCoreRotation();
        this.scene.add(this.galaxyCore);
    }

    /**
     * @description Sets the galaxy core rotation
     * @returns {void}
     * @protected
     */
    _setGalaxyCoreRotation() {
        this.galaxyCore.rotation.x = this.options.core.rotation.x;
        this.galaxyCore.rotation.y = this.options.core.rotation.y;
        this.galaxyCore.rotation.z = this.options.core.rotation.z;
    }

    /**
     * @description Updates the galaxy core pulse
     * @param {number} time - The time
     * @protected
     */
    _updateGalaxyCorePulse(time) {
        const { scale } = this.options.core;
        let scalePulse = 0;
        for (let i = 0; i < scale.waves.length; i++) {
            const w = scale.waves[i];
            scalePulse += Math.sin(time * w.freq * Math.PI * 2 + w.phase) * w.amp;
        }
        let finalScale = 1 + scalePulse;
        finalScale = Math.max(scale.min, Math.min(scale.max, finalScale));

        if (!this._lastScale) this._lastScale = finalScale;
        const smoothScale = this._lastScale + (finalScale - this._lastScale) * 0.1;
        this._lastScale = smoothScale;

        if (this.galaxyCore && this.shaderController) {

            this.shaderController.setUniform('time', time);
            this.galaxyCore.scale.set(smoothScale, smoothScale, smoothScale);

        }
    }

    /**
     * @description Creates the galaxy plane
     * @returns {Promise<void>}
     * @protected
     */
    async _galaxyPlane() {
        const textureLoader = new THREE.TextureLoader();
        let galaxyTexture = null;
        try {
            galaxyTexture = await textureLoader.loadAsync(galacticTexture);        } catch (error) {
            this.logger.log('Failed to load galaxy texture', {
                conditions: ['error'],
                functionName: 'creategalaxyPlane',
                customData: { error }
            });
            return; 
        }

        const planeSize = this.options.plane.size; 

        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: galaxyTexture,
            transparent: this.options.plane.transparent,
            opacity: this.options.plane.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const galaxyPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        galaxyPlane.rotation.x = Math.PI / 2;
        if (this.scene) {
            this.scene.add(galaxyPlane);
        }
        this.galaxyPlane = galaxyPlane;
    }

    /**
     * @description Updates the galaxy plane pulse
     * @param {number} time - The time
     * @returns {void}
     * @protected
     */
    _updateGalaxyPlanePulse(time) {
        if (!this.galaxyPlane) return;
        const pulseFactor = this._getPulseFactor(time);
        this.galaxyPlane.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }

    /**
     * @description Gets the pulse factor
     * @param {number} time - The time
     * @returns {number}
     * @protected
     */
    _getPulseFactor(time) {
        const { pulsePrimary, pulseSecondary, pulseMicro } = this.options.plane.animation;
        const baseScale = this.options.plane.animation.baseScale;
        const primaryWave = Math.sin(time * pulsePrimary.freq) * pulsePrimary.amp;
        const secondaryWave = Math.sin(time * pulseSecondary.freq) * pulseSecondary.amp;
        const microWave = Math.sin(time * pulseMicro.freq) * pulseMicro.amp;
        return baseScale + primaryWave + secondaryWave + microWave;
    }

    /**
     * @description Updates the camera orbit
     * @param {number} time - The time
     * @returns {void}
     * @protected
     */
    _updateCameraOrbit(time) {
        const orbitOpts = this.options.orbit;
        const pos = this._calcScreenOrbitPosition(time, orbitOpts);
        this.cameraController.options.position = { x: pos.x, y: pos.y, z: pos.z };
        this.cameraController.options.lookAt = { x: 0, y: 0, z: 0 };
    }

    /**
     * Calculates the orbit position relative to orbitCenter
     * Amplitude controls the offset and range of movement
     * @param {number} time
     * @param {Object} orbitOptions
     * @returns {Object} { x, y, z }
     */
    _calcScreenOrbitPosition(time, orbitOptions) {
        const {
            amplitude = { x: { min: 2, max: 8 }, y: { min: 1, max: 5 }, z: { min: 80, max: 120 } },
            speed = 0.5,
            phase = { x: 0, y: 0 }, 
            orbitCenter = { x: 0, y: 0, z: 0 }
        } = orbitOptions;

        // Camera orbits around orbitCenter
        const angleX = time * speed + phase.x;
        const angleY = time * speed * 1.3 + phase.y;
        const x = orbitCenter.x + amplitude.x.min + (amplitude.x.max - amplitude.x.min) * (0.5 + 0.5 * Math.sin(angleX));
        const y = orbitCenter.y + amplitude.y.min + (amplitude.y.max - amplitude.y.min) * (0.5 + 0.5 * Math.sin(angleY));
        const z = orbitCenter.z + amplitude.z.min + (amplitude.z.max - amplitude.z.min) * (0.5 + 0.5 * Math.sin(angleX * 0.7));
        return { x, y, z };
    }
}

