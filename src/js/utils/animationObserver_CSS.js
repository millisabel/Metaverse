import {createLogger} from "./logger";

/**
 * AnimationObserverCSS
 *
 * Universal class for observing visibility and animation state of DOM elements.
 * - Accepts an array of selectors (strings) or DOM elements to track CSS animations.
 * - Pauses animation when elements are out of viewport, resumes when visible.
 * - Supports dynamic DOM changes via MutationObserver.
 * - Can track active sections for navigation highlighting (e.g., navbar).
 *
 * @class
 * @example
 * new AnimationObserverCSS([
 *   '.star', '.game-character--badge'
 * ], (activeSectionId) => {
 *   // Highlight nav link logic
 * });
 */
export class AnimationObserverCSS {
    /**
     * @constructor
     * @param {Array<string|HTMLElement>} targets - Array of selectors (strings) or DOM elements to observe for animation.
     * @param {function(string):void} [onActiveSectionChange] - Callback for active section change (optional).
     * @param {NodeList|Element[]} [sections] - Sections for section observer (optional, defaults to all <section>).
     */
    constructor(targets = [], onActiveSectionChange = null, sections = null) {
        /** @type {string} */
        this.name = 'AnimationObserverCSS';
        /** @type {ReturnType<typeof createLogger>} */
        this.logger = createLogger(this.name);

        /** @type {Array<string|HTMLElement>} */
        this.targets = targets;
        /** @type {function(string):void|null} */
        this.onActiveSectionChange = onActiveSectionChange;
        /** @type {Set<HTMLElement>} */
        this.observedElements = new Set();
        /** @type {HTMLElement[]} */
        this.elements = [];

        /** @type {HTMLElement[]} */
        this.sections = Array.from(sections || document.querySelectorAll('section'));
        /** @type {string} */
        this.currentSection = '';

        this.handleResize = this.handleResize.bind(this);

        this.init();
    }

    /**
     * Initializes the observer: collects elements, sets up IntersectionObserver, MutationObserver, and section observer.
     */
    init() {
        this.collectElements();
        this.setupIntersectionObserver();
        this.setupMutationObserver();
        this.setupSectionObserver();

        window.addEventListener('resize', this.handleResize);

        this.logger.log({
            conditions: ['init'],
            functionName: 'init'
        });
        this.logger.log(this.targets, {
            type: 'success',
            conditions: ['init'],
            functionName: 'init',
            customData: {
                elements: this.elements
            }
        });
    }

    /**
     * Collects all elements to be observed based on selectors or direct DOM elements.
     * Removes duplicates.
     */
    collectElements() {
        let elements = [];
        this.targets.forEach(target => {
            if (typeof target === 'string') {
                elements.push(...document.querySelectorAll(target));
            } else if (target instanceof HTMLElement) {
                elements.push(target);
            }
        });
        this.elements = Array.from(new Set(elements));
    }

    /**
     * Sets up IntersectionObserver for all tracked elements to pause/resume animation based on visibility.
     */
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(this.handleIntersect.bind(this), {
            threshold: 0.1,
            rootMargin: '50px'
        });
        this.elements.forEach(el => this.intersectionObserver.observe(el));
    }

    /**
     * Handles IntersectionObserver events for tracked elements.
     * @param {IntersectionObserverEntry[]} entries
     */
    handleIntersect(entries) {
        entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting) {
                this.startAnimation(el);
                this.logger.log(el, { 
                    conditions: ['visible', 'running'], 
                    functionName: 'handleIntersect' 
                });
            } else {
                this.pauseAnimation(el);
                this.logger.log(el, { 
                    conditions: ['hidden', 'paused'], 
                    functionName: 'handleIntersect' 
                });
            }
        });
    }

    /**
     * Sets animation state to running for the element.
     * @param {HTMLElement} el
     */
    startAnimation(el) {
        el.style.animationPlayState = 'running';
        el.setAttribute('data-animation-paused', 'false');
    }

    /**
     * Sets animation state to paused for the element.
     * @param {HTMLElement} el
     */
    pauseAnimation(el) {
        el.style.animationPlayState = 'paused';
        el.setAttribute('data-animation-paused', 'true');
    }

    /**
     * Sets up MutationObserver to track new elements added to the DOM that match the tracked selectors.
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
     * Sets up IntersectionObserver for sections to track which section is currently active (for navigation highlighting).
     */
    setupSectionObserver() {
        this.sectionObserver = new IntersectionObserver(this.handleSectionIntersect.bind(this), {
            threshold: 0.3 // Can be adjusted
        });
        this.sections.forEach(section => this.sectionObserver.observe(section));
    }

    /**
     * Handles IntersectionObserver events for sections, determines the most visible section and triggers callback.
     * @param {IntersectionObserverEntry[]} entries
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
            this.logger.log({
                conditions: ['active-section'],
                functionName: 'handleSectionIntersect',
                customData: { activeId }
            });
            if (typeof this.onActiveSectionChange === 'function') {
                this.onActiveSectionChange(activeId);
            }
        }
    }

    /**
     * Handles window resize events to clean up and reinitialize observers.
     */
    handleResize() {
        this.cleanupObservers();
        this.collectElements();
        this.setupIntersectionObserver();
        this.setupSectionObserver();
        this.logger.log({ conditions: ['resize'], functionName: 'handleResize' });
    }

    /**
     * Cleans up all observers.
     */
    cleanupObservers() {
        if (this.intersectionObserver) this.intersectionObserver.disconnect();
        if (this.sectionObserver) this.sectionObserver.disconnect();
    }

    /**
     * Disposes of all observers.
     */
    dispose() {
        window.removeEventListener('resize', this.handleResize);
        this.cleanupObservers();
        if (this.mutationObserver) this.mutationObserver.disconnect();
    }
}

export default AnimationObserverCSS;