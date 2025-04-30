import {createLogger} from "../utils/logger";
import * as THREE from 'three';
import {createCanvas, updateRendererSize} from "../utilsThreeD/canvasUtils";
import { CameraController } from './cameraController';

/**
 * Basic class for managing the animation of 3D objects
 * Provides visibility control and resize handling
 */
export class AnimationController {
    constructor(container, options = {}) {
        this.container = container;
        this.isVisible = false;
        this.isInitialized = false;
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;
        this.isResizing = false;

        // Default options
        this.options = {
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            },
            ...options
        };

        this.name = 'AnimationController';
        this.logger = createLogger(this.name);

        // Initialize camera controller
        this.cameraController = new CameraController(options.camera);

        this.init();
    }

    init() {
        // Visibility observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.logger.log(`AnimationController: Object is visible`, {
                        conditions: ['visible'],
                        functionName: 'AnimationController: init'
                    });
                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.isVisible = false;
                    this.logger.log(`Object is not visible`, {
                        conditions: ['hidden'],
                        functionName: 'AnimationController: init'
                        }
                    );
                    this.stopAnimation();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);

        // Handle resize
        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.logger.log({
                    conditions: ['resize-started'],
                    functionName: 'AnimationController: init'
                });
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                this.logger.log( {
                    conditions: ['resize-completed'],
                    functionName: 'AnimationController: init'
                });
                if (this.isVisible) {
                    this.onResize();
                    // Add additional delay before starting animation
                    setTimeout(() => {
                        if (!this.isResizing) {
                            this.animate();
                        }
                    }, 200);
                }
            }, 300); // Increase the waiting time for the resize to complete
        });
    }

    initScene() {
        if (this.isInitialized) return;

        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'initScene'
        });

        // Create scene
        this.scene = new THREE.Scene();

        // Initialize camera
        this.cameraController.init(this.container);
        this.camera = this.cameraController.camera;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer(this.options.renderer);
        updateRendererSize(this.renderer, this.container, this.camera);
        this.container.appendChild(this.renderer.domElement);
        createCanvas(this.renderer, { zIndex: '2' });

        // Call setupScene for additional configuration
        this.setupScene();

        this.isInitialized = true;
    }

    setupScene() {
        // To be implemented by subclasses
    }

    onResize() {
        this.cameraController.onResize(this.container);
        updateRendererSize(this.renderer, this.container, this.camera);
    }

    canAnimate() {
        if (!this.isVisible) {
            this.logger.log('Object is hidden',  {
                conditions: ['hidden'],
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }

        if (this.isResizing) {
            this.logger.log('Object is resizing', {
                functionName: 'AnimationController: canAnimate',
                trackType: ['scroll'],
            });
            return false;
        }

        if (!this.isInitialized) {
            this.logger.log('Object is not initialized', {
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }

        return true;
    }

    animate() {
        if (!this.canAnimate()) {
            if (this.animationFrameId) {
                this.stopAnimation();
            }
            return;
        }

        this.update();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    stopAnimation() {
        if (this.animationFrameId) {
            const id = this.animationFrameId;
            this.logger.log(`Stopping animation - frame ID: ${this.animationFrameId}`, {
                conditions: ['paused'],
                functionName: 'AnimationController: stopAnimation'
            });
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.logger.log(`Animation frame ID ${id} is ${this.animationFrameId}`, {
                conditions: ['animation-frame-cleanup'],
                functionName: 'AnimationController: stopAnimation'
            });
        }
    }

    cleanup(renderer, scene) {
        this.logger.log(`Starting cleanup`);

        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
            renderer = null;
            this.logger.log(`Renderer disposed`);
        }

        if (scene) {
            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            scene = null;
            this.logger.log(`Scene disposed`);
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            this.logger.log(`Observer disconnected`);
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.logger.log(`Animation stopped`);
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
            this.logger.log(`Resize timeout cleared`);
        }

        if (this.cameraController) {
            this.cameraController.cleanup();
            this.cameraController = null;
            this.logger.log(`Camera controller cleaned up`);
        }

        this.isInitialized = false;
        this.isVisible = false;
        this.logger.log(`Cleanup completed`);
    }

    _getTimeAndAspect() {
        const rect = this.container.getBoundingClientRect();
        return {
            time: performance.now() * 0.0001,
            aspect: rect.width / rect.height,
            isMobile: rect.width < 768
        };
    }

    update() {
        // Base method update, which will be overridden in child classes
        throw new Error('update must be implemented by subclass');
    }
} 