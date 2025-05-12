import {createLogger} from "../utils/logger";
import * as THREE from 'three';
import {createCanvas, updateRendererSize} from "../utilsThreeD/canvasUtils";
import { CameraController } from './cameraController';
import { rendererManager } from './rendererManager';
 
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
    constructor(container, options = {}) {
        this.name = `(AnimationController) ⬅ ${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.container = container;
        if (!this.container.id) {
            this.container.id = `threejs-container-${crypto.randomUUID()}`;
        }

        this.isVisible = false;
        this.isInitialized = false;
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;
        this.isResizing = false;
        this.isContextLost = false;
        this.cameraController = null;
        this.renderer = null;

        this.options = {
            containerName: options.containerName,
            zIndex: options.zIndex,
            camera: options.camera,
            ...options
        };

        this.logger.log('AnimationController initialized', {
            conditions: ['init'],
            functionName: 'constructor',
            customData: {
                containerName: this.options.containerName,
                zIndex: this.options.zIndex,
                container: this.container,
            }
        });
        
        this.init();
    }

    /**
     * Initializes the controller: dependencies, visibility observer, resize handler, and WebGL context handlers.
     * @protected
     */
    init() {
        this.logger.log({
            conditions: ['init'],
            functionName: 'init'
        });

        this.initDependencies();
        this.initVisibilityObserver();
        this.initResizeHandler();
        this.initWebGLContextHandlers();
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
    
        console.log('initDependencies renderer', this.renderer );
        console.log('initDependencies renderer domElement', this.renderer.domElement );
        console.log('initDependencies renderer domElement parentNode', this.renderer.domElement.parentNode );
        console.log('initDependencies renderer domElement parentNode', this.container );
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

                    console.log('initVisibilityObserver isVisible', this.isVisible );

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
    initScene() {
        this.logger.log('Initializing scene', {
            conditions: ['init'],
            functionName: 'initScene'
        });

        if (this.isInitialized) return;

        if (!this.renderer) {
            console.log('initScene renderer', this.renderer );
            this.initDependencies(); 
        }

        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode !== this.container) {
            console.log('initScene renderer domElement', this.renderer.domElement );
            console.log('initScene renderer domElement parentNode', this.renderer.domElement.parentNode );
            console.log('initScene renderer domElement parentNode', this.container );
            this.container.appendChild(this.renderer.domElement);
        }

        this.scene = new THREE.Scene();

        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        this.renderer.setClearColor(0x000000, 0);
        updateRendererSize(this.renderer, this.container, this.camera);

        if (this.options.containerName) {
            this.container.dataset.containerName = this.options.containerName;
        }
        
        this.container.appendChild(this.renderer.domElement);
        createCanvas(this.renderer, {
            zIndex: this.options.zIndex,
            containerName: this.options.containerName,
            canvasName: this.name
        });

        this.setupScene();

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
        updateRendererSize(this.renderer, this.container, this.camera);
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
     * Clean up resources
     * Disposes of Three.js objects and removes event listeners
     * @param {THREE.WebGLRenderer} renderer - Renderer to dispose
     * @param {THREE.Scene} scene - Scene to dispose
     * @public
     */
    cleanup() {
        this.logger.log({
            conditions: ['cleanup'],
            functionName: 'cleanup'
        });

        if (this.renderer) {
            console.log('Renderer disposed');   
            console.log(this.renderer);   
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
            this.logger.log(`Renderer disposed and canvas removed`);
        }

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
            this.logger.log(`Scene disposed`);
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.logger.log(`Animation stopped`);
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
            this.logger.log(`Resize timeout cleared`);
        }

        if (this.cameraController) {
            this.cameraController.cleanup();
            this.cameraController = null;
            this.logger.log(`Camera controller cleaned up`);
        }

        this.isInitialized = false;
        this.isVisible = false;
        this.logger.log(`Cleanup completed`);

        rendererManager.removeRenderer(this.container.id);
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
} 