import * as THREE from 'three';

import { CameraController } from './cameraController';
import { rendererManager } from './rendererManager';
import {createLogger} from "../utils/logger";
import {createCanvas, updateThreeRendererSize} from "../utilsThreeD/canvasUtils";
import { addLightsToScene, DEFAULT_LIGHTS } from './lightsUtils';
import { mergeOptionsWithObjectConfig } from '../utils/utils';

/**
 * @description Animation controller for 3D scenes
 * @extends {BaseSetup}
 * @param {HTMLElement} container - Container element for the 3D scene
 * @returns {AnimationController}
 */
export class AnimationController {
    /**
     * Creates an instance of AnimationController
     * @param {HTMLElement} container - Container element for the 3D scene
     * @param {Object} [options={}] - Configuration options
     * @param {Object} [options.renderer] - Three.js renderer options
     * @param {boolean} [options.renderer.antialias=true] - Enable antialiasing
     * @param {boolean} [options.renderer.alpha=true] - Enable alpha channel
     * @param {string} [options.renderer.powerPreference='high-performance'] - GPU power preference
     * @param {Object} [options.camera] - Camera configuration (passed to CameraController)
     * @param {string} [options.containerName] - Type of container for data-container-type attribute
     * @param {string} [options.zIndex='2'] - Z-index for the canvas
     */
    constructor(container, options = {}, defaultOptions = {}) {
        this.name = `(AnimationController) ⬅ ${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.container = container;
        if (!this.container.id) {
            this.container.id = `threejs-container-${crypto.randomUUID()}`;
        }

        this.options = mergeOptionsWithObjectConfig(defaultOptions, options, options.objectConfig);

        this.isVisible = false;
        this.isInitialized = false;
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;
        this.isResizing = false;
        this.isContextLost = false;
        this.cameraController = null;
        this.renderer = null;

        this.logger.log('AnimationController initialized', {
            conditions: ['init'],
            functionName: 'constructor',
            customData: {
                container: this.container,
                containerName: this.options.containerName,
                zIndex: this.options.zIndex,
                camera: this.options.camera,
                lights: this.options.lights,
                allOptions: this.options,
            }
        });
        
        this.init();
    }

    /**
     * @description Initializes the controller: dependencies, visibility observer, resize handler, and WebGL context handlers.
     * @returns {Promise<void>}
     */
    async init() {
        this.logger.log({
            conditions: ['init'],
            functionName: 'init'
        });

        this._initDependencies();
        this._initVisibilityObserver();
        this._initResizeHandler();
        this._initWebGLContextHandlers();
    }

    /**
     * @description Initializes Three.js scene, camera, and renderer.
     * @returns {Promise<void>}
     */
    async initScene() {
        this.logger.log('Initializing scene', {
            conditions: ['init'],
            functionName: 'initScene'
        });

        if (this.isInitialized) return;

        if (!this.renderer) {
            this._initDependencies(); 
        }

        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode !== this.container) {
        }

        this.scene = new THREE.Scene();

        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        this.renderer.setClearColor(0x000000, 0);
        updateThreeRendererSize(this.renderer, this.container, this.camera);

        if (this.options.containerName) {
            this.container.dataset.containerName = this.options.containerName;
        }
        
        this.container.appendChild(this.renderer.domElement);
        
        createCanvas(this.renderer, {
            zIndex: this.options.zIndex,
            containerName: this.options.containerName,
            canvasName: this.name
        });

        await this.setupScene();

        this.isInitialized = true;

        this.logger.log({
            type: 'success',
            conditions: ['scene-initialized'],
            functionName: 'initScene'
        });
    }

    /**
     * @private
     * @description Initializes dependencies
     * @returns {void}
     */
    _initDependencies() {
        this.logger.log('Initializing dependencies', {
            conditions: ['init'],
            functionName: '_initDependencies'
        });

        this.cameraController = new CameraController(this.options.camera);
        this.renderer = rendererManager.getRenderer(this.container.id, this.options.renderer);
    }

    /**
     * @private
     * @description Initializes visibility observer
     * @returns {void}
     */
    _initVisibilityObserver() {
        this.logger.log('Initializing visibility observer', {
            conditions: ['init'],
            functionName: '_initVisibilityObserver'
        });

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.logger.log('Object is visible', {
                        conditions: ['visible'],
                        functionName: '_initVisibilityObserver'
                    });

                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.isVisible = false;
                    this.logger.log('Object is not visible', {
                        conditions: ['hidden'],
                        functionName: 'initVisibilityObserver'
                    });
                    this.stopAnimation();
                    this.cleanup();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);
    }

    /**
     * @private
     * @description Initializes resize handler
     * @returns {void}
     */
    _initResizeHandler() {
        this.logger.log('Initializing resize handler', {
            conditions: ['init'],
            functionName: '_initResizeHandler'
        });

        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.logger.log({
                    conditions: ['resize-started'],
                    functionName: '_initResizeHandler'
                });
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                this.logger.log({
                    conditions: ['resize-completed'],
                    functionName: '_initResizeHandler'
                });
                if (this.isVisible) {
                    this.onResize();
                    setTimeout(() => {
                        if (!this.isResizing) {
                            this.animate();
                        }
                    }, 200);
                }
            }, 300);
        });
    }

    /**
     * @private
     * @description Initializes WebGL context handlers
     * @returns {void}
     */
    _initWebGLContextHandlers() {
        this.logger.log('Initializing WebGL context handlers', {
            conditions: ['init'],
            functionName: '_initWebGLContextHandlers'
        });

        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            rendererManager.disposeAll();
            this.isContextLost = true;
            this.logger.log('WebGL context lost! Attempting to recover...');
            console.log('WebGL context lost! Attempting to recover...');
        });

        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            this.isContextLost = false;
            this.initScene();
            this.animate();
        });
    }

    /**
     * @description Handles window resize: updates renderer and camera dimensions.
     * @returns {void}
     */
    onResize() {
        this.cameraController.onResize(this.container);
        updateThreeRendererSize(this.renderer, this.container, this.camera);
    }

    /**
     * @description Check if animation can proceed
     * @returns {boolean} Whether animation should continue
     */
    canAnimate() {
        if (!this.isVisible) {
            this.logger.log('Object is hidden',  {
                conditions: ['hidden'],
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }

        if (this.isResizing) {
            this.logger.log('Object is resizing', {
                functionName: 'AnimationController: canAnimate',
                trackType: ['scroll'],
            });
            return false;
        }

        if (!this.isInitialized) {
            this.logger.log('Object is not initialized', {
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }
        
        if (!this.scene || !this.camera || !this.renderer) {
            this.logger.log('Scene, camera, or renderer missing', {
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }

        return true;
    }

    /**
     * @description Animation loop
     * @returns {void}
     */
    animate() {
        if (!this.canAnimate()) {
            if (this.animationFrameId) {
                this.stopAnimation();
            }
            return;
        }

        this.update();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    /**
     * @description Stop animation loop
     * @returns {void}
     */
    stopAnimation() {
        if (this.animationFrameId) {
            const id = this.animationFrameId;
            this.logger.log(`Stopping animation - frame ID: ${this.animationFrameId}`, {
                conditions: ['paused'],
                functionName: 'AnimationController: stopAnimation'
            });
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.logger.log(`Animation frame ID ${id} is ${this.animationFrameId}`, {
                conditions: ['animation-frame-cleanup'],
                functionName: 'AnimationController: stopAnimation'
            });
        }
    }

    /**
     * @description Logs animation state
     * @param {string} state - State of the animation
     * @returns {void}
     */
    logAnimationState(state) {
        this.logger.log(`Animation ${state}`, {
            conditions: [state],
            functionName: 'update'
        });
    }

    /**
     * @description Gets container size
     * @returns {Object} Container size
     */
    getContainerSize() {
        if (!this.container) return { width: 0, height: 0 };
        return {
            width: this.container.clientWidth,
            height: this.container.clientHeight
        };
    }

    /**
     * @description Updates renderer size
     * @returns {void}
     */
    updateRendererSize() {
        const { width, height } = this._getContainerSize();
        if (!this.camera || !this.renderer || width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        if (this.composer) this.composer.setSize(width, height);
    }

    /**
     * @description Renders scene
     * @returns {void}
     */
    renderScene() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * @description Updates camera
     * @returns {void}
     */
    updateCamera() {
        if (this.cameraController && typeof this.cameraController.updateRotation === 'function') {
            this.cameraController.updateRotation();
        }
    }

    /**
     * @description Sets up lights
     * @param {Object} [options={}] - Options for lights
     * @returns {void}
     */
    setupLights(options = {}) {
        if (!this.scene) return;
        const config = mergeOptionsWithObjectConfig(DEFAULT_LIGHTS, options);
        addLightsToScene(this.scene, config);
    }

    /**
     * @description Update method for animation frame
     * @returns {void}
     */
    update() {
        // Base method update, which will be overridden in child classes
        throw new Error('update must be implemented by subclass');
    }

    /**
     * @description Clean up resources
     * @param {THREE.WebGLRenderer} renderer - Renderer to dispose
     * @param {THREE.Scene} scene - Scene to dispose
     * @returns {void}
     */
    cleanup(message) {
        let logMessage = message || '';
        logMessage += 'starting cleanup in AnimationController\n';

        if (this.renderer) {  
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }
        logMessage += `Renderer: ${this.renderer}\n`;

        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.scene = null;
        }
        logMessage += `Scene: ${this.scene}\n`;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        logMessage += `Animation stopped: animationFrameId: ${this.animationFrameId}\n`;

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        logMessage += `Resize timeout: ${this.resizeTimeout}\n`;

        if (this.cameraController) {
            this.cameraController.cleanup();
            this.cameraController = null;
        }
        logMessage += `Camera controller: ${this.cameraController}\n`;
        logMessage += `Completed cleanup in AnimationController\n`;

        this.isInitialized = false;
        this.isVisible = false;
        this.logger.log({
            message: logMessage,
            conditions: ['cleanup'],
            functionName: 'cleanup'
        });

        rendererManager.removeRenderer(this.container.id);

        // if (process.env.NODE_ENV === 'development') {
        //     assertNoDeadCanvas();
        //   }
    }
}
