import { SectionObserver } from './SectionObserver';
import { createLogger } from '../utils/logger';
import { ThreeDContainerController } from './ThreeDContainerController';

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

        this.parentContainer = document.getElementById(containerId);
        this.parentZIndex = zIndex;

        this.objects3DConfig = objects3DConfig;
        this.controllers = {};
        this._controllersCreated = false;
        this._3dContainers = {};
    }

    /**
     * @description Setup the scene
     * @returns {void}
     */
    async setupControllers() {
        this.logger.log({
            functionName: '(Universal3DSection) setupControllers()',
        });

        await this._setupContainers();
        await this._createControllers();
        await this._initControllers();
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
                try {
                    controller.update();
                } catch (e) {
                    console.warn('update error:', e);
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

    /**
     * @description Cleans up a specific container type
     * @param {string} type - Container type from CONTAINER_TYPES
     * @returns {void}
     */
    deleteContainer_3D_Object() {
        const manager = new ThreeDContainerController(this.container);
        manager.delete();
    }

    /**
     * @description Setup the containers
     * @returns {void}
     */
    async _setupContainers() {
        this.logger.log({
            functionName: '(Universal3DSection) _setupContainers()',
        });

        for (const [key, params] of Object.entries(this.objects3DConfig)) {

            const CONTAINER_CONFIG = {
                parent: this.parentContainer,
                parentZIndex: this.parentZIndex,
                name_3D_Container: params.containerName || key,
                zIndex_3D_Container: params.zIndex || 1,
            };

            if (!this._3dContainers[CONTAINER_CONFIG.name_3D_Container]) {
                this._3dContainers[CONTAINER_CONFIG.name_3D_Container] = new ThreeDContainerController(CONTAINER_CONFIG).init();
            }
        }
    }

    /**
     * @description Create the controllers
     * @returns {void}
     */
    async _createControllers() {
        this.logger.log({
            functionName: '(Universal3DSection) _createControllers()',
            conditions: ['initializing-controllers'],
        });

        for (const [key, params] of Object.entries(this.objects3DConfig)) {
            const containerName = params.containerName || key;

            if (!this.controllers[key]) {
                this.controllers[key] = new params.classRef(this._3dContainers[containerName], {
                    ...params,
                });
            }
        }
        this._controllersCreated = true;
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

        this.logger.log({
            type: 'success',
            functionName: '(Universal3DSection) _initControllers',
            conditions: ['initializing-controllers'],
        });
    }
  }