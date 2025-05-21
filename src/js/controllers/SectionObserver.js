import { createLogger } from '../utils/logger';
import { ThreeDContainerManager } from '../utilsThreeD/ThreeDContainerManager';

/**
 * @description Base class for setting up and managing 3D scenes in sections
 * @extends {BaseSetup}
 * @param {string} containerId - ID of the container element
 * @returns {BaseSetup}
 */
export class SectionObserver {
    /**
     * Creates an instance of BaseSetup
     * @param {string} containerId - ID of the container element
     */
    constructor(containerId, zIndex) {
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.container = document.getElementById(containerId);
        this.sectionZIndex = zIndex || 0;
        
        // State
        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;
        
        // Animation
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;

        this._createdContainers = {};
        this.init();
    }

    /**
     * @description Initialize the base setup
     * @returns {void}
     */
    init() {
        this.logger.log({
            functionName: '(BaseSetup) init',
            conditions: ['init'],
            customData: {
                name: this.name,
                this: this
            }
        });
        
        this._applyBaseContainerStyles(this.objects3D);
        this.initVisibilityObserver();
        this.initResizeHandler();
        
        this.logger.log({
            functionName: '(BaseSetup) init',
            type: 'success',
            conditions: ['init'],
            customData: {
                this: this
            }
        });
    }

    /**
     * @description Initialize visibility observer to handle element visibility changes
     * @returns {void}
     */
    initVisibilityObserver() {
        this.observer = new IntersectionObserver(async (entries) => {
            entries.forEach(async (entry) => {
                this.isVisible = entry.isIntersecting;
                
                if (this.isVisible) {
                    if (!this.initialized) {
                        await this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.stopAnimation();
                    this.cleanup();
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

        this.logger.log({
            functionName: '(BaseSetup) initVisibilityObserver',
            conditions: ['init'],
        });
    }

    /**
     * @description Initialize Three.js scene with camera
     * @returns {Promise<void>}
     */
    async initScene() {
        if (this.initialized) return;
        await this.setupScene();
        
        this.initialized = true;

        this.logger.log({
            functionName: '(BaseSetup) initScene',
            conditions: ['init'],
        });
    }

    /**
     * @description Setup the scene with additional elements
     * @returns {Promise<void>}
     */
    async setupScene() {
        throw new Error('setupScene must be implemented by subclass');
    }

    /**
     * @description Animation loop
     * @returns {void}
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
     * @description Check if animation can proceed
     * @returns {boolean} Whether animation should continue
     */
    canAnimate() {
        return this.isVisible && !this.isResizing && this.initialized;
    }

    /**
     * @description Stop animation loop
     * @returns {void}
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * @description Initialize resize handler to manage window resize events
     * @returns {void}
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
     * @description Apply base container styles
     * @returns {void}
     */
    _applyBaseContainerStyles() {
        this.container.style.position = 'relative';
        this.container.style.zIndex = this.sectionZIndex;
    }

    /**
     * @description Cleans up a specific container type
     * @param {string} type - Container type from CONTAINER_TYPES
     * @returns {void}
     */
    cleanupContainer(type) {
        const manager = new ThreeDContainerManager(this.container, { type });
        manager.cleanup();
    }

    /**
     * @description Create a 3D container with specified type and z-index
     * @param {string} name - Name of the container
     * @param {number} zIndex - Z-index of the container
     * @returns {HTMLElement} Created container
     */
    createContainer(name, zIndex) {
        if (this._createdContainers[name]) {
            return this._createdContainers[name];
        }

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
            container.dataset.containerName = name;
        }
        
        this._createdContainers[name] = container;
        return container;
    }

    /**
     * @description Handle resize event
     * @returns {void}
     */
    onResize() {
        throw new Error('onResize must be implemented by subclass');
    }

    /**
     * @description Update scene for animation frame
     * @returns {void}
     */
    update() {
        throw new Error('update must be implemented by subclass');
    }

    /**
     * @description Clean up all resources
     * @returns {void}
     */
    cleanup(logMessage) {
        if (!logMessage) {
            logMessage = `starting cleanup in ${this.constructor.name}\n`;
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            logMessage += `AnimationFrameId disposed: ${this.animationFrameId}\n`;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
            logMessage += `ResizeTimeout disposed: ${this.resizeTimeout}\n`;
        }

        this.initialized = false;
        logMessage += `Initialized ${this.initialized}\n`;
        this.isVisible = false;
        logMessage += `isVisible ${this.isVisible}\n`;
        this.isResizing = false;
        logMessage += `isResizing ${this.isResizing}\n`;
        this.animationFrameId = null;
        logMessage += `animationFrameId ${this._createdContainers}\n`;

        logMessage += `Completed cleanup in ${this.constructor.name}\n`;

        this.logger.log({
            message: logMessage,
            functionName: '(BaseSetup) cleanup',
            conditions: ['cleanup'],
            styles: {
                headerBackground: '#af274b'
            }
        });
    }
} 