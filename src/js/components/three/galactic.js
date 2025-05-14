import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { createLogger } from "../../utils/logger";
import { isMobile } from '../../utils/utils';
import { addDefaultLights } from '../../utilsThreeD/utilsThreeD';

import { AnimationController } from '../../utilsThreeD/animationController_3D';

import vertexShader from '../../shaders/galacticCore.vert';
import fragmentShader from '../../shaders/galacticCore.frag';

const galacticTexture = './assets/images/galaxy-texture.png';

/**
 * CONFIG_LIGHTS
 * @description The configuration for the lights
 * @type {Object}
 * @property {number} ambientColor - The color of the ambient light
 * @property {number} ambientIntensity - The intensity of the ambient light
 */

const CONFIG_LIGHTS = {
    ambientColor: 0x9933ff,
    ambientIntensity: 0.5,
    pointColor: 0xcc66ff,
    pointIntensity: 2,
    pointPosition: { x: isMobile() ? 0 : -4, y: 2, z: 0 }
}

/**
 * DEFAULT_OPTIONS
 * @description The default options for the galactic cloud
 * @type {Object}
 * @property {number} core.size - The size of the core
 * @property {number} core.segments - The segments of the core
 */

const defaultOptions = {
    core: {
        size: 2,
        segments: 2,
        textureUrl: null,
    },
    plane: {
        size: isMobile() ? 4 : 8,
        opacity: 1,
        transparent: false,
    },
    animation: {
        baseScale: 1.0,
        minCoreScale: 0.5,
        corePulse: 2,
        pulsePrimary: { freq: 0.5, amp: 0.15 },
        pulseSecondary: { freq: 0.2, amp: 0.1 },
        pulseMicro: { freq: 1.5, amp: 0.05 },
    },
    bloom: {
        strength: 5, 
        radius: 2, 
        threshold: 0.2, 
    },
};

/**
 * GALACTIC_CLOUD
 * @description The galactic cloud
 * @type {Object}
 * @property {Object} core - The core of the galactic cloud
 * @property {Object} plane - The plane of the galactic cloud
 */
export class GalacticCloud extends AnimationController {
    constructor(container, options = {}) {
        super(container, {
            containerName: options.containerName,
            zIndex: options.zIndex,
            camera: options.camera,
        });

        this._isDestroyed = false;
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.galaxyCore = null;
        this.galaxyPlane = null;
        this.composer = null;

        this.galaxOptions = AnimationController.mergeOptions(defaultOptions, options);

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
     * Setup scene
     * @description Sets up the scene with the galaxy core, plane, and post-processing effects
     * @returns {Promise<void>}
     * @protected
     */
    async setupScene() {
        this._isDestroyed = false;
        this.logger.log('Scene initialization', {
            conditions: ['init'],
            functionName: 'setupScene'
        });
        
        if (this._isDestroyed) return;

        this._createGalaxyCore();
        await this._galaxyPlane();
        this._setupPostProcessing();

        addDefaultLights(this.scene, CONFIG_LIGHTS);
    }

    /**
     * Create galaxy core
     * @description Creates the galaxy core
     * @returns {Promise<void>}
     * @protected
     */     
    _createGalaxyCore() {

        const coreGeometry = new THREE.PlaneGeometry(
            this.galaxOptions.core.size, 
            this.galaxOptions.core.size, 
            this.galaxOptions.core.segments, 
            this.galaxOptions.core.segments,
        );
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
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
     * Create galaxy plane
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

        const planeSize = this.galaxOptions.plane.size; 

        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: galaxyTexture,
            transparent: this.galaxOptions.plane.transparent,
            opacity: this.galaxOptions.plane.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const galaxyPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        galaxyPlane.rotation.x = Math.PI / 2;
        this.scene.add(galaxyPlane);
        this.galaxyPlane = galaxyPlane;
    }

    /**
     * Setup post-processing
     * @description Sets up the post-processing effects
     * @returns {Promise<void>}
     * @protected
     */
    _setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.galaxOptions.bloom.strength,
            this.galaxOptions.bloom.radius,
            this.galaxOptions.bloom.threshold,
        );
        
        bloomPass.threshold = this.galaxOptions.bloom.threshold;
        bloomPass.strength = this.galaxOptions.bloom.strength;
        bloomPass.radius = this.galaxOptions.bloom.radius;
        
