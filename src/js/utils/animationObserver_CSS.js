/**
 * @description Universal class for observing visibility and animation state of DOM elements.
 * @param {Array<string|HTMLElement|Object>} targets - Array of selectors (strings), DOM elements, or objects with pseudo-element config
 * @param {function(string):void} [onActiveSectionChange] - Callback for active section change (optional).
 * @param {NodeList|Element[]} [sections] - Sections for section observer (optional, defaults to all <section>).
 */
export class AnimationObserverCSS {
    constructor(targets = [], onActiveSectionChange = null, sections = null) {
        this.targets = targets;
        this.onActiveSectionChange = onActiveSectionChange;
        this.observedElements = new Set();
        this.elements = [];
        this.pseudoElements = new Map();

        this.sections = Array.from(sections || document.querySelectorAll('section'));
        this.currentSection = '';

        this._initStyles();
        this.handleResize = this.handleResize.bind(this);

        this.init();
    }

    /**
     * @description Initialize required styles for animation control
     * @private
     * @returns {void}
     */
    _initStyles() {
        const styleId = 'animation-observer-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .animation-paused-before::before {
                    animation: none !important;
                }
                .animation-paused-after::after {
                    animation: none !important;
                }
                .animation-paused {
                    animation-play-state: paused !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * @description Initializes the observer: collects elements, sets up IntersectionObserver, MutationObserver, and section observer.
     * @returns {void}
     */
    init() {
        this.collectElements();
        this.setupIntersectionObserver();
        this.setupMutationObserver();
        this.setupSectionObserver();

        window.addEventListener('resize', this.handleResize);
    }

    /**
     * @description Collects all elements to be observed based on selectors or direct DOM elements.
     * @description Now supports pseudo-element configurations.
     * @returns {void}
     */
    collectElements() {
        let elements = [];
        this.targets.forEach(target => {
            if (typeof target === 'string') {
                elements.push(...document.querySelectorAll(target));
            } else if (target instanceof HTMLElement) {
                elements.push(target);
            } else if (typeof target === 'object' && target.selector) {
                // Handle pseudo-element configuration
                const els = document.querySelectorAll(target.selector);
                els.forEach(el => {
                    elements.push(el);
                    if (target.pseudo) {
                        this.pseudoElements.set(el, target.pseudo);
                    }
                });
            }
        });
        this.elements = Array.from(new Set(elements));
    }

    /**
     * @description Sets up IntersectionObserver for all tracked elements to pause/resume animation based on visibility.
     * @returns {void}
     */
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(this.handleIntersect.bind(this), {
            threshold: 0.1,
            rootMargin: '50px'
        });
        this.elements.forEach(el => this.intersectionObserver.observe(el));
    }

    /**
     * @description Handles IntersectionObserver events for tracked elements.
     * @param {IntersectionObserverEntry[]} entries
     * @returns {void}
     */
    handleIntersect(entries) {
        entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting) {
                this.startAnimation(el);
            } else {
                this.pauseAnimation(el);
            }
        });
    }

    /**
     * @description Sets animation state to running for the element and its pseudo-elements if configured
     * @param {HTMLElement} el
     * @returns {void}
     */
    startAnimation(el) {
        if (this.pseudoElements.has(el)) {
            const pseudo = this.pseudoElements.get(el);
            el.classList.remove(`animation-paused-${pseudo}`);
        } else {
            el.style.animationPlayState = 'running';
            el.classList.remove('animation-paused');
        }
        el.setAttribute('data-animation-paused', 'false');
    }

    /**
     * @description Sets animation state to paused for the element and its pseudo-elements if configured
     * @param {HTMLElement} el
     * @returns {void}
     */
    pauseAnimation(el) {
        if (this.pseudoElements.has(el)) {
            const pseudo = this.pseudoElements.get(el);
            el.classList.add(`animation-paused-${pseudo}`);
        } else {
            el.style.animationPlayState = 'paused';
            el.classList.add('animation-paused');
        }
        el.setAttribute('data-animation-paused', 'true');
    }

    /**
     * @description Sets up MutationObserver to track new elements added to the DOM that match the tracked selectors.
     * @returns {void}
     */
    setupMutationObserver() {
        this.mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        this.targets.forEach(target => {
                            if (typeof target === 'string' && node.matches(target)) {
                                this.intersectionObserver.observe(node);
                                this.elements.push(node);
                            }
                        });
                    }
                });
            });
        });
        this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * @description Sets up IntersectionObserver for sections to track which section is currently active (for navigation highlighting).
     * @returns {void}
     */
    setupSectionObserver() {
        this.sectionObserver = new IntersectionObserver(this.handleSectionIntersect.bind(this), {
            threshold: 0.3 // Can be adjusted
        });
        this.sections.forEach(section => this.sectionObserver.observe(section));
    }

    /**
     * @description Handles IntersectionObserver events for sections, determines the most visible section and triggers callback.
     * @param {IntersectionObserverEntry[]} entries
     * @returns {void}
     */
    handleSectionIntersect(entries) {
        let maxRatio = 0;
        let activeId = '';
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                activeId = entry.target.getAttribute('id');
            }
        });
        if (activeId && activeId !== this.currentSection) {
            this.currentSection = activeId;
            if (typeof this.onActiveSectionChange === 'function') {
                this.onActiveSectionChange(activeId);
            }
        }
    }

    /**
     * @description Handles window resize events to clean up and reinitialize observers.
     * @returns {void}
     */
    handleResize() {
        this.cleanupObservers();
        this.collectElements();
        this.setupIntersectionObserver();
        this.setupSectionObserver();
    }

    /**
     * @description Cleans up all observers.
     * @returns {void}
     */
    cleanupObservers() {
        if (this.intersectionObserver) this.intersectionObserver.disconnect();
        if (this.sectionObserver) this.sectionObserver.disconnect();
    }

    /**
     * @description Disposes of all observers.
     * @returns {void}
     */
    dispose() {
        window.removeEventListener('resize', this.handleResize);
        this.cleanupObservers();
        if (this.mutationObserver) this.mutationObserver.disconnect();
    }
}

export default AnimationObserverCSS;