import { createLogger } from '../utils/logger';

/**
 * Manages 3D scene containers with proper positioning and z-index.
 * Responsible only for DOM container creation and cleanup.
 * 
 * @class ThreeDContainerManager
 */
export class ThreeDContainerManager {
    /**
     * @param {HTMLElement} parentContainer - Parent container for the 3D scene.
     * @param {Object} options - Container options.
     * @param {string} options.name - Container name/type (required, used for data attributes and debugging).
     * @param {string} [options.zIndex] - z-index value for the container.
     */
    constructor(parentContainer, options = {}) {

        if (!options.name) {
            throw new Error('Name is required for ThreeDContainerManager');
        }

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.parentContainer = parentContainer;
        this.options = options;
        this.container = null;
        this.containerClassName = 'three-d-container';
    }

    /**
     * Creates a new container for a 3D scene.
     * @returns {HTMLElement|null} Created container or null if parent is missing.
     */
    create() {
        if (!this.parentContainer) {
            this.logger.log('Parent container not found', {
                type: 'error',
                functionName: 'create',
            });
            return null;
        }
        
        if (this.container) {
            this.logger.log('Container already exists, skipping creation.', {
                functionName: 'create'
            });
            return this.container;
        }

        if (getComputedStyle(this.parentContainer).position === 'static') {
            this.parentContainer.style.position = 'relative';
        }

        this.container = document.createElement('div');
        this.container.className = this.containerClassName;
        this.container.dataset.containerName = this.options.name;
        
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: this.options.zIndex || '0',
            overflow: 'hidden',
            pointerEvents: 'none'
        });

        this.parentContainer.appendChild(this.container);
        
        this.container.id = `threejs-container-${this.options.name}-${crypto.randomUUID()}`;

        this.logger.log({
            conditions: ['creating-container'],
            functionName: `${this.options.name} create()`,
            customData: {
                container: this.container,
                containerSize: {
                    width: this.container.clientWidth,
                height: this.container.clientHeight
            },
            parentSize: {
                width: this.parentContainer.clientWidth,
                    height: this.parentContainer.clientHeight
                },
            }

        });

        return this.container;
    }

    /**
     * Cleans up the container by removing it from the DOM.
     */
    cleanup() {
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