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
        this.name = 'AnimationController';
        this.isResizing = false;

        console.log(`[${this.name}] Initializing controller`);
        this.init();
    }

    init() {
        // Visibility observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    console.log(`[${this.name}] Object is visible`);
                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    if (!this.isResizing) {
                        this.animate();
                    }
                } else {
                    this.isVisible = false;
                    console.log(`[${this.name}] Object is not visible`);
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
                console.log(`[${this.name}] Resize started`);
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                console.log(`[${this.name}] Resize completed`);
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

    animate() {
        if (!this.animationFrameId) {
            console.log(`[${this.name}] Starting animation`);
        }
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    stopAnimation() {
        if (this.animationFrameId) {
            console.log(`[${this.name}] Stopping animation`);
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    cleanup(renderer, scene) {
        console.log(`[${this.name}] Starting cleanup`);


        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
            renderer = null;
            console.log(`[${this.name}] Renderer disposed`);
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
            console.log(`[${this.name}] Scene disposed`);
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            console.log(`[${this.name}] Observer disconnected`);
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log(`[${this.name}] Animation stopped`);
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
            console.log(`[${this.name}] Resize timeout cleared`);
        }

        this.isInitialized = false;
        this.isVisible = false;
        console.log(`[${this.name}] Cleanup completed`);
    }

    // Abstract methods to be implemented by subclasses
    initScene() {
        throw new Error('initScene must be implemented by subclass');
    }

    onResize() {
        throw new Error('onResize must be implemented by subclass');
    }
} 