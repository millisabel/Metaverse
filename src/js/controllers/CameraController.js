import * as THREE from 'three';

import { createLogger } from '../utils/logger';
import { mergeDefaultAndCustomOptions, getAspectRatio } from '../utils/utils';

const CAMERA_CONTROLS = {
    enableDamping: false,    
    dampingFactor: 0.05,    
    
    enableZoom: true,      
    enablePan: true,        
    enableRotate: true,     
    
    rotateSpeed: 1.0,        
    zoomSpeed: 1.0,        
    panSpeed: 1.0,          
    
    targetOffset: {       
        x: 0,
        y: 0,
        z: 0
    }
}

const DEFAULT_PERSPECTIVE_CAMERA_OPTIONS = {
    type: 'perspective',

    fov: 45,
    near: 0.1,
    far: 2000,
    aspect: null, 

    zoom: 1, 

    position: { x: 0, y: 0, z: 5 },
    lookAt: { x: 0, y: 0, z: 0 },

    rotation: false,
    speed: { x: 0.00002, y: 0.00002 }, 
    
    minDistance: 0,          // Минимальное расстояние до цели
    maxDistance: Infinity,   // Максимальное расстояние до цели
    minPolarAngle: 0,        // Минимальный угол наклона
    maxPolarAngle: Math.PI,  // Максимальный угол наклона
    minAzimuthAngle: -Infinity, // Минимальный угол азимута
    maxAzimuthAngle: Infinity,  // Максимальный угол азимута
}

const DEFAULT_ORTHOGRAPHIC_CAMERA_OPTIONS = {
    type: 'orthographic',

    orthoSize: 10,      
    left: -1,           
    right: 1,          
    top: 1,            
    bottom: -1,   

    minZoom: 0.1,            
    maxZoom: 10,             
    minPan: { x: -100, y: -100 },
    maxPan: { x: 100, y: 100 },   
}

/**
 * @description Camera controller
 * @param {Object} customOptions - Custom options
 * @returns {void}
 */
export class CameraController {
    constructor(customOptions = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.options = mergeDefaultAndCustomOptions(CAMERA_CONTROLS, customOptions);

        this.camera = null;
        this.aspect = null;
    }

    /**
     * @description Initializes the camera with container dimensions.
     * Creates a new THREE.PerspectiveCamera or THREE.OrthographicCamera and sets initial position and orientation.
     * @param {HTMLElement} container - Container element for calculating aspect ratio.
     * @public
     */
    init(container) {
        if (this.isInitialized) {
            this.logger.log('Camera already initialized', {
                functionName: 'init'
            });
            return;
        }

        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('Valid container element is required for camera initialization');
        }

        try {   
            this.aspect = getAspectRatio(container);
            this._initCameraByType();
            this._applyCameraSettings();

            this.isInitialized = true;

            this.logger.log('Camera initialized', {
                conditions: ['camera-initialized'],
                functionName: 'CameraController: init()',
                customData: {
                    camera: this.camera,
                    options: this.options,
                    aspect: this.aspect
                }
            });
        } catch (error) {
            throw new Error('Camera initialization failed');
        }

