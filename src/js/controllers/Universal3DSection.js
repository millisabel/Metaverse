import { SectionObserver } from './SectionObserver';
import { createLogger } from '../utils/logger';

/**
 * @description Universal 3D Section
 * @extends {BaseSetup}
 * @param {string} containerId - The ID of the container element
 * @param {Object} objects3DConfig - The configuration for the 3D objects
 * @returns {Universal3DSection}
 */
export class Universal3DSection extends SectionObserver {
    constructor(containerId, objects3DConfig, zIndex) {
        super(containerId, zIndex);

        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.objects3D = objects3DConfig;
        this.controllers = {};
        this._controllersCreated = false;
        this._3dContainers = {};

        this.logger.log({
            functionName: '(Universal3DSection) constructor()',
            conditions: ['init'],
            customData: { this: this }
        });
    }

    /**
     * @description Setup the scene
     * @returns {void}
     */
    async setupScene() {
        for (const [key, params] of Object.entries(this.objects3D)) {
            if (!this._3dContainers[key]) {
                this._3dContainers[key] = this._getOrCreateContainer(params.containerName || key, params.zIndex || 1);
            }
            if (!this.controllers[key]) {
                console.log('params', params);
                console.log('this._3dContainers[key]', this._3dContainers[key]);
                this.controllers[key] = new params.classRef(this._3dContainers[key], {
                    ...params,
                });
            }
        }
        this._controllersCreated = true;

        await this._initControllers();

        this.logger.log({
            type: 'success',
            functionName: '(Universal3DSection) setupScene()',
            conditions: ['initializing-scene'],
        });
    }

    /**
     * @description Initialize the controllers
     * @returns {void}
     */
    async _initControllers() {
        for (const controller of Object.values(this.controllers)) {
            if (controller && typeof controller.init === 'function') {
                await controller.init();
                console.log('controller', controller);
            }
        }

        this.logger.log({
            type: 'success',
            functionName: '(Universal3DSection) _initControllers',
            conditions: ['initializing-controllers'],
        });
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

    /**
     * @description On resize
     * @returns {void}
     */
    onResize() {
        Object.values(this.controllers).forEach(ctrl => {
            if (
                ctrl &&
                typeof ctrl.onResize === 'function' &&
                (ctrl.isInitialized || ctrl.initialized)
            ) {
                try {
                    ctrl.onResize();
                } catch (e) {
                    console.warn('onResize error:', e);
                }
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
     * @description On exit viewport
     * @returns {void}
     */
    onExitViewport() {

        if (this._controllersCreated) {
            for (const [key, controller] of Object.entries(this.controllers)) {
                if (controller && typeof controller.cleanup === 'function') {
                    controller.cleanup();
                    delete this.controllers[key];
                }
            }
        }
    }

    /**
     * @description Cleanup the controllers
     * @returns {void}
     */
    cleanup() {
        let logMessage = `starting cleanup in ${this.name}\n`;

        for (const [key, controller] of Object.entries(this.controllers)) {
            if (controller && typeof controller.cleanup === 'function') {
                controller.cleanup();
                delete this.controllers[key];
                logMessage += `controller ${key} cleaned up\n`;
            }
        }

        super.cleanup(logMessage);
    }
  }