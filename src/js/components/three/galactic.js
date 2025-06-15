import * as THREE from 'three';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { ShaderController } from '../../controllers/ShaderController';

import vertexShader from '../../shaders/galacticCore.vert';
import fragmentShader from '../../shaders/galacticCore.frag';
import { canUseWebP } from '../../utilsThreeD/utilsThreeD';

const galacticTexture = canUseWebP()
? './assets/images/galaxy-texture.webp'
: './assets/images/galaxy-texture.png';

/**
 * @description The default options for galactic cloud
 * @type {Object}
 * @property {Object} orbit - The orbit options
 * @property {Object} core - The core options
 * @property {Object} plane - The plane options
 * @property {Object} orbit.rotation - The rotation options x, y, z
 * @property {Object} orbit.initialOffset - The initial offset options x, y, z
 * @property {Object} orbit.phase - The phase options x, y, z
 * @property {Object} orbit.amplitude - The amplitude options x, y, z
 * @property {Object} orbit.scale - The scale options min, max
 * @property {Number} orbit.speedPulse - The speed pulse range 0-1
 * @property {Number} orbit.speedMove - The speed move range 0-1
 * @property {Number} core.size - The size options
 * @property {Number} core.segments - The segments options
 * @property {Object} core.shader - The shader options
 * @property {Number} core.shader.opacity - The opacity options range 0-1
 * @property {Array} core.shader.color - The color options
 * @property {Number} core.shader.transitionRadius - The transition radius options range 0.01-1.0
 * @property {Object} core.shader.pulse - The pulse options
 * @property {Number} core.shader.pulse.amplitudeCore - The amplitude core options range 0-1
 * @property {Number} core.shader.pulse.amplitudeEdge - The amplitude edge options  range 0.01 – 10.0
 * @property {Number} core.shader.pulse.speedCore - The speed core options range 0-1
 * @property {Number} core.shader.pulse.speedEdge - The speed edge options 
 * @property {Number} plane.size - The size options
 * @property {Number} plane.opacity - The opacity options range 0-1
 * @property {Boolean} plane.transparent - The transparent options
 * @property {Number} plane.rotationSpeed - The rotation speed options 
 */

const DEFAULT_OPTIONS = {
    orbit: {
        rotation: {
            x: Math.PI / 3,
            y: 0,
            z: 0,
        },
        initialOffset: {
            x: 0,
            y: -2,
            z: -2,
        },
        phase: {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 4,
        },
        amplitude: {
            x: { min: -2, max: 1 },
            y: { min: -2, max: 1 },
            z: { min: -2, max: -5 },
        },
        scale: {
            min: 0.8,
            max: 3,
        },
        speedPulse: 0.005,
        speedMove: 0,
    },
    core: {
        size: 2,               
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
        size: 2,
        opacity: 1,
        transparent: false,
        rotationSpeed: 0.0005,
    },
    responsive: {
        768: {
            core: {
                size: 3, 
            },
            plane: {
                size: 3,
            },
        },
        1200: {
            orbit: {
                initialOffset: {
                    x: 2,
                    y: 0,
                },
                speedMove: 0.01,
            },
        },
    },
};

/**
 * @description The galactic cloud
 * @type {Object}
 */
