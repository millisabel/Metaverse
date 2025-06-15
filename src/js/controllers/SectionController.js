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
    initSection() {
        if (this.initialized) return;

        this._setupControllers();
        
        this.initialized = true;
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
     * @description Get the container element
     * @param {string} containerId - ID of the container element
     * @returns {HTMLElement}
     */
    getContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id ${containerId} not found`);
        }
        return container;
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
        this._cleanupControllers();
        this._controllersCreated = false;

        super.cleanup();
    }

    /**
     * @description Setup the scene
     * @returns {void}
     */
    async _setupControllers() {
        await this._setupContainers();
        await this._createControllers();
        await this._initControllers();
    }   

    /**
     * @description Cleans up a specific container type
     * @param {string} type - Container type from CONTAINER_TYPES
     * @returns {void}
     */
    _deleteContainer_3D_Object() {
        const manager = new ThreeDContainerController(this.container);
        manager.delete();
    }

    /**
     * @description Setup the containers
     * @returns {void}
     */
    async _setupContainers() {
        for (const [key, params] of Object.entries(this.objects3DConfig)) {

            const CONTAINER_CONFIG = {
                parent: this.parentContainer,
                parentZIndex: this.parentZIndex,
                name_3D_Container: params.containerName || key,
                zIndex_3D_Container: params.zIndex || 1,
            };

            if (!this._3dContainers[CONTAINER_CONFIG.name_3D_Container]) {
                this._3dContainers[CONTAINER_CONFIG.name_3D_Container] = await this._createContainer(CONTAINER_CONFIG);

                if (!this._3dContainers[CONTAINER_CONFIG.name_3D_Container]) {
                    throw new Error(`${this.constructor.name} (SectionController): _setupContainers() ${CONTAINER_CONFIG.name_3D_Container} failed\n`);
                }
            }
        }
    }

    async _createContainer(params) {
        return new ThreeDContainerController(params).init();
    }

    /**
     * @description Cleanup the controllers
     * @returns {void}
     */
    _cleanupControllers() {
        for (const [key, controller] of Object.entries(this.controllers)) {
            if (controller && typeof controller.cleanup === 'function') {
                controller.cleanup();
            }
            else{
                throw new Error(`${this.constructor.name} (SectionController): _cleanupControllers() ${controller[key]} failed\n`);
            }
        }

        this.controllers = [];
    }

    /**
     * @description Create the controllers
     * @returns {void}
     */
    async _createControllers() {
        for (const [key, params] of Object.entries(this.objects3DConfig)) {
            const containerName = params.containerName || key;
            if(!this._controllersCreated) {
                this.controllers[key] = await this._createController(containerName, params);
            }
            if (!this.controllers[key]) {
                throw new Error(`${this.constructor.name} (SectionController): _createControllers() ${containerName} failed\n`);
            }
        }   
        this._controllersCreated = true;
    }
    
    async _createController(containerName, params) {
        return new params.classRef(this._3dContainers[containerName], {
            ...params, 
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
            } else {
                throw new Error(`${this.constructor.name} (SectionController): _initControllers() ${controller.name} failed\n`);
            }
        }
    }
  }