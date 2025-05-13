import * as THREE from 'three';
import { createLogger } from '../utils/logger';

/**
 * Controller for managing Three.js camera setup and behavior.
 * Handles camera initialization, positioning, rotation, resize, and cleanup.
 * 
 * @class CameraController
 */
export class CameraController {
    /**
     * Creates an instance of CameraController.
     * @param {Object} [options={}] - Camera configuration options.
     * @param {string} [options.type='perspective'] - Camera type: 'perspective' or 'orthographic'.
     * @param {number} [options.fov=45] - Field of view in degrees (for perspective camera).
     * @param {number} [options.near=0.1] - Near clipping plane.
     * @param {number} [options.far=2000] - Far clipping plane.
     * @param {Object} [options.position] - Initial camera position {x, y, z}.
     * @param {Object} [options.lookAt] - Point camera looks at {x, y, z}.
     * @param {boolean} [options.rotation=false] - Enable camera rotation.
     * @param {Object} [options.speed] - Camera rotation speed {x, y}.
     * @param {number} [options.left] - Left plane (for orthographic camera).
     * @param {number} [options.right] - Right plane (for orthographic camera).
     * @param {number} [options.top] - Top plane (for orthographic camera).
     * @param {number} [options.bottom] - Bottom plane (for orthographic camera).
     */
    constructor(options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.options = {
            type: 'perspective',
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
    }

    /**
     * Initializes the camera with container dimensions.
     * Creates a new THREE.PerspectiveCamera or THREE.OrthographicCamera and sets initial position and orientation.
     * @param {HTMLElement} container - Container element for calculating aspect ratio.
     * @public
     */
    init(container) {
        if (this.isInitialized) return;

        // Calculate aspect ratio
        const rect = container.getBoundingClientRect();
        this.aspect = rect.width / rect.height;

        if (this.options.type === 'orthographic') {
            // Orthographic camera setup
            const left = this.options.left !== undefined ? this.options.left : -rect.width / 2;
            const right = this.options.right !== undefined ? this.options.right : rect.width / 2;
            const top = this.options.top !== undefined ? this.options.top : rect.height / 2;
            const bottom = this.options.bottom !== undefined ? this.options.bottom : -rect.height / 2;
            const near = this.options.near !== undefined ? this.options.near : -1000;
            const far = this.options.far !== undefined ? this.options.far : 1000;
            this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        } else {
            // Perspective camera setup
            this.camera = new THREE.PerspectiveCamera(
                this.options.fov,
                this.aspect,
                this.options.near,
                this.options.far,
            );
        }

        this.setPosition(this.options.position);
        this.setLookAt(this.options.lookAt);

        this.isInitialized = true;

        this.logger.log('Camera initialized', {
            conditions: ['camera-initialized'],
            functionName: 'init'
        });
    }

    /**
     * Sets camera position.
     * @param {Object} position - Position coordinates {x, y, z}.
     * @public
     */
    setPosition(position) {
        if (!this.camera) return;
        Object.entries(position).forEach(([axis, value]) => {
            this.camera.position[axis] = value;
        });
    }

    /**
     * Sets camera look-at point.
     * @param {Object} lookAt - Look-at coordinates {x, y, z}.
     * @public
     */
    setLookAt(lookAt) {
        if (!this.camera) return;
        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    }

    /**
     * Updates camera rotation based on speed settings.
     * Only applies if rotation is enabled in options.
     * @public
     */
    updateRotation() {
        if (!this.camera || !this.options.rotation) return;
        this.camera.rotation.x += this.options.speed.x;
        this.camera.rotation.y += this.options.speed.y;
    }

    /**
     * Handles container resize.
     * Updates camera aspect ratio and projection matrix.
     * @param {HTMLElement} container - Container element for calculating new aspect ratio.
     * @public
     */
    onResize(container) {
        if (!this.camera) return;

        const rect = container.getBoundingClientRect();
        this.aspect = rect.width / rect.height;
        
        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = this.aspect;
        } else if (this.camera.isOrthographicCamera) {
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
     * Cleans up camera resources.
     * Resets camera instance and initialization state.
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