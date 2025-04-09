/**
 * Базовый класс для управления анимацией 3D объектов
 * Обеспечивает контроль видимости и обработку ресайза
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
                    // Добавляем дополнительную задержку перед запуском анимации
                    setTimeout(() => {
                        if (!this.isResizing) {
                            this.animate();
                        }
                    }, 200);
                }
            }, 300); // Увеличиваем время ожидания завершения ресайза
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

    cleanup() {
        console.log(`[${this.name}] Starting cleanup`);
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