        this.composer.addPass(bloomPass);
    }

    /**
     * Get pulse factor
     * @description Gets the pulse factor
     * @param {number} time - The time
     * @returns {number}
     * @protected
     */
    _getPulseFactor(time) {
        const { pulsePrimary, pulseSecondary, pulseMicro } = this.galaxOptions.animation;
        const baseScale = this.galaxOptions.animation.baseScale;
    
        const primaryWave = Math.sin(time * pulsePrimary.freq) * pulsePrimary.amp;
        const secondaryWave = Math.sin(time * pulseSecondary.freq) * pulseSecondary.amp;
        const microWave = Math.sin(time * pulseMicro.freq) * pulseMicro.amp;
    
        return baseScale + primaryWave + secondaryWave + microWave;
    }

    /**
     * Update galaxy core pulse
     * @description Updates the galaxy core pulse
     * @param {number} time - The time
     * @protected
     */
    _updateGalaxyCorePulse(time){
        const animationCore = this.galaxOptions.animation.corePulse;

        if (this.galaxyCore) {
            const minScale = this.galaxOptions.animation.minCoreScale;

            this.galaxyCore.material.uniforms.time.value = time;

            let corePulse = 1 + Math.sin(time * 2.0) * animationCore;

            corePulse = Math.max(corePulse, minScale); 

            this.galaxyCore.scale.set(corePulse, corePulse, corePulse);
        }
    }

    /**
     * Update galaxy plane pulse
     * @description Updates the galaxy plane pulse
     * @param {number} time - The time
     * @protected
     */
    _updateGalaxyPlanePulse(time) {
        if (!this.galaxyPlane) return;
        const pulseFactor = this._getPulseFactor(time);
        this.galaxyPlane.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }

    /**
     * Update camera orbit
     * @description Updates the camera orbit
     * @param {number} time - The time
     * @protected
     */
    _updateCameraOrbit(time) {
        const mobile = isMobile();
        const offsetX = mobile ? 0 : -4;
        const baseRadius = mobile ? 20 : 15;
        const zoomPrimary = Math.sin(time * 0.3) * 2;
        const zoomSecondary = Math.sin(time * 0.1) * 1;
        const zoomMicro = Math.sin(time * 0.8) * 0.5;
    
        const currentRadius = baseRadius + zoomPrimary + zoomSecondary + zoomMicro;
        const cameraAngle = -time * (mobile ? 0.15 : 0.2);
    
        this.cameraController.setPosition({
            x: offsetX + Math.sin(cameraAngle) * currentRadius,
            y: (mobile ? -15 : 5) + Math.sin(time * 0.4) * 0.5,
            z: Math.cos(cameraAngle) * currentRadius
        });
        this.cameraController.setLookAt({ x: offsetX, y: 0, z: 0 });
    }

    /**
     * Update
     * @description Updates the scene
     * @returns {Promise<void>}
     * @protected
     */
    update() {
        if (!this.isVisible || !this.scene || !this.camera || !this.composer) return;

        const time = performance.now() * 0.0001;

        this._updateGalaxyCorePulse(time);
        this._updateGalaxyPlanePulse(time);
        this._updateCameraOrbit(time);
        
        this.composer.render();
    }

    /**
     * On resize
     * @description On resize
     * @returns {Promise<void>}
     * @protected
     */
    onResize() {
        if (!this.renderer || !this.camera) return;

        super.onResize();
        this._updateCameraOrbit(0); 

        if (this.galaxyPlane) {
            const planeSize = this.galaxOptions.plane.size;
            this.galaxyPlane.scale.set(planeSize/8, planeSize/8, planeSize/8);
        }

        if (this.galaxyCore) {
            this.galaxyCore.material.uniforms.resolution.value.set(this.container.clientWidth, this.container.clientHeight);
        }
    }

    /**
     * Cleanup
     * @description Cleanup
     * @returns {Promise<void>}
     * @protected
     */
    cleanup() {
        let message = `starting cleanup in ${this.constructor.name}\n`;
        this._isDestroyed = true;
        
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
            message += 'Composer disposed\n';
        }

        super.cleanup(message);
    }
}

