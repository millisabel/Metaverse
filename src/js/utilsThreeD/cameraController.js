import * as THREE from 'three';
import { createLogger } from '../utils/logger';

/**
 * Controller for managing Three.js camera setup and behavior
 * Handles camera initialization, positioning, rotation, and cleanup
 * 
 * @class CameraController
 */
export class CameraController {
    /**
     * Creates an instance of CameraController
     * @param {Object} [options={}] - Camera configuration options
     * @param {number} [options.fov=45] - Field of view in degrees
     * @param {number} [options.near=0.1] - Near clipping plane
     * @param {number} [options.far=2000] - Far clipping plane
     * @param {Object} [options.position] - Initial camera position
     * @param {number} [options.position.x=0] - X position
     * @param {number} [options.position.y=0] - Y position
     * @param {number} [options.position.z=5] - Z position
     * @param {Object} [options.lookAt] - Point camera looks at
     * @param {number} [options.lookAt.x=0] - X coordinate
     * @param {number} [options.lookAt.y=0] - Y coordinate
     * @param {number} [options.lookAt.z=0] - Z coordinate
     * @param {boolean} [options.rotation=false] - Enable camera rotation
     * @param {Object} [options.speed] - Camera rotation speed
     * @param {number} [options.speed.x=0.00002] - X rotation speed
     * @param {number} [options.speed.y=0.00002] - Y rotation speed
     */
    constructor(options = {}) {
        this.name = 'CameraController';
        this.logger = createLogger(this.name);

        // Default camera options
        this.options = {
            fov: 45,
            near: 0.1,
            far: 2000,
            position: { x: 0, y: 0, z: 5 },
            lookAt: { x: 0, y: 0, z: 0 },
            rotation: false,
            speed: { x: 0.00002, y: 0.00002 },
            ...options
        };

        this.camera = null;
        this.aspect = 1;
        this.isInitialized = false;

        this.logger.log('CameraController initialized', {
            conditions: ['initializing-controller'],
            functionName: 'constructor'
        });
    }

    /**
     * Initialize the camera with container dimensions
     * Creates a new THREE.PerspectiveCamera or THREE.OrthographicCamera and sets initial position and orientation
     * @param {HTMLElement} container - Container element for calculating aspect ratio
     * @public
     */
    init(container) {
        if (this.isInitialized) return;

        this.logger.log('Initializing camera', {
            conditions: ['initializing-camera'],
            functionName: 'init'
        });

        // Calculate aspect ratio
        const rect = container.getBoundingClientRect();
        this.aspect = rect.width / rect.height;

        // --- Поддержка OrthographicCamera ---
        if (this.options.type === 'orthographic') {
            // Опции для ortho-камеры
            const left = this.options.left !== undefined ? this.options.left : -rect.width / 2;
            const right = this.options.right !== undefined ? this.options.right : rect.width / 2;
            const top = this.options.top !== undefined ? this.options.top : rect.height / 2;
            const bottom = this.options.bottom !== undefined ? this.options.bottom : -rect.height / 2;
            const near = this.options.near !== undefined ? this.options.near : -1000;
            const far = this.options.far !== undefined ? this.options.far : 1000;
            this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        } else {
            // PerspectiveCamera по умолчанию
            this.camera = new THREE.PerspectiveCamera(
                this.options.fov,
                this.aspect,
                this.options.near,
                this.options.far
            );
        }

        // Set initial position
        this.setPosition(this.options.position);
        
        // Set initial lookAt
        this.setLookAt(this.options.lookAt);

        this.isInitialized = true;

        this.logger.log('Camera initialized', {
            type: 'success',
            conditions: ['camera-initialized'],
            functionName: 'init'
        });
    }

    /**
     * Set camera position
     * @param {Object} position - Position coordinates
     * @param {number} position.x - X coordinate
     * @param {number} position.y - Y coordinate
     * @param {number} position.z - Z coordinate
     * @public
     */
    setPosition(position) {
        if (!this.camera) return;

        Object.entries(position).forEach(([axis, value]) => {
            this.camera.position[axis] = value;
        });

        this.logger.log('Camera position updated', {
            conditions: ['position-updated'],
            functionName: 'setPosition',
            position
        });
    }

    /**
     * Set camera look-at point
     * @param {Object} lookAt - Look-at coordinates
     * @param {number} lookAt.x - X coordinate
     * @param {number} lookAt.y - Y coordinate
     * @param {number} lookAt.z - Z coordinate
     * @public
     */
    setLookAt(lookAt) {
        if (!this.camera) return;

        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

        this.logger.log('Camera lookAt updated', {
            conditions: ['lookAt-updated'],
            functionName: 'setLookAt',
            lookAt
        });
    }

    /**
     * Update camera rotation based on speed settings
     * Only applies if rotation is enabled in options
     * @public
     */
    updateRotation() {
        if (!this.camera || !this.options.rotation) return;

        this.camera.rotation.x += this.options.speed.x;
        this.camera.rotation.y += this.options.speed.y;

        this.logger.log('Camera rotation updated', {
            conditions: ['rotation-updated'],
            functionName: 'updateRotation'
        });
    }

    /**
     * Handle container resize
     * Updates camera aspect ratio and projection matrix
     * @param {HTMLElement} container - Container element for calculating new aspect ratio
     * @public
     */
    onResize(container) {
        if (!this.camera) return;

        const rect = container.getBoundingClientRect();
        this.aspect = rect.width / rect.height;
        
        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = this.aspect;
        } else if (this.camera.isOrthographicCamera) {
            // Пересчитываем ortho-границы
            this.camera.left = this.options.left !== undefined ? this.options.left : -rect.width / 2;
            this.camera.right = this.options.right !== undefined ? this.options.right : rect.width / 2;
            this.camera.top = this.options.top !== undefined ? this.options.top : rect.height / 2;
            this.camera.bottom = this.options.bottom !== undefined ? this.options.bottom : -rect.height / 2;
        }
        this.camera.updateProjectionMatrix();

        this.logger.log('Camera resized', {
            conditions: ['resized'],
            functionName: 'onResize',
            aspect: this.aspect
        });
    }

    /**
     * Clean up camera resources
     * Resets camera instance and initialization state
     * @public
     */
    cleanup() {
        if (this.camera) {
            this.camera = null;
            this.isInitialized = false;

            this.logger.log('Camera cleaned up', {
                conditions: ['cleanup'],
                functionName: 'cleanup'
            });
        }
    }
} 