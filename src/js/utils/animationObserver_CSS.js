import {createLogger, Logger} from "./logger";

export class AnimationObserverCSS {
    constructor() {
        this.observedElements = new Map();
        this.observer = null;
        this.intersectionObserver = null;
        this.initialized = false;
        this.debug = false;

        this.logger = createLogger('AnimationObserverCSS');

        const style = document.createElement('style');
        style.textContent = `
            [data-animation-paused="true"] {
                animation-play-state: paused !important;
            }
        `;
        document.head.appendChild(style);
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupMutationObserver();
        this.initializeElements();
    }

    initializeElements() {
        requestAnimationFrame(() => {
            document.querySelectorAll('*').forEach(element => {
                this.checkElement(element);
            });
            this.initialized = true;
        });
    }

    checkElement(element) {
        if (element.hasAttribute('data-aos')) return;

        const styles = [
            window.getComputedStyle(element),
            window.getComputedStyle(element, ':before'),
            window.getComputedStyle(element, ':after')
        ];

        styles.forEach((style, index) => {
            if (this.hasAnimation(style)) {

                const animationData = {
                    element,
                    pseudoElement: index === 0 ? null : index === 1 ? ':before' : ':after',
                    animation: {
                        name: style.animationName,
                        duration: style.animationDuration,
                        delay: style.animationDelay
                    }
                };

                this.trackAnimation(animationData);
                this.pauseAnimation(element);
                this.intersectionObserver.observe(element);
            }
        });
    }

    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const element = entry.target;
                    const isVisible = entry.isIntersecting;

                    // First change the animation state
                    if (isVisible) {
                        this.startAnimation(element);
                        element.style.willChange = 'transform, opacity';
                    } else {
                        this.pauseAnimation(element);
                        element.style.willChange = 'auto';
                    }

                    const isPaused = element.getAttribute('data-animation-paused') === 'true';

                    this.logger.log(element,
                        {
                            conditions: [
                                 isVisible ? 'visible' : 'hidden',
                                 isPaused ? 'paused' : 'running'],
                            trackType: [ 'animation'],
                            functionName: 'setupIntersectionObserver',
                        }
                    );
                });
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            this.checkElement(node);
                            node.querySelectorAll('*').forEach(child => this.checkElement(child));
                        }
                    });
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    hasAnimation(style) {
        return style.animationName !== 'none' &&
            style.animationDuration !== '0s' &&
            style.animationName !== '';
    }

    trackAnimation(animationData) {
        const { element } = animationData;
        this.observedElements.set(element, animationData);
    }

    startAnimation(element) {
        if (!this.initialized) return;
        element.style.animationPlayState = 'running';
        element.setAttribute('data-animation-paused', 'false');

        // this.logger.log('3',element,
        //     {
        //         conditions: [element.style.animationPlayState],
        //         trackType: [ 'animation'],
        //         functionName: 'startAnimation',
        //     }
        // );
    }

    pauseAnimation(element) {
        element.style.animationPlayState = 'paused';
        element.setAttribute('data-animation-paused', 'true');
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.observedElements.clear();
    }
}

export default AnimationObserverCSS;