export class GalacticCloud extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, DEFAULT_OPTIONS);

        this.galaxyCore = null;
        this.galaxyPlane = null;
        this.shaderController = null;
        this.galaxyTexture = null;  
    }

    /**
     * @public
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        await this._createGalaxyCore();
        await this._createGalaxyPlane();

        this._setObjectPosition(this.galaxyCore, this.options.orbit.initialOffset);
        this._setObjectPosition(this.galaxyPlane, this.options.orbit.initialOffset);

        this._setOrbitRotation(this.galaxyCore);
        this._setOrbitRotation(this.galaxyPlane);
    }

    /**
     * @public
     * @description Updates the scene (animation, rendering)
     * @returns {Promise<void>}
     */
    update() {
        const time = performance.now() * 0.001;

        this._updateObjectPosition(time);
        this._updateObjectPulse(time);
        this._updateCorePulse(time);
        this._updatePlaneRotation();
        super.update();
    }

    /**
     * @public
     * @description Handles window resize
     * @returns {Promise<void>}
     */
    onResize() {
        super.onResize();
        
        // Update shader resolution uniform after resize
        if (this.shaderController) {
            this.shaderController.setUniform('resolution', new THREE.Vector2(window.innerWidth, window.innerHeight));
        }
    }

    /**
     * @public
     * @description Cleans up the galaxy resources and postprocessing
     * @returns {Promise<void>}
     */
    cleanup() {
        if (this.galaxyCore) {
            if (this.scene) this.scene.remove(this.galaxyCore);
            if (this.galaxyCore.geometry) this.galaxyCore.geometry.dispose();
            if (this.galaxyCore.material) this.galaxyCore.material.dispose();
            this.galaxyCore = null;
        }
    
        if (this.galaxyPlane) {
            if (this.scene) this.scene.remove(this.galaxyPlane);
            if (this.galaxyPlane.geometry) this.galaxyPlane.geometry.dispose();
            if (this.galaxyPlane.material) {
                if (this.galaxyPlane.material.map) {
                    this.galaxyPlane.material.map.dispose();
                }
                this.galaxyPlane.material.dispose();
            }
            this.galaxyPlane = null;
        }

        if (this.galaxyTexture) {
            this.galaxyTexture.dispose();
            this.galaxyTexture = null;
        }
    
        if (this.shaderController && typeof this.shaderController.dispose === 'function') {
            this.shaderController.dispose();
        }
        this.shaderController = null;

        super.cleanup();
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
        if (!this.galaxyTexture) {
            const textureLoader = new THREE.TextureLoader();
            try {
                this.galaxyTexture = await textureLoader.loadAsync(galacticTexture);        
            } catch (error) {
                throw new Error('Failed to load galaxy texture');
            }
        }

        const planeSize = this.options.plane.size; 
        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: this.galaxyTexture,
            transparent: this.options.plane.transparent,
            opacity: this.options.plane.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.galaxyPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this._setOrbitRotation(this.galaxyPlane);
        if (this.scene) {
            this.scene.add(this.galaxyPlane);
        }
    }

    /**
     * @description Gets the position of the object based on the orbit options
     * @param {number} t
     * @returns {Object}
     * @protected
     */
    _getPosition(t) {
        const { initialOffset, amplitude, phase, speedMove } = this.options.orbit;
    
        const f = (mult, phase) => (time) =>
            Math.sin(time * speedMove * mult + phase) - Math.sin(phase); // компенсация начального смещения
    
        const fC = (mult, phase) => (time) =>
            Math.cos(time * speedMove * mult + phase) - Math.cos(phase);
    
        return {
            x: initialOffset.x +
                this._mapAmplitude(
                    amplitude.x,
                    f(1.3, phase.x)(t) + 0.5 * fC(4.2, phase.x)(t)
                ),
            y: initialOffset.y +
                this._mapAmplitude(
                    amplitude.y,
                    f(1.0, phase.y)(t)
                ),
            z: initialOffset.z +
                this._mapAmplitude(
                    amplitude.z,
                    f(1.3, phase.z)(t) + 0.5 * fC(3.3, phase.z)(t)
                ),
        };
    }

    /**
     * @description Sets the position of the object based on the orbit options
     * @param {THREE.Object3D} obj - The object to set the position
     * @returns {void}
     * @protected
     */
    _setObjectPosition(obj, position) {
        if (obj && position) {
            obj.position.x = position.x;
            obj.position.y = position.y;
            obj.position.z = position.z;
        }
      }

    /**
     * @description Updates the orbit position
     * @param {number} t
     * @returns {void}
     * @protected
     */
    _updateObjectPosition(t) {
        const position = this._getPosition(t);

        if (this.galaxyCore) {
            this._setObjectPosition(this.galaxyCore, position); 
        }
        if (this.galaxyPlane) {
            this._setObjectPosition(this.galaxyPlane, position);
        }
    }

    /**
     * @description Sets the rotation of the object based on the orbit options
     * @param {THREE.Object3D} obj - The object to set the rotation
     * @returns {void}
     * @protected
     */
    _setOrbitRotation(obj) {
        if (obj && this.options.orbit.rotation) {   
            obj.rotation.x = this.options.orbit.rotation.x;
            obj.rotation.y = this.options.orbit.rotation.y;
            obj.rotation.z = this.options.orbit.rotation.z;
        }
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

    /**
     * @description Updates the core pulse
     * @param {number} time
     * @returns {void}
     * @protected
     */
    _updateCorePulse(time) {
        if (this.shaderController) {
            this.shaderController.setUniform('pulseTime', time);
        }
    }

    /**
     * @description Updates the scale pulse
     * @param {number} t
     * @returns {void}
     * @protected
     */
    _updateObjectPulse(t) {
        const speedPulse = this.options.orbit.speedPulse || 0;
        const scaleOpts = this.options.orbit.scale;
        const phase = this.options.orbit.phase;
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
    
    /**
     * @description Maps the amplitude
     * @param {object} ampl
     * @param {number} value
     * @returns {number}
     * @protected
     */
    _mapAmplitude (ampl, value) {
        return ((ampl.max - ampl.min) / 2) * value + (ampl.max + ampl.min) / 2;
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
    
        const base0 = Math.sin(phase.x) * 0.5 + 0.5;
        const extra0 = Math.sin(phase.y) * 0.15;
    
        const delta = (base + extra) - (base0 + extra0);
    
        let scale = 2.5 + (scaleOpts.max - scaleOpts.min) * delta;
    
        scale = Math.max(scaleOpts.min, Math.min(scaleOpts.max, scale));
        return scale;
    }
}


