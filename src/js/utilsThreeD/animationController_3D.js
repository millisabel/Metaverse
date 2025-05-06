import {createLogger} from "../utils/logger";
import * as THREE from 'three';
import {createCanvas, updateRendererSize} from "../utilsThreeD/canvasUtils";
import { CameraController } from './cameraController';

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
     */
    constructor(container, options = {}) {
        this.container = container;
        this.isVisible = false;
        this.isInitialized = false;
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;
        this.isResizing = false;

        // Default options
        this.options = {
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            },
            ...options
        };

        this.name = 'AnimationController';
        this.logger = createLogger(this.name);

        // Initialize camera controller
        this.cameraController = new CameraController(options.camera);

        this.init();
    }

    /**
     * Initialize the controller
     * Sets up visibility observer and resize handler
     * @protected
     */
    init() {
        // Visibility observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.logger.log(`AnimationController: Object is visible`, {
                        conditions: ['visible'],
                        functionName: 'AnimationController: init'
                    });
                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.isVisible = false;
                    this.logger.log(`Object is not visible`, {
                        conditions: ['hidden'],
                        functionName: 'AnimationController: init'
                        }
                    );
                    this.stopAnimation();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);

        // Handle resize
        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.logger.log({
                    conditions: ['resize-started'],
                    functionName: 'AnimationController: init'
                });
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                this.logger.log( {
                    conditions: ['resize-completed'],
                    functionName: 'AnimationController: init'
                });
                if (this.isVisible) {
                    this.onResize();
                    // Add additional delay before starting animation
                    setTimeout(() => {
                        if (!this.isResizing) {
                            this.animate();
                        }
                    }, 200);
                }
            }, 300); // Increase the waiting time for the resize to complete
        });
    }

    /**
     * Initialize Three.js scene
     * Creates scene, camera, and renderer
     * @protected
     */
    initScene() {
        if (this.isInitialized) return;

        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'initScene'
        });

        // Create scene
        this.scene = new THREE.Scene();

        // Initialize camera
        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer(this.options.renderer);
        this.renderer.setClearColor(0x000000, 0);
        updateRendererSize(this.renderer, this.container, this.camera);
        this.container.appendChild(this.renderer.domElement);
        createCanvas(this.renderer, { zIndex: '2' });

        // Call setupScene for additional configuration
        this.setupScene();

        this.isInitialized = true;
    }

    /**
     * Setup additional scene elements
     * To be implemented by subclasses
     * @abstract
     * @protected
     */
    setupScene() {
        // To be implemented by subclasses
    }

    /**
     * Handle resize event
     * Updates renderer and camera dimensions
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
    cleanup(renderer, scene) {
        this.logger.log(`Starting cleanup`);

        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
            renderer = null;
            this.logger.log(`Renderer disposed`);
        }

        if (scene) {
            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            scene = null;
            this.logger.log(`Scene disposed`);
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            this.logger.log(`Observer disconnected`);
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
    }

    /**
     * Get current time and aspect ratio
     * @returns {Object} Object containing time, aspect ratio and mobile status
     * @protected
     */
    _getTimeAndAspect() {
        const rect = this.container.getBoundingClientRect();
        return {
            time: performance.now() * 0.0001,
            aspect: rect.width / rect.height,
            isMobile: rect.width < 768
        };
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