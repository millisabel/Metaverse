import {createLogger} from "./logger";

/**
 * Basic class for managing the animation of 3D objects
 * Provides visibility control and resize handling
 */
export class AnimationController {
    constructor(container) {
        this.container = container;
        this.isVisible = false;
        this.isInitialized = false;
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.observer = null;
        this.isResizing = false;

        this.name = 'AnimationController';
        this.logger = createLogger(this.name);
        this.logger.log('Initializing controller');

        this.init();
    }

    init() {
        // Visibility observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.logger.log(`Object is visible`);
                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.isVisible = false;
                    this.logger.log(`Object is not visible`);
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
                this.logger.log(`Resize started`);
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                this.logger.log(`Resize completed`);
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

    canAnimate() {
        if (!this.isVisible) {
            this.logger.log('Object is not visible', 'debug');
            return false;
        }

        if (this.isResizing) {
            this.logger.log('Object is resizing', 'debug');
            return false;
        }

        if (!this.isInitialized) {
            this.logger.log('Object is not initialized', 'debug');
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

        if (!this.animationFrameId) {
            this.logger.log('Starting animation');
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    stopAnimation() {
        if (this.animationFrameId) {
            const id = this.animationFrameId;
            this.logger.log(`Stopping animation - frame ID: ${this.animationFrameId}`);
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.logger.log(`Animation frame ID ${id} is ${this.animationFrameId}`);
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

        this.isInitialized = false;
        this.isVisible = false;
        this.logger.log(`this.logger.logCleanup completed`);
    }

    // Abstract methods to be implemented by subclasses
    initScene() {
        throw new Error('initScene must be implemented by subclass');
    }

    onResize() {
        throw new Error('onResize must be implemented by subclass');
    }
} 