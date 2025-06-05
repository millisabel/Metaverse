import { createLogger } from '../utils/logger';

import { SectionObserver } from './SectionObserver';
import { ThreeDContainerController } from './ThreeDContainerController';

/**
 * @description SectionController is a controller for a section of a page.
 * @param {string} containerId - The ID of the container element
 * @param {Object} objects3DConfig - The configuration for the 3D objects
 * @returns {SectionController}
 */
export class SectionController extends SectionObserver {
    constructor(containerId, objects3DConfig, zIndex) {
        super(containerId);

        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);
        this.logMessage = '';
        this.logMessage += `${this.constructor.name} (SectionController): constructor()\n`;

        this.parentContainer = document.getElementById(containerId);
        this.parentZIndex = zIndex;

        this.objects3DConfig = objects3DConfig;
        this.controllers = {};
        this._controllersCreated = false;
        this._3dContainers = {};
    }

    /**
     * @description initialize section with 3d objects
     * @returns {Promise<void>}
     */
    async initSection() {
        this.logMessage += `${this.constructor.name} (SectionController): initSection()\n`;
        
        if (this.initialized) return;
        await this._setupControllers();
        
        this.initialized = true;

        this.logMessage += `${this.constructor.name} (SectionController): initialized: ${this.initialized} \n`;
        this.logMessage += `${this.constructor.name} (SectionController): initSection() success\n`;
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
        this.logMessage += 
            `${this.name}: Starting cleanup (SectionController)\n` +
            `----------------------------------------------------------\n`;

        this._cleanupControllers();
        this._controllersCreated = false;

        this.logMessage += 
            `_controllersCreated: ${this._controllersCreated}\n` +  
            `cleanup success (SectionController)\n`;
        super.cleanup();
    }

    /**
     * @description Setup the scene
     * @returns {void}
     */
    async _setupControllers() {
        this.logMessage += `${this.constructor.name} (SectionController): setupControllers()\n`;

        await this._setupContainers();
        await this._createControllers();
        await this._initControllers();

        this.logMessage += `${this.constructor.name} (SectionController): setupControllers() success\n`;
    }

    /**
     * @description Get the container element
     * @param {string} containerId - ID of the container element
     * @returns {HTMLElement}
     */
    _getContainer(containerId) {
        this.logMessage += `${this.constructor.name} (SectionController): _getContainer()\n`;

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id ${containerId} not found`);
        }

        this.logMessage += `${this.constructor.name} (SectionController): _getContainer() success\n`;
        return container;
    }

    /**
     * @description Cleans up a specific container type
     * @param {string} type - Container type from CONTAINER_TYPES
     * @returns {void}
     */
    _deleteContainer_3D_Object() {
        this.logMessage += `${this.name}: _deleteContainer_3D_Object()\n`;

        const manager = new ThreeDContainerController(this.container);
        manager.delete();

        this.logMessage += `${this.name}: _deleteContainer_3D_Object() success\n`;
    }

    /**
     * @description Setup the containers
     * @returns {void}
     */
    async _setupContainers() {
        this.logMessage += `${this.constructor.name} (SectionController): _setupContainers()\n`;

        for (const [key, params] of Object.entries(this.objects3DConfig)) {

            const CONTAINER_CONFIG = {
                parent: this.parentContainer,
                parentZIndex: this.parentZIndex,
                name_3D_Container: params.containerName || key,
                zIndex_3D_Container: params.zIndex || 1,
            };

            if (!this._3dContainers[CONTAINER_CONFIG.name_3D_Container]) {
                this._3dContainers[CONTAINER_CONFIG.name_3D_Container] = new ThreeDContainerController(CONTAINER_CONFIG).init();

                if (this._3dContainers[CONTAINER_CONFIG.name_3D_Container]) {
                    this.logMessage += `${this.constructor.name} (SectionController): _setupContainers() ${CONTAINER_CONFIG.name_3D_Container} success\n`;
                } else {
                    throw new Error(`${this.constructor.name} (SectionController): _setupContainers() ${CONTAINER_CONFIG.name_3D_Container} failed\n`);
                }
            }
        }
    }

    /**
     * @description Cleanup the controllers
     * @returns {void}
     */
    _cleanupControllers() {
        for (const [key, controller] of Object.entries(this.controllers)) {
            if (controller && typeof controller.cleanup === 'function') {
                controller.cleanup();
                this.logMessage += `controller ${key} cleaned up success\n`;
            }
        }

        this.controllers = [];
        this.logMessage += `cleanupControllers() controllers: ${this.controllers}\n`;
    }

    /**
     * @description Create the controllers
     * @returns {void}
     */
    async _createControllers() {
        this.logMessage += `${this.constructor.name} (SectionController): _createControllers()\n`;

        for (const [key, params] of Object.entries(this.objects3DConfig)) {
            const containerName = params.containerName || key;

            if(!this._controllersCreated) {
                this.controllers[key] = new params.classRef(this._3dContainers[containerName], {
                    ...params, 
                });
            }
            if (this.controllers[key]) {
                this.logMessage += `${this.constructor.name} (SectionController): _createControllers() ${containerName} success\n`;
            } else {
                throw new Error(`${this.constructor.name} (SectionController): _createControllers() ${containerName} failed\n`);
            }
        }   
        this._controllersCreated = true;

        this.logMessage += `${this.constructor.name} (SectionController): _controllersCreated: ${this._controllersCreated}\n`;
    }

    /**
     * @description Initialize the controllers
     * @returns {void}
     */
    async _initControllers() {
        this.logMessage += `${this.constructor.name} (SectionController): _initControllers()\n`;

        for (const controller of Object.values(this.controllers)) {
            if (controller && typeof controller.init === 'function') {
                await controller.init();
                this.logMessage += `${this.constructor.name} (SectionController): _initControllers() ${controller.name} success\n`;
            } else {
                throw new Error(`${this.constructor.name} (SectionController): _initControllers() ${controller.name} failed\n`);
            }
        }
    }
  }