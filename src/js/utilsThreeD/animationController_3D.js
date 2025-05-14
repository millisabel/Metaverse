import * as THREE from 'three';

import { CameraController } from './cameraController';
import { rendererManager } from './rendererManager';
import {createLogger} from "../utils/logger";
import {createCanvas, updateThreeRendererSize, assertNoDeadCanvas} from "../utilsThreeD/canvasUtils";
import { deepClone } from './utilsThreeD';
import { addLightsToScene, DEFAULT_LIGHTS } from './lightsUtils';


/**
 * Basic controller for managing Three.js animations and scene lifecycle
 * Provides functionality for:
 * - Scene initialization and cleanup
 * - Visibility tracking
 * - Animation loop management
 * - Resize handling
 * - Camera control
 * 
 * This class serves as a base for specific 3D components like Stars, Glow, etc.
 * 
 * @class AnimationController
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

        const { objectConfig, ...restOptions } = options;
        const mergedOptions = {
        ...restOptions,
        ...(objectConfig || {})
        };
        this.options = AnimationController.mergeOptions(defaultOptions, mergedOptions);

        console.log(`${this.name}`, this.options);

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
     * Initializes the controller: dependencies, visibility observer, resize handler, and WebGL context handlers.
     * @protected
     */
    async init() {
        this.logger.log({
            conditions: ['init'],
            functionName: 'init'
        });

        this.initDependencies();
        this.initVisibilityObserver();
        this.initResizeHandler();
        this.initWebGLContextHandlers();
    }

    static mergeOptions(defaults, options) {
        const merged = deepClone(defaults);
        function assign(target, source) {
            for (const key in source) {
                if (
                    source[key] &&
                    typeof source[key] === 'object' &&
                    !Array.isArray(source[key])
                ) {
                    if (!target[key]) target[key] = {};
                    assign(target[key], source[key]);
                } else {
                    target[key] = deepClone(source[key]);
                }
            }
        }
        assign(merged, options);
        return merged;
    }

    /**
     * Initializes camera controller and renderer.
     * @protected
     */
    initDependencies() {
        this.logger.log('Initializing dependencies', {
            conditions: ['init'],
            functionName: 'initDependencies'
        });

        this.cameraController = new CameraController(this.options.camera);
        this.renderer = rendererManager.getRenderer(this.container.id, this.options.renderer);
    }

    /**
     * Sets up IntersectionObserver to track container visibility.
     * @protected
     */
    initVisibilityObserver() {
        this.logger.log('Initializing visibility observer', {
            conditions: ['init'],
            functionName: 'initVisibilityObserver'
        });

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.logger.log('Object is visible', {
                        conditions: ['visible'],
                        functionName: 'initVisibilityObserver'
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
     * Sets up window resize handler with debounce logic.
     * @protected
     */
    initResizeHandler() {
        this.logger.log('Initializing resize handler', {
            conditions: ['init'],
            functionName: 'initResizeHandler'
        });

        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.logger.log({
                    conditions: ['resize-started'],
                    functionName: 'initResizeHandler'
                });
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                this.logger.log({
                    conditions: ['resize-completed'],
                    functionName: 'initResizeHandler'
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
     * Sets up handlers for WebGL context loss and restoration.
     * @protected
     */
    initWebGLContextHandlers() {
        this.logger.log('Initializing WebGL context handlers', {
            conditions: ['init'],
            functionName: 'initWebGLContextHandlers'
        });

        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            rendererManager.disposeAll();
            this.isContextLost = true;
            this.logger.error('WebGL context lost! Attempting to recover...');
        });

        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            this.isContextLost = false;
            this.initScene();
            this.animate();
        });
    }

    /**
     * Initializes Three.js scene, camera, and renderer.
     * @protected
     */
    async initScene() {
        this.logger.log('Initializing scene', {
            conditions: ['init'],
            functionName: 'initScene'
        });

        if (this.isInitialized) return;

        if (!this.renderer) {
            this.initDependencies(); 
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
     * Handles window resize: updates renderer and camera dimensions.
     * @protected
     */
    onResize() {
        this.cameraController.onResize(this.container);
        updateThreeRendererSize(this.renderer, this.container, this.camera);
    }

    /**
     * Check if animation can proceed
     * @returns {boolean} Whether animation should continue
     * @protected
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
     * Animation loop
     * Calls update method and requests next frame
     * @protected
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
     * Stop animation loop
     * Cancels animation frame and logs cleanup
     * @protected
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
     * Log animation state
     * @param {string} state - State of the animation
     * @protected
     */
    logAnimationState(state) {
        this.logger.log(`Animation ${state}`, {
            conditions: [state],
            functionName: 'update'
        });
    }

    /**
     * Get container size
     * @returns {Object} Container size
     * @protected
     */
    getContainerSize() {
        if (!this.container) return { width: 0, height: 0 };
        return {
            width: this.container.clientWidth,
            height: this.container.clientHeight
        };
    }

    /**
     * Update renderer size
     * @description Updates the renderer size and the camera aspect ratio
     * @param {number} width - Width of the renderer
     * @param {number} height - Height of the renderer
     * @protected
     */
    updateRendererSize() {
        const { width, height } = this.getContainerSize();
        if (!this.camera || !this.renderer || width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        if (this.composer) this.composer.setSize(width, height);
    }

    /**
     * Render scene
     * @protected
     */
    renderScene() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Update camera
     * @protected
     */
    updateCamera() {
        if (this.cameraController && typeof this.cameraController.updateRotation === 'function') {
            this.cameraController.updateRotation();
        }
    }

    /**
     * Setup lights
     * @param {Object} options - Light parameters (optional, merged with defaults)
     * @param {number} options.ambientColor - Ambient light color
     * @param {number} options.ambientIntensity - Ambient light intensity
     * @param {number} options.pointColor - Point light color
     * @param {number} options.pointIntensity - Point light intensity
     * @param {Object} options.pointPosition - Point light position {x, y, z}
     */
    setupLights(options = {}) {
        if (!this.scene) return;
        const config = AnimationController.mergeOptions(DEFAULT_LIGHTS, options);
        addLightsToScene(this.scene, config);
    }

    /**
     * Update method for animation frame
     * To be implemented by subclasses
     * @abstract
     * @protected
     */
    update() {
        // Base method update, which will be overridden in child classes
        throw new Error('update must be implemented by subclass');
    }

    /**
     * Clean up resources
     * Disposes of Three.js objects and removes event listeners
     * @param {THREE.WebGLRenderer} renderer - Renderer to dispose
     * @param {THREE.Scene} scene - Scene to dispose
     * @public
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

        if (process.env.NODE_ENV === 'development') {
            assertNoDeadCanvas();
          }
    }
}
