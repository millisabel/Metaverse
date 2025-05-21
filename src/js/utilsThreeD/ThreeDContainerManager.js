import { createLogger } from '../utils/logger';

const STYLES_3D_CONTAINER = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
}

/**
 * Manages 3D scene containers with proper positioning and z-index.
 * Responsible only for DOM container creation and cleanup.
 * 
 * @class ThreeDContainerManager
 * @param {Object} options - Container options.
 * @param {HTMLElement} options.parent - Parent container for the 3D scene.
 * @param {number} options.parentZIndex - z-index value for the parent container.
 * @param {string} options.name_3D_Container - Container name/type (required, used for data attributes and debugging).
 * @param {string} [options.zIndex_3D_Container] - z-index value for the container.
 */
export class ThreeDContainerManager {
    constructor(options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.parentContainer = options.parent;
        this.parentZIndex = options.parentZIndex || '0';
        this.container_3D_Name = options.name_3D_Container;
        this.container_3D_zIndex = options.zIndex_3D_Container || '1';

        this.container = null;
        this.containerClassName = 'three-d-container';
    }

    /**
     * @description Initialize the container
     * @returns {HTMLElement}
     */
    init() {
        this.logger.log({
            functionName: 'init',
            customData: {
                parentContainer: this.parentContainer,
                container_3D_Name: this.container_3D_Name,
                container_3D_zIndex: this.container_3D_zIndex,
                container: this.container
            }
        });

        if (!this.parentContainer) {
            throw new Error(`Parent container not found`);
        }

        this._applyParentContainerStyles(this.parentContainer, this.parentZIndex);

        if (!this.container) {
            this._getContainer();
        }

        if (!this.container) {      
            this._createContainer();
        }

        if (!this.container) {
            throw new Error(`Container with name "${key}" not found und kann nicht erstellt werden.`);
        }

        if(this.container){
            this.logger.log({
                functionName: 'setup',
                type: 'success',
                customData: {
                    container: this.container
                }
            });
        }

        return this.container;

    }

    /**
     * @description Apply styles to the parent container
     * @param {HTMLElement} container - The parent container
     * @param {number} zIndex - The z-index value
     * @returns {void}
     */
    _applyParentContainerStyles(container, zIndex) {
        if(container.style.position === 'static') {
            container.style.position = 'relative';
        }
        if(container.style.zIndex !== zIndex) {
            container.style.zIndex = zIndex;
        }
    }

    /**
     * @description Get the container
     * @returns {HTMLElement|null}
     */
    _getContainer() {
        this.container = document.getElementById(this.container_3D_Name);

        if (!this.container) {
            return;
        }

        this.logger.log({
            functionName: '(Universal3DSection) _getContainer()',
            conditions: ['getting-container'],
            customData: {
                container_3D_Name: container_3D_Name,
                container: container
            }
        });
    }

    /**
     * Creates a new container for a 3D scene.
     * @returns {HTMLElement|null} Created container or null if parent is missing.
     */
    _createContainer() {
        if (!this.parentContainer) {
            this.logger.log('Parent container not found', {
                type: 'error',
                functionName: '_createContainer()',
            });
            return null;
        }
        
        if (this.container) {
            this.logger.log('Container already exists, skipping creation.', {
                functionName: '_createContainer()'
            });
            return this.container;
        }

        this.container = document.createElement('div');
        this.container.className = this.containerClassName;
        this.container.dataset.containerName = this.container_3D_Name;
        
        Object.assign(this.container.style, STYLES_3D_CONTAINER);
        this.container.style.zIndex = this.container_3D_zIndex;
        this.container.id = `threejs-container-${this.container_3D_Name}-${crypto.randomUUID()}`;

        this.parentContainer.appendChild(this.container);

        return this.container;
    }

    /**
     * Cleans up the container by removing it from the DOM.
     */
    delete() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.logger.log({
                conditions: ['removed-container'],
                functionName: 'cleanup',
                customData: { container: this.container }
            });
            this.container = null;
        }
    }
} 