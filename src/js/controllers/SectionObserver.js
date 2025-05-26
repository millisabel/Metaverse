import { createLogger } from '../utils/logger';

/**
 * @description SectionObserver class
 * @param {string} containerId - The ID of the container element
 * @returns {SectionObserver}
 */
export class SectionObserver {
    constructor(containerId) {
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);
        this.logMessage += `${this.constructor.name} (SectionObserver): constructor()\n`;

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

        this.logMessage = `${this.constructor.name} (SectionObserver): init()\n` +
        `----------------------------------------------------------\n`;
        
        this._initResizeHandler();
        this._initVisibilityObserver();

        this.logMessage += `${this.constructor.name} (SectionObserver): init(): ${this.constructor.name} success \n `;
    }

    /**
     * @description Initialize resize handler to manage window resize events
     * @returns {void}
     */
    _initResizeHandler() {
        this.logMessage += `${this.constructor.name} (SectionObserver): _initResizeHandler()\n`;

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

        this.logMessage += `${this.constructor.name} (SectionObserver): _initResizeHandler()  success\n`;
    }

    /**
     * @description Initialize visibility observer to handle element visibility changes
     * @returns {void}
     */
    _initVisibilityObserver() {
        this.logMessage += `${this.constructor.name} (SectionObserver): _initVisibilityObserver()\n`;

        this.observer = new IntersectionObserver(async (entries) => {
            entries.forEach(async (entry) => {
                this.isVisible = entry.isIntersecting;

                if (!this.isVisible) {
                    this.logMessage += 
                    `----------------------------------------------------------\n` + 
                    `isVisible: ${this.isVisible}\n` +
                    `----------------------------------------------------------\n`;

                    this.cleanup();

                } else {
                    if (!this.initialized) {
                        this.logMessage += 
                        `----------------------------------------------------------\n` + 
                        `isVisible: ${this.isVisible}\n` +
                        `----------------------------------------------------------\n` + 
                        `initialized: ${this.initialized}\n` +
                        `----------------------------------------------------------\n`;

                        await this.initSection();
                    }
                    if (!this.isResizing) {
                        this.logMessage += 
                        `----------------------------------------------------------\n` + 
                        `isResizing: ${this.isResizing}\n` +
                        `----------------------------------------------------------\n`;

                        this.update();
                    }
                }

                this.logger.log({
                    message: this.logMessage,
                    functionName: '(SectionObserver) _initVisibilityObserver()',
                });

                this.logMessage  =  '';
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);

        this.logMessage += 
        `${this.constructor.name} (SectionObserver): _initVisibilityObserver() observer: ${this.observer}\n` +
        `${this.constructor.name} (SectionObserver): _initVisibilityObserver() success\n ` +
        `----------------------------------------------------------\n`;

        this.logger.log({
            message: this.logMessage,
            functionName: '(SectionObserver) _initVisibilityObserver()',
            customData: {
                this: this,
            },
        });
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
    cleanup() {
        this.logMessage += `----------------------------------------------------------\n` +
            `Starting cleanup in ${this.constructor.name} (SectionObserver)\n` +
            `----------------------------------------------------------\n`;

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;

        this.logMessage += 
            `ResizeTimeout: ${this.resizeTimeout}\n` + 
            `isResizing: ${this.isResizing}\n` + 
            `isVisible: ${this.isVisible}\n` + 
            `initialized: ${this.initialized}\n` +
             `${this.constructor.name} cleanup() success (SectionObserver)\n`;
    }
} 