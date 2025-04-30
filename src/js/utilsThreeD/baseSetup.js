import { createLogger } from '../utils/logger';
import { ThreeDContainerManager } from './ThreeDContainerManager';
import * as THREE from 'three';
import { createCanvas, updateRendererSize } from "./canvasUtils";
import { CameraController } from './cameraController';

/**
 * Base class for setting up and managing 3D scenes in sections
 * Provides functionality for:
 * - Container management
 * - Scene initialization and cleanup
 * - Visibility handling
 * - Animation control
 * - Resize handling
 * - Camera management
 * 
 * @class BaseSetup
 */
export class BaseSetup {
    /**
     * Creates an instance of BaseSetup
     * @param {string} containerId - ID of the container element
     * @param {string} name - Name of the setup for logging
     * @param {Object} options - Configuration options
     * @param {Object} [options.renderer] - Three.js renderer options
     * @param {boolean} [options.renderer.antialias=true] - Enable antialiasing
     * @param {boolean} [options.renderer.alpha=true] - Enable alpha
     * @param {string} [options.renderer.powerPreference='high-performance'] - GPU power preference
     * @param {Object} [options.camera] - Camera configuration
     * @param {Object} [options.camera.position] - Camera position {x, y, z}
     * @param {Object} [options.camera.lookAt] - Camera look at point {x, y, z}
     * @param {boolean} [options.camera.rotation] - Enable camera rotation
     * @param {Object} [options.camera.speed] - Camera rotation speed {x, y}
     */
    constructor(containerId, name, options = {}) {
        // Base initialization
        this.container = document.getElementById(containerId);
        this.name = name;
        this.logger = createLogger(this.name);
        
        // State
        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;
        
        // Animation
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;

        // Scene elements
        this.scene = null;
        this.renderer = null;
        
        // Options
        this.options = {
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            },
            ...options
        };

        // Camera
        this.cameraController = new CameraController(options.camera);
        
        // Container types and z-index (to be defined in child classes)
        this.CONTAINER_TYPES = {};
        this.Z_INDEX = {};

        this.initVisibilityObserver();
        this.initResizeHandler();
    }

    /**
     * Initialize visibility observer to handle element visibility changes
     * Uses IntersectionObserver to detect when the element enters/exits viewport
     * @private
     */
    initVisibilityObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                
                if (this.isVisible) {
                    if (!this.initialized) {
                        this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.stopAnimation();
                }

                this.logger.log({
                    conditions: this.isVisible ? ['visible'] : ['hidden'],
                    functionName: 'initVisibilityObserver'
                });
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);
    }

    /**
     * Initialize resize handler to manage window resize events
     * Includes debouncing to prevent excessive updates
     * @private
     */
    initResizeHandler() {
        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
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
     * Initialize Three.js scene with camera and renderer
     * @private
     */
    initScene() {
        if (this.initialized) return;

        this.scene = new THREE.Scene();
        
        // Initialize camera
        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer(this.options.renderer);
        updateRendererSize(this.renderer, this.container, this.camera);
        this.container.appendChild(this.renderer.domElement);
        createCanvas(this.renderer, { zIndex: '2' });

        // Setup additional scene elements
        this.setupScene();
        
        this.initialized = true;
    }

    /**
     * Creates a 3D container with specified type and z-index
     * @param {string} type - Container type from CONTAINER_TYPES
     * @param {string} zIndex - Z-index from Z_INDEX
     * @returns {HTMLElement} Created container
     */
    createContainer(type, zIndex) {
        const manager = new ThreeDContainerManager(this.container, { 
            type: type,
            zIndex: zIndex
        });
        return manager.create();
    }

    /**
     * Cleans up a specific container type
     * @param {string} type - Container type from CONTAINER_TYPES
     */
    cleanupContainer(type) {
        const manager = new ThreeDContainerManager(this.container, { type });
        manager.cleanup();
    }

    /**
     * Handle resize event for renderer and camera
     * @protected
     */
    onResize() {
        if (this.cameraController) {
            this.cameraController.onResize(this.container);
        }
        if (this.renderer && this.camera) {
            updateRendererSize(this.renderer, this.container, this.camera);
        }
    }

    /**
     * Check if animation can proceed
     * @returns {boolean} Whether animation should continue
     * @protected
     */
    canAnimate() {
        return this.isVisible && !this.isResizing && this.initialized;
    }

    /**
     * Animation loop
     * @protected
     */
    animate() {
        if (!this.canAnimate()) {
            this.stopAnimation();
            return;
        }

        this.update();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Stop animation loop
     * @protected
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Clean up all resources
     * Disposes of Three.js objects, removes event listeners, and resets state
     * @public
     */
    cleanup() {
        // Clean up renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
        }

        // Clean up scene
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

        // Clean up other resources
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        if (this.cameraController) {
            this.cameraController.cleanup();
            this.cameraController = null;
        }

        // Reset state
        this.initialized = false;
        this.isVisible = false;
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
     * Setup the scene with additional elements
     * Must be implemented by child classes
     * @abstract
     */
    setupScene() {
        throw new Error('setupScene must be implemented by subclass');
    }

    /**
     * Update scene for animation frame
     * Must be implemented by child classes
     * @abstract
     */
    update() {
        throw new Error('update must be implemented by subclass');
    }
} 