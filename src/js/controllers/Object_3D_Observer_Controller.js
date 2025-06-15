import { Object_3D_Controller } from './Object_3D_Controller';

/**
 * @description Object_3D_Observer_Controller extends Object_3D_Controller
 * @extends {Object_3D_Controller}
 */
export class Object_3D_Observer_Controller extends Object_3D_Controller {
    constructor(container, customOptions = {}, defaultOptions = {}) {
        super(container, customOptions, defaultOptions);

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
    async onResize() {
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

        super.cleanup();

        this.isResizing = false;
        this.resizeTimeout = null;
        this.isContextLost = false;
        this.isVisible = false;
        this.initialized = false;
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

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
                    this.isVisible = entry.isIntersecting;

                    if (!this.isVisible) {
                        this.isVisible = false;
    
                    } else {
                        if (!this.initialized) {
                            await this.initScene();
                        }
                        if (!this.isResizing && this.canAnimate()) {
                            this.animate();
                        }
                    }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);
    }
}