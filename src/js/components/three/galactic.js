import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { createLogger } from "../../utils/logger";
import { isMobile } from '../../utils/utils';
import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';

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
    core: {
        size: 3,               
        segments: 16,           
        scale: {                
            min: 2.8,
            max: 3.0
        },
        pulse: 5,               
        pulseFreq: 2.0,         
        shader: {               
            opacity: 1.0,
            coreColor: [1.0, 1.0, 1.0], 
            edgeColor:  [0.8, 0.4, 1.0], 
            glowColor: [0.4, 0.0, 0.6],
            glowStrength: 50.0
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
        this.composer = null;

        this.logger.log('Controller initialization', {
            conditions: ['init'],
            functionName: 'constructor',
            customData: {
                this: this,
                options: options
            }
        });
    }

    /**
     * @public
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        this.logger.log('Scene initialization', {
            conditions: ['init'],
            functionName: 'setupScene'
        });
        
        this._createGalaxyCore();
        await this._galaxyPlane();
        this._setupPostProcessing();
        // this.setupLights();
    }

    /**
     * @public
     * @description Updates the scene (animation, rendering)
     * @returns {Promise<void>}
     */
    update() {
        if (!this.composer) return;

        const time = performance.now() * 0.0001;

        this._updateGalaxyCorePulse(time);
        this._updateGalaxyPlanePulse(time);
        this._updateCameraOrbit(time);
        // super.update();
        this.composer.render();
        return;
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
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                opacity: { value: shader.opacity },
                coreColor: { value: new THREE.Vector3(...shader.coreColor) },
                edgeColor: { value: new THREE.Vector3(...shader.edgeColor) },
                glowColor: { value: new THREE.Vector3(...shader.glowColor), opacity: 0.5 },
                glowStrength: { value: shader.glowStrength }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.galaxyCore = new THREE.Mesh(coreGeometry, coreMaterial);
        this.galaxyCore.rotation.x = -Math.PI / 2;
        this.scene.add(this.galaxyCore);
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
     * @description Sets up the post-processing effects
     * @returns {Promise<void>}
     * @protected
     */
    _setupPostProcessing() {
        if (!this.renderer) { return; }

        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.cameraController.camera);
        this.composer.addPass(renderPass);
    }

    /**
     * @description Updates the galaxy core pulse
     * @param {number} time - The time
     * @protected
     */
    _updateGalaxyCorePulse(time){
        const { pulse, pulseFreq, scale } = this.options.core;
        

        if (this.galaxyCore) {
            const minScale = scale.min;
            const maxScale = scale.max;
            this.galaxyCore.material.uniforms.time.value = time;
            let corePulse = 1 + Math.sin(time * pulseFreq) * pulse;
            corePulse = Math.max(minScale, Math.min(corePulse, maxScale)); 
            this.galaxyCore.scale.set(corePulse, corePulse, corePulse);
        }
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
        const mobile = isMobile();
        const offsetX = mobile ? 0 : -4;
        const baseRadius = mobile ? 20 : 15;
        const zoomPrimary = Math.sin(time * (this.options.camera?.zoomPrimaryFreq ?? 0.3)) * 2;
        const zoomSecondary = Math.sin(time * (this.options.camera?.zoomSecondaryFreq ?? 0.1)) * 1;
        const zoomMicro = Math.sin(time * (this.options.camera?.zoomMicroFreq ?? 0.8)) * 0.5;
    
        const currentRadius = baseRadius + zoomPrimary + zoomSecondary + zoomMicro;
        const orbitSpeed = this.options.camera?.orbitSpeed ?? (mobile ? 0.15 : 0.2);
        const cameraAngle = -time * orbitSpeed;
        this.cameraController.setPosition({
            x: offsetX + Math.sin(cameraAngle) * currentRadius,
            y: (mobile ? -15 : 5) + Math.sin(time * 0.4) * 0.5,
            z: Math.cos(cameraAngle) * currentRadius
        });
        this.cameraController.setLookAt({ x: offsetX, y: 0, z: 0 });
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
        
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
            message += 'Composer disposed\n';
        }

        super.cleanup(message);
    }
}

