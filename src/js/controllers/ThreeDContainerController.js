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
 * @class ThreeDContainerController
 * @param {Object} options - Container options.
 * @param {HTMLElement} options.parent - Parent container for the 3D scene.
 * @param {number} options.parentZIndex - z-index value for the parent container.
 * @param {string} options.name_3D_Container - Container name/type (required, used for data attributes and debugging).
 * @param {string} [options.zIndex_3D_Container] - z-index value for the container.
 */
export class ThreeDContainerController {
    constructor(options = {}) {
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
    }

    /**
     * Creates a new container for a 3D scene.
     * @returns {HTMLElement|null} Created container or null if parent is missing.
     */
    _createContainer() {
        if (!this.parentContainer) {
            console.error('Parent container not found');
            return null;
        }
        
        if (this.container) {
            console.error('Container already exists, skipping creation.');
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
            this.container = null;
        }
    }
} 