        return this.camera;
    }

    /**
     * @description Updates camera rotation based on speed settings.
     * @public
     * @returns {void}
     */
    update() {
        if (!this.camera) return;

        if (this.options.rotation) {
            this._updateRotation();
        }
    }

    /**
     * @description Handles container resize.
     * @param {HTMLElement} container - Container element for calculating new aspect ratio.
     * @public
     * @returns {void}
     */
    onResize(container) {
        if (!this.camera) return;
        this.aspect = getAspectRatio(container);

        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = this.aspect;
        } else if (this.camera.isOrthographicCamera) {
            this._setOrthoBounds();
        }

        this.camera.updateProjectionMatrix();

        this.logger.log('Camera resized', {
            conditions: ['resized'],
            functionName: 'CameraController: onResize',
            aspect: this.aspect
        });
    }

    /**
     * Cleans up camera resources.
     * Resets camera instance and initialization state.
     * @public
     */
    cleanup(message) {
        let logMessage = message || '';

        if (this.camera) {
            this.camera = null;
            this.isInitialized = false;
        }

        logMessage += `CameraController: this.camera ${this.camera}\n + 
        CameraController: this.isInitialized: ${this.isInitialized}\n`;

        return logMessage;
    }

    /**
     * @description Initializes camera based on its type
     * @private
     * @returns {void}
     */
    _initCameraByType() {
        let { type } = this.options;

        if (!type) {
            type = 'perspective';
        }
    
        switch (type) {
            case 'orthographic':
                this.options = mergeDefaultAndCustomOptions(DEFAULT_ORTHOGRAPHIC_CAMERA_OPTIONS, this.options);
                this._initOrthoCamera();
                break;
            case 'perspective':
                this.options = mergeDefaultAndCustomOptions(DEFAULT_PERSPECTIVE_CAMERA_OPTIONS, this.options);
                this._initPerspectiveCamera();
                break;
            default:
                throw new Error(`Unsupported camera type: ${type}`);
        }
    }

    /**
     * @description Initializes perspective camera
     * @private
     * @returns {void}
     */
    _initPerspectiveCamera() {
        const { fov, near, far } = this.options;
        
        this.camera = new THREE.PerspectiveCamera(
            fov,
            this.aspect,
            near,
            far
        );

        this.logger.log('Perspective camera initialized', {
            functionName: 'CameraController: _initPerspectiveCamera()',
            customData: {
                camera: this.camera
            }
        });
    }

    /**
     * @description Initializes orthographic camera
     * @private
     * @returns {void}
     */
    _initOrthoCamera() {
        const near = this.options.near !== undefined ? this.options.near : -1000;
        const far = this.options.far !== undefined ? this.options.far : 1000;
        this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, near, far);
        this._setOrthoBounds();

        this.logger.log('Orthographic camera initialized', {
            functionName: 'CameraController: _initOrthoCamera()',
            customData: {
                camera: this.camera
            }
        });
    }   

    /**
     * @description Applies camera settings (position, lookAt)
     * @private
     * @returns {void}
     */
    _applyCameraSettings() {
        if (this.options.position) {
            this.setPosition(this.options.position);
        }
    
        if (this.options.lookAt) {
            this.setLookAt(this.options.lookAt);
        }
    }

    /**
     * @description Sets orthographic camera bounds based on options and container rect
     * @private
     * @returns {void}
     */
    _setOrthoBounds() {
        const rect = this.container.getBoundingClientRect();

        this.camera.left = this.options.left !== undefined ? this.options.left : -rect.width / 2;
        this.camera.right = this.options.right !== undefined ? this.options.right : rect.width / 2;
        this.camera.top = this.options.top !== undefined ? this.options.top : rect.height / 2;
        this.camera.bottom = this.options.bottom !== undefined ? this.options.bottom : -rect.height / 2;
    }

    /**
     * @description Sets camera position.
     * @param {Object} position - Position coordinates {x, y, z}.
     * @public
     * @returns {void}
     */
    setPosition(position) {
        if (!this.camera) return;

        Object.entries(position).forEach(([axis, value]) => {
            this.camera.position[axis] = value;
        });
    }

    /**
     * @description Sets camera look-at point.
     * @param {Object} lookAt - Look-at coordinates {x, y, z}.
     * @private
     * @returns {void}
     */
    setLookAt(lookAt) {
        if (!this.camera) return;
        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    }

    /**
     * @description Sets camera zoom and updates projection matrix.
     * @param {number} zoom - New zoom value.
     * @private
     * @returns {void}
     */
    _setZoom(zoom) {
        if (!this.camera) return;
        this.camera.zoom = zoom;
        this.camera.updateProjectionMatrix();
    }

    /**
     * @description Resets camera position, lookAt, and zoom.
     * @private
     * @returns {void}
     */
    resetCamera() {
        this.setPosition(this.options.position);
        this.setLookAt(this.options.lookAt);
        this._setZoom(this.options.zoom);
    }

    /**
     * @description Updates camera rotation based on speed settings.
     * Only applies if rotation is enabled in options.
     * @private
     * @returns {void}
     */
    _updateRotation() {
        if (!this.camera || !this.options.rotation) return;

        this.camera.rotation.x += this.options.speed.x;
        this.camera.rotation.y += this.options.speed.y;
    }
} 