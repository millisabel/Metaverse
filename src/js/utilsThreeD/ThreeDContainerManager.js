import { createLogger } from '../utils/logger';

/**
 * Manages 3D scene containers with proper positioning and z-index
 * @class ThreeDContainerManager
 */
export class ThreeDContainerManager {
    /**
     * @param {HTMLElement} parent - Parent element
     * @param {Object} options - Container options
     * @param {string} options.type - Container type
     * @param {string} [options.zIndex] - z-index value
     */
    constructor(parent, options = {}) {
        if (!options.type) {
            throw new Error('Type is required for ThreeDContainerManager');
        }

        this.parent = parent;
        this.type = options.type;
        this.zIndex = options.zIndex;
        
        this.name = 'ThreeDContainerManager';
        this.logger = createLogger(this.name);
    }

    /**
     * Creates a new container for 3D scene
     * @returns {HTMLElement} Created container
     */
    create() {
        this.logger.log('Creating 3D container', {
            conditions: ['creating-container'],
            type: this.type,
            zIndex: this.zIndex,
            functionName: 'create',
        });

        const container = document.createElement('div');
        container.setAttribute('data-3d-type', this.type);
        
        const containerOptions = {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: this.zIndex
        };
        
        Object.assign(container.style, containerOptions);
        this.parent.insertBefore(container, this.parent.firstChild);
        
        return container;
    }

    /**
     * Cleans up the container
     */
    cleanup() {
        this.logger.log('Cleaning up 3D container', {
            conditions: ['cleaning-up'],
            type: this.type
        });

        const container = this.parent.querySelector(`[data-3d-type="${this.type}"]`);
        if (container) {
            container.parentNode.removeChild(container);
        }
    }
} 