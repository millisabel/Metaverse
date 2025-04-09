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

        this.init();
    }

    init() {
        console.log('[AnimationController] Инициализация контроллера анимации');

        // Наблюдатель за видимостью
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('[AnimationController] Объект в зоне видимости');
                    this.isVisible = true;
                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    this.startAnimation();
                } else {
                    console.log('[AnimationController] Объект вне зоны видимости');
                    this.isVisible = false;
                    this.stopAnimation();
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);

        // Обработчик ресайза с дебаунсом
        window.addEventListener('resize', () => {
            console.log('[AnimationController] Начало ресайза');
            this.stopAnimation();

            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = setTimeout(() => {
                console.log('[AnimationController] Завершение ресайза');
                if (this.isVisible) {
                    this.onResize();
                    this.startAnimation();
                }
            }, 250);
        });
    }

    startAnimation() {
        if (!this.isVisible || this.animationFrameId) return;
        console.log('[AnimationController] Запуск анимации');
        this.animate();
    }

    stopAnimation() {
        if (this.animationFrameId) {
            console.log('[AnimationController] Остановка анимации');
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    cleanup() {
        console.log('[AnimationController] Очистка ресурсов');
        
        this.stopAnimation();
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        this.isInitialized = false;
        this.isVisible = false;
    }

    // Абстрактные методы, которые должны быть реализованы в дочерних классах
    initScene() {
        throw new Error('Метод initScene должен быть реализован в дочернем классе');
    }

    animate() {
        throw new Error('Метод animate должен быть реализован в дочернем классе');
    }

    onResize() {
        throw new Error('Метод onResize должен быть реализован в дочернем классе');
    }
} 