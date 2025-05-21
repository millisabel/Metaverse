import { Universal3DController } from './Universal3DController';

import { createLogger } from '../utils/logger';

/**
 * @description Observer3DController extends Universal3DController
 * @extends {Universal3DController}
 */
export class Observer3DController extends Universal3DController {
    constructor(container, customOptions = {}, defaultOptions = {}) {
        super(container, customOptions, defaultOptions);
        
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.isVisible = false;
        this.isInitialized = false;
        this.isResizing = false;
        this.resizeTimeout = null;
        this.observer = null;
        this.isContextLost = false;
    }

    /**
     * @description Initializes the controller
     * @returns {Promise<void>}
     */
    async init() {
        this.logger.log({
            conditions: ['init'],
            functionName: '(Observer3DController) constructor',
            customData: {
                container: this.container,
                options: this.options,
            }
        });
        await super.init();
        this._initVisibilityObserver();
    }

    /**
     * @description Sets up the scene
     * @returns {Promise<void>}
     */
    async setupScene() {
        super.setupScene();
    }

    /**
     * @description Handles the resize event
     * @returns {void}
     */ 
    onResize() {
        super.onResize();
    }

    /**
     * @description Updates the scene
     * @returns {void}
     */
    update() {
        super.update();
    }

    /**
     * @description Cleans up the controller
     * @returns {void}
     */
    cleanup(message) {
        let logMessage = message || '';
        logMessage += 'starting cleanup in Observer3DController\n';

        this.isVisible = false;
        this.isInitialized = false;
        this.isResizing = false;
        this.resizeTimeout = null;
        this.isContextLost = false;

        logMessage += `isVisible: ${this.isVisible}\n` +
                       `isInitialized: ${this.isInitialized}\n` +
                       `isResizing: ${this.isResizing}\n` +
                       `resizeTimeout: ${this.resizeTimeout}\n` +
                       `isContextLost: ${this.isContextLost}\n`;

        super.cleanup(logMessage);
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
            entries.forEach(async (entry) => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.logger.log('Object is visible, calling initScene', {
                        conditions: ['visible'],
                        functionName: '_initVisibilityObserver',
                        customData: { container: this.container, id: this.container.id }
                    });

                    if (!this.isInitialized) {
                        await this.initScene();
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
}