import { createLogger } from '../utils/logger';

/**
 * @description Base class for setting up and managing 3D scenes in sections
 * @extends {BaseSetup}
 * @param {string} containerId - ID of the container element
 * @param {number} zIndex - Z-index of the section
 * @returns {BaseSetup}
 */
export class SectionObserver {
    constructor(containerId) {
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.container = this._getContainer(containerId);

        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;
    
        this.resizeTimeout = null;
        this.observer = null;

        this.init();
    }

    /**
     * @description Initialize the base setup
     * @returns {void}
     */
    init() {
        this.logger.log({
            functionName: '(SectionObserver) init()',
            conditions: ['init'],
            customData: {
                this: this
            }
        });
        
        this._initResizeHandler();
        this._initVisibilityObserver();
    }

    /**
     * @description Get the container element
     * @param {string} containerId - ID of the container element
     * @returns {HTMLElement}
     */
    _getContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id ${containerId} not found`);
        }
        return container;
    }

    /**
     * @description Initialize resize handler to manage window resize events
     * @returns {void}
     */
    _initResizeHandler() {
        this.logger.log({
            functionName: '(SectionObserver) _initResizeHandler()',
            conditions: ['init'],
        });

        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                if (this.isVisible) {
                    this.onResize();
                    setTimeout(() => {
                        if (!this.isResizing) {
                            this.logger.log({
                                conditions: ['resize'],
                                functionName: '(SectionObserver) _initResizeHandler()'
                            });
                        }
                    }, 200);
                }
            }, 300);
        });
    }

    /**
     * @description Initialize visibility observer to handle element visibility changes
     * @returns {void}
     */
    _initVisibilityObserver() {
        this.logger.log({
            functionName: '(SectionObserver) _initVisibilityObserver()',
            conditions: ['init'],
        });

        this.observer = new IntersectionObserver(async (entries) => {
            entries.forEach(async (entry) => {
                this.isVisible = entry.isIntersecting;
                
                if (!this.isVisible) {
                    this.cleanup();
                } else {
                    if (!this.initialized) {
                        await this._initSection();
                    }
                    if (!this.isResizing) {
                        this.update();
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);
    }

    /**
     * @description initialize section with 3d objects
     * @returns {Promise<void>}
     */
    async _initSection() {
        this.logger.log({
            functionName: '(SectionObserver) _initSection()',
            conditions: ['init'],
        });
        
        if (this.initialized) return;
        await this.setupControllers();
        
        this.initialized = true;
    }

    /**
     * @description setup controllers
     * @returns {Promise<void>}
     */
    async setupControllers() {
        throw new Error('setupScene must be implemented by subclass');
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
     * @param {string} logMessage - Message to log
     * @returns {void}
     */
    cleanup(logMessage) {
        if (!logMessage) {
            logMessage = `starting cleanup in ${this.constructor.name}\n`;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
            logMessage += `ResizeTimeout disposed: ${this.resizeTimeout}\n`;
        }

        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;

        logMessage += 
            `isResizing ${this.isResizing}\n` + 
            `isVisible ${this.isVisible}\n` + 
            `initialized ${this.initialized}\n`;

        this.logger.log({
            message: logMessage,
            functionName: '(SectionObserver) cleanup',
            conditions: ['cleanup'],
        });
    }
} 