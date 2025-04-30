import { createLogger } from '../utils/logger';
import { ThreeDContainerManager } from './ThreeDContainerManager';

export class BaseSetup {
    constructor(containerId, name) {
        this.container = document.getElementById(containerId);
        this.initialized = false;
        this.name = name;
        this.logger = createLogger(this.name);
        
        // initialize container types and z-index
        this.CONTAINER_TYPES = {};
        this.Z_INDEX = {};
    }

    /**
     * Creates a 3D container with specified type and z-index
     * @param {string} type - Container type from CONTAINER_TYPES
     * @param {string} zIndex - Z-index from Z_INDEX
     * @returns {HTMLElement} Created container
     */
    createContainer(type, zIndex) {
        const manager = new ThreeDContainerManager(this.container, { 
            type: type,
            zIndex: zIndex
        });
        return manager.create();
    }

    /**
     * Cleans up a specific container type
     * @param {string} type - Container type from CONTAINER_TYPES
     */
    cleanupContainer(type) {
        const manager = new ThreeDContainerManager(this.container, { type });
        manager.cleanup();
    }

    /**
     * Base initialization check
     * @returns {boolean} Whether initialization should proceed
     */
    canInitialize() {
        if (!this.container || this.initialized) {
            return false;
        }
        
        this.logger.log({
            conditions: 'init',
            functionName: 'init'
        });
        
        return true;
    }

    /**
     * Marks initialization as complete and logs success
     */
    completeInitialization() {
        this.initialized = true;
        this.logger.log({
            type: 'success',
            functionName: 'init'
        });
    }

    /**
     * Base cleanup check
     * @returns {boolean} Whether cleanup should proceed
     */
    canCleanup() {
        return this.initialized;
    }

    /**
     * Marks cleanup as complete
     */
    completeCleanup() {
        this.initialized = false;
    }

    // Abstract methods that should be implemented by child classes
    init() {
        throw new Error('init() must be implemented by child class');
    }

    cleanup() {
        throw new Error('cleanup() must be implemented by child class');
    }
} 