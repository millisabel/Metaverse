import { Object_3D_Controller } from './Object_3D_Controller';

import { createLogger } from '../utils/logger';

/**
 * @description Object_3D_Observer_Controller extends Object_3D_Controller
 * @extends {Object_3D_Controller}
 */
export class Object_3D_Observer_Controller extends Object_3D_Controller {
    constructor(container, customOptions = {}, defaultOptions = {}) {
        super(container, customOptions, defaultOptions);
        
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.isVisible = false;
        this.initialized = false;
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
        this.logMessage += `${this.constructor.name} (Object_3D_Observer_Controller): init()\n`;

        await super.init();
        this._initVisibilityObserver();

        this.logMessage = 
            `${this.constructor.name} (Object_3D_Observer_Controller): init() success\n` +
            `----------------------------------------------------------\n`;
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
    cleanup() {   
        if (!this.initialized) return;

        this.logMessage += 
            `----------------------------------------------------------\n` + 
            `starting cleanup in Object_3D_Observer_Controller\n` +
            `----------------------------------------------------------\n`;

        super.cleanup();

        this.logMessage += 
            `----------------------------------------------------------\n` + 
            `starting cleanup in Object_3D_Observer_Controller after super.cleanup\n` +
            `----------------------------------------------------------\n`;

        this.isResizing = false;
        this.resizeTimeout = null;
        this.isContextLost = false;
        this.isVisible = false;
        this.initialized = false;

        this.logMessage += `isVisible: ${this.isVisible}\n` +
                       `isInitialized: ${this.initialized}\n` +
                       `isResizing: ${this.isResizing}\n` +
                       `resizeTimeout: ${this.resizeTimeout}\n` +
                       `isContextLost: ${this.isContextLost}\n` +
                       `cleanup in Object_3D_Observer_Controller completed\n` +
                       `-----------------------------------\n`;

    }

    /**
     * @private
     * @description Initializes visibility observer
     * @returns {void}
     */
    _initVisibilityObserver() {
        if (this.observer) {
            return;
        }
        
        this.logMessage += `${this.constructor.name} Object_3D_Observer_Controller: _initVisibilityObserver()\n`;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                    this.isVisible = entry.isIntersecting;

                    this.logMessage += 
                        `${this.constructor.name} (Object_3D_Observer_Controller): this.isVisible: ${this.isVisible}\n` +
                        `----------------------------------------------------------\n`;

                    if (!this.isVisible) {
                        this.isVisible = false;
    
                    } else {
                        if (!this.initialized) {
                            this.logMessage += 
                            `${this.constructor.name} (Object_3D_Observer_Controller): this.initialized: ${this.initialized}\n` +
                            `----------------------------------------------------------\n`;
                            await this.initScene();

                            this.logMessage += 
                            `${this.constructor.name} (Object_3D_Observer_Controller): this.initialized: ${this.initialized} success\n`;
                        }
                        if (!this.isResizing && this.canAnimate()) {
                            this.logMessage += this._logMessage();
                            this.logMessage += 
                            `----------------------------------------------------------\n` + 
                            `isResizing: ${this.isResizing}\n` +
                            `----------------------------------------------------------\n`;
                            this.animate();
                        }
                    }
    
                    this.logger.log({
                        message: this.logMessage,
                        functionName: '(Object_3D_Observer_Controller) _initVisibilityObserver()',
                    });
    
                    this.logMessage  =  '';
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);

        this.logMessage += 
        `${this.constructor.name} (Object_3D_Observer_Controller): _initVisibilityObserver()\n`;
    }
}