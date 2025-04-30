import { createLogger } from '../utils/logger';

/**
 * Manages 3D scene containers with proper positioning and z-index
 * @class ThreeDContainerManager
 */
export class ThreeDContainerManager {
    /**
     * @param {HTMLElement} parentContainer - Parent container
     * @param {Object} options - Container options
     * @param {string} options.type - Container type
     * @param {string} [options.zIndex] - z-index value
     */
    constructor(parentContainer, options = {}) {
        if (!options.type) {
            throw new Error('Type is required for ThreeDContainerManager');
        }

        this.parentContainer = parentContainer;
        this.options = options;
        this.container = null;
        
        this.name = 'ThreeDContainerManager';
        this.logger = createLogger(this.name);
    }

    /**
     * Creates a new container for 3D scene
     * @returns {HTMLElement} Created container
     */
    create() {
        if (!this.parentContainer) {
            this.logger.log('Parent container not found', 'error');
            return null;
        }

        this.parentContainer.style.position = 'relative';

        // Создаем контейнер для 3D сцены
        this.container = document.createElement('div');
        this.container.className = 'three-d-container';
        
        // Устанавливаем стили для контейнера
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

        // Добавляем контейнер в родительский элемент
        this.parentContainer.appendChild(this.container);

        this.logger.log('Container created', {
            container: this.container,
            containerSize: {
                width: this.container.clientWidth,
                height: this.container.clientHeight
            },
            parentSize: {
                width: this.parentContainer.clientWidth,
                height: this.parentContainer.clientHeight
            }
        });

        return this.container;
    }

    /**
     * Cleans up the container
     */
    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
} 