import { BaseSetup } from '../utilsThreeD/baseSetup';
import { createLogger } from '../utils/logger';

/**
 * @description Universal 3D Section
 * @extends {BaseSetup}
 * @param {string} containerId - The ID of the container element
 * @param {Object} objects3DConfig - The configuration for the 3D objects
 * @returns {Universal3DSection}
 */
export class Universal3DSection extends BaseSetup {
    constructor(containerId, objects3DConfig, zIndex = 0) {
        super(containerId, zIndex);

        this.name = `(Universal3DSection) ⬅ ${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.objects3D = objects3DConfig;
        this.controllers = {};
        this._controllersCreated = false;
        this._3dContainers = {};

        this._initLazyObserver();

        this.logger.log({
            functionName: 'constructor',
            conditions: ['init'],
            customData: { this: this }
        });
    }

    /**
     * @description Initialize the lazy observer
     * @returns {void}
     */
    _initLazyObserver() {
        this._lazyObserver = new IntersectionObserver(async entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    await this._onEnterViewport();
                } else {
                    this._onExitViewport();
                }
            }
        }, { threshold: 0.1, rootMargin: '100px' });

        this._lazyObserver.observe(this.container);
    }

    /**
     * @description On enter viewport
     * @returns {void}
     */
    async _onEnterViewport() {
        if (!this._controllersCreated) {
            for (const [key, params] of Object.entries(this.objects3D)) {
                if (!this._3dContainers[key]) {
                    this._3dContainers[key] = this._getOrCreateContainer(params.containerName || key, params.zIndex || 1);
                }
                if (!this.controllers[key]) {
                    this.controllers[key] = new params.classRef(this._3dContainers[key], {
                        ...params,
                        camera: params.camera
                    });
                }
            }
            this._controllersCreated = true;
            // await this.setupScene();
        } else {
            // await this.setupScene();
        }
    }

    /**
     * @description Get or create a container
     * @param {string} containerName - The name of the container
     * @param {number} zIndex - The z-index of the container
     * @returns {HTMLElement}
     */
    _getOrCreateContainer(containerName, zIndex) {
        let container = document.getElementById(containerName);
        
        if (!container) {
            container = this.createContainer(containerName, zIndex);
        }

        return container;
    }

    /**
     * @description Setup the scene
     * @returns {void}
     */
    async setupScene() {
        this.logger.log({
            functionName: 'setupScene',
            conditions: ['init'],
            customData: { this: this }
        });

        this._applyBaseContainerStyles(this.objects3D);
        await this._initControllers();
    }

    /**
     * @description Initialize the controllers
     * @returns {void}
     */
    async _initControllers() {
        for (const controller of Object.values(this.controllers)) {
            if (controller && typeof controller.init === 'function') {
                await controller.init();
            }
        }
    }

    /**
     * @description On exit viewport
     * @returns {void}
     */
    _onExitViewport() {
        if (this._controllersCreated) {
            for (const controller of Object.values(this.controllers)) {
                if (controller && typeof controller.cleanup === 'function') {
                    controller.cleanup();
                }
            }
        }
    }

    /**
     * @description Create a 3D controller
     * @param {string} type - The type of the 3D object
     * @param {Object} params - The parameters for the 3D object
     * @returns {Object}
     */
    create3DController(type, params) {
        const key = params.containerName || type;
        const container = this._3dContainers[key];
        if (!container) {
            throw new Error(`Container for 3D object "${type}" not found. Make sure to call _onEnterViewport first.`);
        }
        if (!params.classRef) {
            throw new Error(`classRef is not specified for 3D object "${type}"`);
        }
        return new params.classRef(container, {
            ...params,
            camera: params.camera
        });
    }

    _applyBaseContainerStyles(objects3DConfig) {
        this.container.style.position = 'relative'; 
        if (objects3DConfig.backgroundZIndex !== undefined) {
            this.container.style.zIndex = objects3DConfig.backgroundZIndex;
        }
    }

    /**
     * @description On resize
     * @returns {void}
     */
    onResize() {
        Object.values(this.controllers).forEach(ctrl => {
            if (ctrl && typeof ctrl.onResize === 'function') {
                ctrl.onResize();
            }
        });
    }

    /**
     * @description Update the controllers
     * @returns {void}
     */
    update() {
        for (const controller of Object.values(this.controllers)) {
            if (controller && typeof controller.update === 'function') {
                controller.update();
            }
        }
    }

    /**
     * @description Cleanup the controllers
     * @returns {void}
     */
    cleanup() {
        for (const controller of Object.values(this.controllers)) {
            let logMessage = `starting cleanup in ${this.constructor.name}\n`;

        if (controller && typeof controller.cleanup === 'function') {
            logMessage += `controller: ${this.controllers}\n`;
            controller.cleanup(logMessage);
            }
        }
    }
  }