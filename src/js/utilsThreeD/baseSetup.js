import { createLogger } from '../utils/logger';
import { ThreeDContainerManager } from './ThreeDContainerManager';

/**
 * Base class for setting up and managing 3D scenes in sections
 * Provides functionality for:
 * - Container management
 * - Scene initialization and cleanup
 * - Visibility handling
 * - Animation control
 * - Resize handling
 * 
 * @class BaseSetup
 */
export class BaseSetup {
    /**
     * Creates an instance of BaseSetup
     * @param {string} containerId - ID of the container element
     */
    constructor(containerId) {
        this.name = `(BaseSetup) ⬅ ${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.container = document.getElementById(containerId);
        
        // State
        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;
        
        // Animation
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;

        this.init();
    }

    init() {
        this.logger.log({
            functionName: 'init',
            conditions: ['init'],
            customData: {
                name: this.name,
                this: this
            }
        });
        
        this.initVisibilityObserver();
        this.initResizeHandler();
    }

    /**
     * Creates a 3D container with specified type and z-index
     * @returns {HTMLElement} Created container
     */
    createContainer(name, zIndex) {

        this.logger.log({
            functionName: 'createContainer',
            conditions: ['creating-container'],
            customData: {
                name: this.name,
                zIndex: zIndex,
            }
        });

        const manager = new ThreeDContainerManager(this.container, { 
            name: name,
            zIndex: zIndex
        });
        const container = manager.create();
        
        if (name) {
            container.dataset.containerType = name;
        }
        
        return container;
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

                            this.logger.log({
                                conditions: ['resize'],
                                functionName: 'initResizeHandler'
                            });
                        }
                    }, 200);
                }
            }, 300);
        });
    }

    /**
     * Initialize Three.js scene with camera
     * @private
     */
    initScene() {
        if (this.initialized) return;

        this.setupScene();
        
        this.initialized = true;

        this.logger.log({
            type: 'success',
            conditions: ['scene-initialized'],
            functionName: 'initScene'
        });
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

        this.initialized = false;
        this.isVisible = false;
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