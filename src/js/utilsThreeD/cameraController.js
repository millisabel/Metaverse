import * as THREE from 'three';
import { createLogger } from '../utils/logger';

export class CameraController {
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

    init(container) {
        if (this.isInitialized) return;

        this.logger.log('Initializing camera', {
            conditions: ['initializing-camera'],
            functionName: 'init'
        });

        // Calculate aspect ratio
        const rect = container.getBoundingClientRect();
        this.aspect = rect.width / rect.height;

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            this.options.fov,
            this.aspect,
            this.options.near,
            this.options.far
        );

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

    setLookAt(lookAt) {
        if (!this.camera) return;

        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

        this.logger.log('Camera lookAt updated', {
            conditions: ['lookAt-updated'],
            functionName: 'setLookAt',
            lookAt
        });
    }

    updateRotation() {
        if (!this.camera || !this.options.rotation) return;

        this.camera.rotation.x += this.options.speed.x;
        this.camera.rotation.y += this.options.speed.y;

        this.logger.log('Camera rotation updated', {
            conditions: ['rotation-updated'],
            functionName: 'updateRotation'
        });
    }

    onResize(container) {
        if (!this.camera) return;

        const rect = container.getBoundingClientRect();
        this.aspect = rect.width / rect.height;
        
        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();

        this.logger.log('Camera resized', {
            conditions: ['resized'],
            functionName: 'onResize',
            aspect: this.aspect
        });
    }

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