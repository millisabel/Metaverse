/**
 * Universal function for creating animation observers
 * @param {Object} options - Settings for Intersection Observer
 * @param {number} [options.threshold=0.1] - Visibility threshold (0-1)
 * @param {number} [options.rootMargin='0px'] - Margin for the visibility area
 * @param {Function} [options.onEnter] - Callback when the element appears
 * @param {Function} [options.onLeave] - Callback when the element disappears
 * @param {Function} [options.onChange] - Callback when the element's visibility changes
 * @returns {Function} Function to add an observer to elements
 */
export const createAnimationObserver = ({
    threshold = 0.1,
    rootMargin = '0px',
    onEnter = null,
    onLeave = null,
    onChange = null
} = {}) => {
    // Add CSS for managing animation of elements and pseudo-elements
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        /* Base styles for all animated elements */
        [data-animation-state="hidden"] {
            opacity: 0;
            animation-play-state: paused !important;
        }
        
        [data-animation-state="visible"] {
            opacity: 1;
            animation-play-state: running !important;
        }

        /* Styles for pseudo-elements */
        [data-animation-state="hidden"]::before,
        [data-animation-state="hidden"]::after {
            opacity: 0 !important;
            animation-play-state: paused !important;
        }
        
        [data-animation-state="visible"]::before,
        [data-animation-state="visible"]::after {
            opacity: 1 !important;
            animation-play-state: running !important;
        }

        /* Support for AOS animations */
        [data-animation-state="visible"][data-aos] {
            transform: translate(0) !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(styleSheet);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const { isIntersecting, target } = entry;
            
            // Call the common callback when visibility changes
            if (onChange) {
                onChange(entry);
            }

            // Determine the current state
            const currentState = isIntersecting ? 'visible' : 'hidden';
            
            // Update the animation state
            target.dataset.animationState = currentState;

            // Dispatch a custom event
            const eventName = isIntersecting ? 'animationenter' : 'animationleave';
            const event = new CustomEvent(eventName, { 
                detail: { target, state: currentState }
            });
            target.dispatchEvent(event);

            // Call the corresponding callback
            if (isIntersecting && onEnter) {
                onEnter(target);
            } else if (!isIntersecting && onLeave) {
                onLeave(target);
            }
        });
    }, {
        threshold,
        rootMargin
    });

    /**
     * Adds an element under observation
     * @param {HTMLElement|string} element - Element or selector to find elements
     * @param {Object} [options] - Additional options for a specific element
     * @param {Object} [options.pseudoElements] - Settings for pseudo-elements
     * @param {boolean} [options.pseudoElements.before=false] - Animate ::before
     * @param {boolean} [options.pseudoElements.after=false] - Animate ::after
     * @param {Function} [options.onEnter] - Callback when the element appears
     * @param {Function} [options.onLeave] - Callback when the element disappears
     */
    const observe = (element, options = {}) => {
        const {
            pseudoElements = {
                before: false,
                after: false
            },
            onEnter: elementOnEnter,
            onLeave: elementOnLeave
        } = options;

        // If a selector is passed, find all elements
        const elements = typeof element === 'string' 
            ? document.querySelectorAll(element)
            : [element];

        elements.forEach(el => {
            // Initialize the animation state
            el.dataset.animationState = 'hidden';
            
            // If you need to animate pseudo-elements, add the corresponding attributes
            if (pseudoElements.before || pseudoElements.after) {
                el.dataset.hasPseudoAnimation = 'true';
                if (pseudoElements.before) el.dataset.animateBefore = 'true';
                if (pseudoElements.after) el.dataset.animateAfter = 'true';
            }
            
            // Add under observation
            observer.observe(el);

            // Add handlers for a specific element
            if (elementOnEnter) {
                el.addEventListener('animationenter', () => elementOnEnter(el));
            }
            if (elementOnLeave) {
                el.addEventListener('animationleave', () => elementOnLeave(el));
            }
        });
    };

    /**
     * Stops observing an element
     * @param {HTMLElement|string} element - Element or selector
     */
    const unobserve = (element) => {
        const elements = typeof element === 'string' 
            ? document.querySelectorAll(element)
            : [element];

        elements.forEach(el => {
            // Remove all data-attributes related to animation
            delete el.dataset.animationState;
            delete el.dataset.hasPseudoAnimation;
            delete el.dataset.animateBefore;
            delete el.dataset.animateAfter;
            
            observer.unobserve(el);
        });
    };

    /**
     * Disconnects the observer and removes the added styles
     */
    const disconnect = () => {
        observer.disconnect();
        // Remove the added styles
        if (styleSheet.parentNode) {
            styleSheet.parentNode.removeChild(styleSheet);
        }
    };

    return {
        observe,
        unobserve,
        disconnect
    };
};

/**
 * Initialization of animations for the roadmap section
 */
export const initRoadmapAnimations = () => {
    const roadmapObserver = createAnimationObserver({
        threshold: 0.1,
        rootMargin: '0px'
    });

    const roadmapElements = [
        '#roadmap',          // The entire section
        '.roadmap-quarter',  // Quarterly blocks
        '.roadmap-circle',   // Circles
        '.connection-lines circle' // Points on lines
    ];

    roadmapElements.forEach(selector => {
        roadmapObserver.observe(selector);
    });

    return roadmapObserver;
};

/**
 * Initialization of animations for dynamics cards
 */
export const initDynamicsAnimations = () => {
    const dynamicsObserver = createAnimationObserver({
        threshold: 0.2,
        rootMargin: '50px'
    });

    dynamicsObserver.observe('.card', {
        pseudoElements: {
            after: true // Animate only ::after pseudo-element
        }
    });

    return dynamicsObserver;
};

/**
 * Initialization of AOS animations
 */
export const initAosAnimations = () => {
    const aosObserver = createAnimationObserver({
        threshold: 0.1,
        rootMargin: '50px'
    });

    aosObserver.observe('[data-aos]');

    return aosObserver;
};

/**
 * Initialization of all animations
* @returns {Object} Object with observers for possible disabling
 */
export const initAllAnimations = () => {
    const observers = {
        roadmap: initRoadmapAnimations(),
        dynamics: initDynamicsAnimations(),
        aos: initAosAnimations()
    };

    return observers;
}; 