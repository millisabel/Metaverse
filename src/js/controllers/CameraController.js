import * as THREE from 'three';

import { deepMergeOptions, getAspectRatio } from '../utils/utils';

const DEFAULT_CAMERA_OPTIONS = {
    type: 'perspective',
    fov: 45,
    near: 0.1,
    far: 2000,
    aspect: null,
    zoom: 1,
    position: { x: 0, y: 0, z: 5 },
    lookAt: { x: 0, y: 0, z: 0 },
    rotation: false,
    speed: { x: 0, y: 0, z: 0 },
    orthoSize: 10,
    left: -5,
    right: 5,
    top: 5,
    bottom: -5,
};

/**
 * @description Camera controller
 * @param {Object} customOptions - Custom options
 * @returns {void}
 */
export class CameraController {
    /**
     * @param {Object} customOptions - Custom camera options
     */
    constructor(customOptions = {}) {
        this.options = deepMergeOptions(DEFAULT_CAMERA_OPTIONS, customOptions);
        this.camera = null;
        this.aspect = null;
        this._updaters = {
            position: this._updatePosition.bind(this),
            lookAt: this._updateLookAt.bind(this),
            zoom: this._updateZoom.bind(this),
            fov: this._updateFov.bind(this),
            near: this._updateNear.bind(this),
            far: this._updateFar.bind(this),
            rotation: this._updateRotation.bind(this),
            left: this._updateOrthoBounds.bind(this),
            right: this._updateOrthoBounds.bind(this),
            top: this._updateOrthoBounds.bind(this),
            bottom: this._updateOrthoBounds.bind(this),
            orthoSize: this._updateOrthoBounds.bind(this),
        };
    }

    /**
     * Initializes the camera with container dimensions.
     * @param {HTMLElement} container
     * @returns {THREE.Camera}
     */
    init(container) {
        if (this.isInitialized) return;
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('Valid container element is required for camera initialization');
        }
        try {
            this.aspect = getAspectRatio(container);
            this._initCameraByType();
            this._applyCameraSettings();
            this.isInitialized = true;
        } catch (error) {
            throw new Error('Camera initialization failed');
        }

        return this.camera;
    }

    /**
     * Универсальное обновление камеры по всем опциям
     * @public
     */
    update() {
        if (!this.camera) return;
        
        for (const [key, value] of Object.entries(this.options)) {
            if (this._updaters[key]) {
                this._updaters[key](value);
            }
        }
    }

    /**
     * @param {HTMLElement} container
     */
    onResize(container) {
        if (!this.camera) return;
        this.aspect = getAspectRatio(container);
        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = this.aspect;
        } else if (this.camera.isOrthographicCamera) {
            this.options.aspect = this.aspect;
            this._updateOrthoBounds();
        }
        this.camera.updateProjectionMatrix();
    }

    cleanup(message) {
        let logMessage = message || '';
        if (this.camera) {
            this.camera = null;
            this.isInitialized = false;
        }
        logMessage += `CameraController: this.camera ${this.camera}\n + CameraController: this.isInitialized: ${this.isInitialized}\n`;
        return logMessage;
    }

    _initCameraByType() {
        let { type } = this.options;
        if (!type) type = 'perspective';
        switch (type) {
            case 'orthographic':
                this._initOrthoCamera();
                break;
            case 'perspective':
            default:
                this._initPerspectiveCamera();
        }
    }

    _initPerspectiveCamera() {
        const { fov, aspect, near, far } = this.options;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    }

    _initOrthoCamera() {
        const { orthoSize, aspect, near, far } = this.options;
        
        const width = orthoSize * (aspect || 1);
        const height = orthoSize;
        const left = -width / 2;
        const right = width / 2;
        const top = height / 2;
        const bottom = -height / 2;
        this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    }

    _applyCameraSettings() {
        if (this.options.position) this._updatePosition(this.options.position);
        if (this.options.lookAt) this._updateLookAt(this.options.lookAt);
        if (this.options.zoom) this._updateZoom(this.options.zoom);
        if (this.options.fov && this.camera?.isPerspectiveCamera) this._updateFov(this.options.fov);
        if (this.options.near) this._updateNear(this.options.near);
        if (this.options.far) this._updateFar(this.options.far);
        if (this.options.rotation) this._updateRotation(this.options.rotation);
        if (this.camera?.isOrthographicCamera) this._updateOrthoBounds();
    }

    _updatePosition(position) {
        if (!this.camera) return;
        Object.entries(position).forEach(([axis, value]) => {
            this.camera.position[axis] = value;
        });
    }
    _updateLookAt(lookAt) {
        if (!this.camera || this.camera.rotation) return;
        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    }
    _updateZoom(zoom) {
        if (!this.camera) return;
        this.camera.zoom = zoom;
        this.camera.updateProjectionMatrix();
    }
    _updateFov(fov) {
        if (!this.camera || !this.camera.isPerspectiveCamera) return;
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }
    _updateNear(near) {
        if (!this.camera) return;
        this.camera.near = near;
        this.camera.updateProjectionMatrix();
    }
    _updateFar(far) {
        if (!this.camera) return;
        this.camera.far = far;
        this.camera.updateProjectionMatrix();
    }
    _updateRotation(rotation) {
        if (!this.camera) return;
        if (rotation === true && this.options.speed) {
            this.camera.rotation.x += this.options.speed.x || 0;
            this.camera.rotation.y += this.options.speed.y || 0;
            this.camera.rotation.z += this.options.speed.z || 0;
        }  
    }

    _updateOrthoBounds() {
        if (!this.camera || !this.camera.isOrthographicCamera) return;
        const { orthoSize, aspect, left, right, top, bottom } = this.options;

        if (typeof left === 'number' && typeof right === 'number' && typeof top === 'number' && typeof bottom === 'number') {
            this.camera.left = left;
            this.camera.right = right;
            this.camera.top = top;
            this.camera.bottom = bottom;
        } else {
            const w = orthoSize * (aspect || 1);
            const h = orthoSize;
            this.camera.left = -w / 2;
            this.camera.right = w / 2;
            this.camera.top = h / 2;
            this.camera.bottom = -h / 2;
        }
        this.camera.updateProjectionMatrix();
    }

    /**
     * @description Resets camera position, lookAt, and zoom.
     * @private
     * @returns {void}
     */
    resetCamera() {
        this._updatePosition(this.options.position);
        this._updateLookAt(this.options.lookAt);
        this._updateZoom(this.options.zoom);
    }
} 