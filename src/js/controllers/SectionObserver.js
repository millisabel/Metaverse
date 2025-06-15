/**
 * @description SectionObserver class
 * @param {string} containerId - The ID of the container element
 * @returns {SectionObserver}
 */
export class SectionObserver {
    constructor(containerId) {
        this.container = this.getContainer(containerId);

        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;
        this.resizeTimeout = null;
        this.observer = null;
        this.sectionInitTimeout = null;
        this.sectionCleanupTimeout = null;

        this.init();
    }

    /**
     * @description Initialize the base setup
     * @returns {void}
     */
    init() {
        this._initResizeHandler();
        this._initVisibilityObserver();
    }

    /**
     * @description Initialize resize handler to manage window resize events
     * @returns {void}
     */
    _initResizeHandler() {
        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                if (this.isVisible) {
                    this.onResize();
                    setTimeout(() => {
                        if (!this.isResizing) {}
                    }, 200);
                }
            }, 300);
        });
    }

    /**
     * @description Initialize visibility observer to handle element visibility changes
     * @returns {void}
     */
    _initVisibilityObserver() {
        this.observer = new IntersectionObserver(async (entries) => {
            entries.forEach(async (entry) => {
                this.isVisible = entry.isIntersecting;

                if (!this.isVisible) {
                    if (this.sectionInitTimeout) clearTimeout(this.sectionInitTimeout);
                    this.sectionCleanupTimeout = setTimeout(() => {
                        this.cleanup();
                    }, 200); // debounce cleanup
                } else {
                    if (this.sectionCleanupTimeout) clearTimeout(this.sectionCleanupTimeout);
                    if (!this.initialized) {
                        this.sectionInitTimeout = setTimeout(async () => {
                            await this.initSection();
                        }, 200); // debounce initSection
                    }
                    if (!this.isResizing) {
                        this.update();
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        this.observer.observe(this.container);
    }

    /**
     * @description Handle resize event
     * @returns {void}
     */
    onResize() {
        throw new Error('onResize must be implemented by subclass');
    }

    /**
     * @description Update scene for animation frame
     * @returns {void}
     */
    update() {
        throw new Error('update must be implemented by subclass');
    }

    /**
     * @description Clean up all resources
     * @param {string} logMessage - Message to log
     * @returns {void}
     */
    cleanup() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        this.initialized = false;
        this.isVisible = false;
        this.isResizing = false;
    }
} 