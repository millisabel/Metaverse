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
        rotation: {
            x: Math.PI / 3,
            y: 0,
            z: 0,
        },
        initialOffset: {
            x: 2,
            y: 0,
            z: -2,
        },
        phase: {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 4,
        },
        amplitude: {
            x: { min: -2, max: 2 },
            y: { min: -2, max: 1 },
            z: { min: -2, max: -8 },
        },
        scale: {
            min: 0.8,
            max: 2,
        },
        speedPulse: 0.05,
    },
    core: {
        size: 2.5,               
        segments: 4,           
        shader: {               
            opacity: 0.5,
            color: {
                core: [1.0, 1.0, 1.0],
                edge: [0.8, 0.4, 1.0],
            },
            transitionRadius: 0.3, 
            pulse: {
                amplitudeCore: 0.10, 
                amplitudeEdge: 0.50, 
                speedCore: 0.5,
                speedEdge: 1.3,
            },
        }
    },
    plane: {
        size: isMobile() ? 2 : 3,
        opacity: 1,
        transparent: false,
        rotationSpeed: 0.0005,
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

        this._orbitPhase = this.options.orbit.phase;
    }

    /**
     * @public
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        await this._createGalaxyCore();
        await this._createGalaxyPlane();

        this._setOrbitRotation(this.galaxyCore);
        this._setOrbitRotation(this.galaxyPlane);

        this._setOrbitPosition(this.galaxyCore);
        this._setOrbitPosition(this.galaxyPlane);
    }

    /**
     * @public
     * @description Updates the scene (animation, rendering)
     * @returns {Promise<void>}
     */
    update() {
        // --- Позиция ---
        const pos = this.options.orbit.initialOffset;
        if (this.galaxyCore) {
            this.galaxyCore.position.set(pos.x, pos.y, pos.z);
        }
        if (this.galaxyPlane) {
            this.galaxyPlane.position.set(pos.x, pos.y, pos.z);
        }

        this._updateScalePulse();
        this._updateCorePulse(performance.now() * 0.001);
        this._updatePlaneRotation();
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
    async _createGalaxyCore() {
        const { size, segments, shader } = this.options.core;
        const coreGeometry = new THREE.CircleGeometry(
            size, 
            segments, 
        );
        this.shaderController = new ShaderController({
            vertexShader,
            fragmentShader,
            uniforms: {
                opacity: { value: shader.opacity },
                coreColor: { value: new THREE.Vector3(...shader.color.core) },
                edgeColor: { value: new THREE.Vector3(...shader.color.edge) },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                transitionRadius: { value: shader.transitionRadius },
                pulseAmplitudeCore: { value: shader.pulse.amplitudeCore },
                pulseAmplitudeEdge: { value: shader.pulse.amplitudeEdge },
                pulseSpeedCore: { value: shader.pulse.speedCore },
                pulseSpeedEdge: { value: shader.pulse.speedEdge },
                pulseTime: { value: 0 },
            },
            options: {
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            }
        });
        this.galaxyCore = new THREE.Mesh(coreGeometry, this.shaderController.getMaterial());
        this.scene.add(this.galaxyCore);
    }

    /**
     * @description Creates the galaxy plane
     * @returns {Promise<void>}
     * @protected
     */
    async _createGalaxyPlane() {
        const textureLoader = new THREE.TextureLoader();
        let galaxyTexture = null;

        try {
            galaxyTexture = await textureLoader.loadAsync(galacticTexture);        
        } catch (error) {
            throw new Error('Failed to load galaxy texture');
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
        this._setOrbitRotation(galaxyPlane);
        if (this.scene) {
            this.scene.add(galaxyPlane);
        }
        this.galaxyPlane = galaxyPlane;
    }

    /**
     * @description Sets the position of the object based on the orbit options
     * @param {THREE.Object3D} obj - The object to set the position
     * @returns {void}
     * @protected
     */
    _setOrbitPosition(obj) {
        obj.position.x = this.options.orbit.initialOffset.x;
        obj.position.y = this.options.orbit.initialOffset.y;
        obj.position.z = this.options.orbit.initialOffset.z;
      }

    /**
     * @description Sets the rotation of the object based on the orbit options
     * @param {THREE.Object3D} obj - The object to set the rotation
     * @returns {void}
     * @protected
     */
    _setOrbitRotation(obj) {
        obj.rotation.x = this.options.orbit.rotation.x;
        obj.rotation.y = this.options.orbit.rotation.y;
        obj.rotation.z = this.options.orbit.rotation.z;
    }  

    /**
     * @description Updates the plane rotation
     * @returns {void}
     * @protected
     */
    _updatePlaneRotation() {
        if (this.galaxyPlane) {
            this.galaxyPlane.rotation.z += this.options.plane.rotationSpeed;
        }
    }

    _updateCorePulse(time) {
        if (this.shaderController) {
            this.shaderController.setUniform('pulseTime', time);
        }
    }

    /**
     * @description Calculates the pulse scale  
     * @param {number} time
     * @param {object} phase
     * @param {object} scaleOpts
     * @param {number} speed
     * @returns {number}
     * @protected
     */
    _calcPulseScale(time, phase, scaleOpts, speed = 1.0) {
        if (!scaleOpts) return 1;
        if (speed === 0) {
            return (scaleOpts.min + scaleOpts.max) / 2;
        }
        const t = time * (speed > 0 ? speed : 1);
        const base = Math.sin(t * 2 + phase.x) * 0.5 + 0.5;
        const extra = Math.sin(t * 3.1 + phase.y) * 0.15;
        let scale = scaleOpts.min + (scaleOpts.max - scaleOpts.min) * (base + extra)
        scale = Math.max(scaleOpts.min, Math.min(scaleOpts.max, scale));
        return scale;
    }

    _updateScalePulse() {
        const speedPulse = this.options.orbit.speedPulse || 0;
        const scaleOpts = this.options.orbit.scale;
        const phase = this._orbitPhase;
        const t = performance.now() * 0.001;
        let pulse = 1;
        if (speedPulse > 0) {
            pulse = this._calcPulseScale(t * speedPulse, phase, scaleOpts);
        }
        if (this.galaxyCore) {
            this.galaxyCore.scale.set(pulse, pulse, pulse);
        }
        if (this.galaxyPlane) {
            this.galaxyPlane.scale.set(pulse * 0.8, pulse * 0.8, pulse * 0.8);
        }
    }
}



