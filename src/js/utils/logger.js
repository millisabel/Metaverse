/* eslint-disable */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/ban-types */
// This is a JavaScript file, not TypeScript
// logger.js

/**
 * Enhanced Console Logger Utility
 *
 * A utility class for styled console logging with support for grouping,
 * element states, and DOM element inspection.
 *
 * Features:
 * - Color-coded component logging
 * - Message types with icons (info, success, warning, error, debug)
 * - Element state tracking (visible, hidden, running, paused)
 * - DOM element inspection
 * - Grouped logging
 * - Global and per-component logging control
 *
 * Basic Usage:
 * ```javascript
 * import { createLogger } from './utils/logger';
 *
 * // Create logger instance
 * const logger = createLogger('MyComponent');
 *
 * // Simple message
 * logger.log('Hello world');
 *
 * // With message type
 * logger.log('Operation successful', { type: 'success' });
 *
 * // With DOM element
 * logger.log('Button clicked', buttonElement);
 *
 * // With element states
 * logger.log('Animation state', {
 *   conditions: ['running', 'visible']
 * });
 *
 * // With custom text color
 * logger.log('Custom styled', {
 *   styles: {
 *     messageTextColor: '#af274b'
 *   }
 * });
 *
 * // Complex logging
 * logger.log('Element updated', domElement, {
 *   type: 'success',
 *   conditions: ['visible', isPaused ? 'paused' : 'running'],
 *   styles: { messageTextColor: '#35af27',
 *             headerBackground: '#af274b', }
 * });
 *
 * // With function name and track type
 * logger.log('Animation started', element, {
 *   type: 'info',
 *   conditions: ['running'],
 *   functionName: 'startAnimation',
 *   trackType: 'animation'
 * });
 *
 * // With multiple track types
 * logger.log('Element state changed', element, {
 *   type: 'warning',
 *   conditions: ['visible', 'running'],
 *   trackType: ['animation', 'scroll']
 * });
 * ```
 *
 * Logging Control:
 *
 * ```javascript
 * import { Logger } from './utils/logger';
 *
 * // Global control
 * Logger.enableGlobalLogging();
 * Logger.disableGlobalLogging();
 *
 * // Component-specific control
 * Logger.enableLoggerFor('MyComponent');
 * Logger.disableLoggerFor('MyComponent');
 * ```
 *
 * Style Caching:
 *
 * ```javascript
 * // Caching styles for performance optimization
 * const logger = createLogger('MyComponent');
 *
 * // Styles are automatically cached when first used
 * logger.log('Message with custom style', {
 *   styles: {
 *     messageTextColor: '#af274b'
 *   }
 * });
 *
 * // When the same styles are reused, they are taken from the cache
 * logger.log('Another message', {
 *   styles: {
 *     messageTextColor: '#af274b'
 *   }
 * });
 *
 * // Cache management
 * Logger.clearStyleCache();      // Clearing the style cache
 * Logger.getStyleCacheSize();    // Getting the size of the cache
 * ```
 *
 * Features:
 * - Automatic caching of generated styles
 * - Unique cache keys based on style parameters
 * - Methods for cache management (clearStyleCache, getStyleCacheSize)
 * - Optimization for frequent calls with the same styles
 * @module Logger */

export class Logger {
    static componentColors = new Map();
    static enabledLoggers = new Set();
    static disabledLoggers = new Set();
    static globalLoggingEnabled = false;
    static instances = new Map();
    static styleCache = new Map();

    static messageTypes = {
        info: {
            icon: '',
            style: {
                background: 'transparent',
                color: '#666666',
            },
        },
        success: {
            icon: '✅',
            style: {
                background: '#08c108',
                color: '#08c108',
            },
        },
        warning: {
            icon: '⚠️',
            style: {
                background: '#edda0b',
                color: '#FFA500',
            },
        },
        error: {
            icon: '❌',
            style: {
                background: '#d61313',
                color: '#d61313',
            },
        },
        debug: {
            icon: '🔍',
            style: {
                background: 'rgba(5,5,5,0.2)',
                color: '#666666',
            },
        },
    };
    static elementStates = {
        visible: {
            icon: '💡',
            style: {
                background: 'rgba(31,126,10,0.5)',
                color: '#666666',
            },
        },
        hidden: {
            icon: '👻',
            style: {
                background: 'rgba(91,21,177,0.1)',
                color: '#666666',
            },
        },
        running: {
            icon: '▶️',
            style: {
                background: 'rgba(10,112,175,0.5)',
                color: '#666666',
            },
        },
        paused: {
            icon: '⏸️',
            style: {
                background: 'rgba(195,130,11,0.2)',
                color: '#666666',
            },
        },
    };
    static styleConfig = {
        base: {
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'normal',
        },
        header: {
            fontWeight: 'bold',
            borderBottom: '1px solid #666666',
            background: 'transparent',
        },
        text: {
            color: '#666666',
        },
        elementInfo: {
            color: '#666666',
            fontStyle: 'italic',
            borderBottom: '1px dotted #666666',
        },
        group: {
            padding: '6px 12px',
            fontSize: '12px',
        },
    };
    static TrackType = {
        ANIMATION: 'animation',
        SCROLL: 'scroll',
        RESIZE: 'resize',
    };

    static enableGlobalLogging() {
        this.globalLoggingEnabled = true;
        this.enabledLoggers.clear();
        this.disabledLoggers.clear();

        this.instances.forEach((_, name) => {
            this.enabledLoggers.add(name);
        });
    }

    static disableGlobalLogging() {
        this.globalLoggingEnabled = false;
        this.enabledLoggers.clear();
        this.disabledLoggers.clear();
    }

    static enableLoggerFor(name) {
        this.disabledLoggers.delete(name);
        if (this.globalLoggingEnabled) {
            this.enabledLoggers.add(name);
        } else {
            this.enabledLoggers.clear();
            this.enabledLoggers.add(name);
        }
    }

    static disableLoggerFor(name) {
        this.disabledLoggers.add(name);
        this.enabledLoggers.delete(name);
    }

    static isLoggerEnabled(name) {
        if (this.disabledLoggers.has(name)) return false;
        if (this.globalLoggingEnabled) return true;
        return this.enabledLoggers.has(name);
    }


    static generateRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 30) + 70;
        const lightness = Math.floor(Math.random() * 20) + 45;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    static getComponentColor(name) {
        if (!this.componentColors.has(name)) {
            const color = this.generateRandomColor();
            this.componentColors.set(name, color);
        }
        return this.componentColors.get(name);
    }

    static generateStyle(options = {}) {
        const cacheKey = JSON.stringify(options);

        if (this.styleCache.has(cacheKey)) {
            return this.styleCache.get(cacheKey);
        }

        const {
            type = 'base',
            background,
            color,
            borderBottom,
            fontWeight,
            customStyles = {},
        } = options;

        const styles = {};

        // 1. Base styles
        Object.assign(styles, this.styleConfig.base);

        // 2. Type styles
        if (type && this.styleConfig[type]) {
            Object.assign(styles, this.styleConfig[type]);
        }

        // 3. User styles
        Object.assign(styles, customStyles);

        // 4. Explicitly passed styles with undefined check
        if (background !== undefined) styles.background = background;
        if (color !== undefined) styles.color = color;
        if (borderBottom !== undefined) styles.borderBottom = borderBottom;
        if (fontWeight !== undefined) styles.fontWeight = fontWeight;

        const generatedStyle = Object.entries(styles)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
            .join(';');

        this.styleCache.set(cacheKey, generatedStyle);
        return generatedStyle;
    }

    static getStyles(componentColor, type, styles, states = []) {

        const messageTypeStyle = type && type !== 'info' ? this.messageTypes[type]?.style : null;
        const stateStyle = states.length > 0 ? this.elementStates[states[0]]?.style : null;

        const background = styles.headerBackground ||
            (messageTypeStyle && messageTypeStyle.background) ||
            (stateStyle && stateStyle.background) ||
            this.styleConfig.header.background;

        return {
            header: this.generateStyle({
                type: 'header',
                background: background,
                color: styles.messageTextColor ??
                    componentColor,
                borderBottom: `1px solid ${componentColor}`,
                fontWeight: 'bold'
            }),
            text: this.generateStyle({
                type: 'text',
                color: styles.messageTextColor ??
                    messageTypeStyle?.color ??
                    this.styleConfig.text.color
            })
        };
    }

    static clearStyleCache() {
        this.styleCache.clear();
    }

    static getStyleCacheSize() {
        return this.styleCache.size;
    }

    static formatStateIcons(states) {
        if (states.length === 0) return '';
        return ' ' + states.map(state =>
            this.elementStates[state]?.icon || ''
        ).join(' ');
    }


    static parseArgs(args) {
        let message = '';
        let type = 'info';
        let element = null;
        let states = [];
        let styles = {};
        let functionName = null;
        let trackType = null;

        args.forEach(arg => {
            if (typeof arg === 'string') {
                message = arg;
            } else if (arg instanceof HTMLElement) {
                element = arg;
            } else if (typeof arg === 'object' && arg !== null) {
                if (arg.conditions) states = Array.isArray(arg.conditions) ? arg.conditions : [arg.conditions];
                if (arg.type) type = arg.type;
                if (arg.message) message = arg.message;
                if (arg.element) element = arg.element;
                if (arg.styles) styles = arg.styles;
                if (arg.trackType) trackType = arg.trackType;
                if (arg.functionName) functionName = arg.functionName;
            }
        });

        return { message, type, element, states, styles, trackType, functionName };
    }

    static parseElementInfo(element) {
        if (!element) return null;

        return {
            id: element.id  || 'unknown',
            tag: element.tagName?.toLowerCase() || 'unknown',
            parent: this.getParentInfo(element),
            classes: Array.from(element.classList || []).join(' ') || 'no-classes',
        };
    }

    static getParentInfo(element) {
        if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
            return 'no-parent';
        }

        const mainElements = ['section', 'header', 'footer', 'nav', 'main', 'article', 'aside'];
        let currentElement = element;

        while (currentElement.parentElement) {
            currentElement = currentElement.parentElement;
            const tag = currentElement.tagName.toLowerCase();

            if (mainElements.includes(tag)) {
                if (currentElement.id) {
                    return `${tag}#${currentElement.id}`;
                }
                if (currentElement.dataset.section) {
                    return `${tag}[data-section="${currentElement.dataset.section}"]`;
                }
                const className = currentElement.className?.baseVal || currentElement.className || '';
                const firstClass = className.toString().split(' ')[0];
                return firstClass ? `${tag}.${firstClass}` : tag;
            }
        }

        const directParent = element.parentElement;
        if (!directParent) return 'no-parent';

        const tag = directParent.tagName.toLowerCase();
        const id = directParent.id ? `#${directParent.id}` : '';
        const className = directParent.className?.baseVal || directParent.className || '';
        const firstClass = className.toString().split(' ')[0];
        return `${tag}${id}${firstClass ? `.${firstClass}` : ''}`;
    }


    static checkTrackTypes(element, trackType) {
        if (!element || !trackType) return;

        const isAnimation = Array.isArray(trackType)
            ? trackType.includes('animation')
            : trackType === 'animation';

        const isScroll = Array.isArray(trackType)
            ? trackType.includes('scroll')
            : trackType === 'scroll';

        const isResize = Array.isArray(trackType)
            ? trackType.includes('resize')
            : trackType === 'resize';

        if (isAnimation) {
            this.logElementAnimations(element);
        }

        if (isScroll) {
            this.logScrollInfo(element);
        }
        if (isResize) {
            this.logResizeInfo(element);
        }
    }


    static formatGroupHeader(name, type, states, functionName, styles) {
        const { header: headerStyle } = this.getStyles(this.getComponentColor(name), type, styles, states);

        const functionInfo = functionName ? ` [${functionName}]` : '';
        const icon = this.messageTypes[type]?.icon ? `${this.messageTypes[type].icon} ` : '';
        const stateIcons = this.formatStateIcons(states);

        return {
            text: `%c${icon}[${name}]${stateIcons}${functionInfo}`,
            style: headerStyle
        };
    }

    static formatSimpleMessage(name, message, headerStyle, textStyle) {

        console.log(
            `%c[${name}]%c\n ${message}`,
            headerStyle,
            textStyle
        );
    }

    static formatMessage(name, ...args) {

        const componentColor = this.getComponentColor(name);
        const { message, type, element, states, styles, trackType, functionName } = this.parseArgs(args);
        const { header: headerStyle, text: textStyle } = this.getStyles(componentColor, type, styles, states);

        if (args.length === 1 && typeof args[0] === 'string') {
            this.formatSimpleMessage(name, message, headerStyle, textStyle);
            return;
        }
        this.formatDetailedMessage(name, message, type, element, states, headerStyle, textStyle, functionName, styles, trackType);
    }

    static formatElementDetails(elementInfo) {
        return {
            tag: elementInfo.tag,
            id: elementInfo.id,
            classes: elementInfo.classes,
            parent: elementInfo.parent,
        };
    }
    
    static formatDetailedMessage(name, message, type, element, states, headerStyle, textStyle, functionName, styles, track) {
        const functionInfo = functionName ? ` [${functionName}]` : '';
        const icon = this.messageTypes[type]?.icon ? `${this.messageTypes[type].icon} ` : '';
        const stateIcons = this.formatStateIcons(states);
        const headerText = `%c${icon}[${name}]${stateIcons}${functionInfo}`;

        const header = this.formatGroupHeader(name, type, states, functionName, styles);
        const trackType = track;

        console.group(header.text, header.style);
        this.logMessage(message, textStyle);
        this.logElementInfo(element);
        this.logDOMElement(element);
        this.checkTrackTypes(element, trackType);
        this.logStates(states);
        console.groupEnd();
    }

    static formatAnimationInfo(style) {
        if (!style) return null;

        return {
            name: style.animationName,
            duration: style.animationDuration,
            delay: style.animationDelay,
            timing: style.animationTimingFunction,
            state: style.animationPlayState
        };
    }


    static logMessage(message, textStyle) {
        if (!message) return;
        console.log(`\n%c${message}`, textStyle);
    }

    static logElementInfo(element) {
        if (!element) return;

        const elementInfo = this.parseElementInfo(element);
        console.log(
            '%cElement Info:',
            this.generateStyle({ type: 'elementInfo' }),
            this.formatElementDetails(elementInfo)
        );
    }

    static logDOMElement(element) {
        if (!element) return;

        console.log(
            '%cDOM element:',
            this.generateStyle({ type: 'elementInfo' }),
            element
        );
    }

    static logAnimationDetails(elementType, style) {
        if (!style) return;

        console.log(
            `%c${elementType}:`,
            this.generateStyle({ type: 'elementInfo' }),
            this.formatAnimationInfo(style)
        );
    }

    static logElementAnimations(element) {
        if (!element) return;

        const mainStyle = window.getComputedStyle(element);
        const hasMainAnimation = mainStyle.animationName !== 'none';

        const beforeStyle = window.getComputedStyle(element, '::before');
        const hasBeforeAnimation = beforeStyle.content !== 'none' && beforeStyle.animationName !== 'none';

        const afterStyle = window.getComputedStyle(element, '::after');
        const hasAfterAnimation = afterStyle.content !== 'none' && afterStyle.animationName !== 'none';

        if (hasMainAnimation || hasBeforeAnimation || hasAfterAnimation) {
            console.group('%cAnimations:', this.generateStyle({ type: 'elementInfo' }));

            if (hasMainAnimation) {
                this.logAnimationDetails('Main element', mainStyle);
            }

            if (hasBeforeAnimation) {
                this.logAnimationDetails('::before', beforeStyle);
            }

            if (hasAfterAnimation) {
                this.logAnimationDetails('::after', afterStyle);
            }

            console.groupEnd();
        }
    }

    static logScrollInfo(element) {
        if (!element) return;

        // const rect = element.getBoundingClientRect();
        const scrollInfo = {
            scroll: {
                top: window.scrollY,
                left: window.scrollX
            },
            // position: {
            //     top: rect.top + window.scrollY,
            //     left: rect.left + window.scrollX
            // },
            // viewport: {
            //     top: rect.top,
            //     left: rect.left
            // }
        };

        console.group('%cScroll Info:', this.generateStyle({ type: 'elementInfo' }));
        console.log('Window scroll:', scrollInfo.scroll);
        // console.log('Element absolute position:', scrollInfo.position);
        // console.log('Element viewport position:', scrollInfo.viewport);
        console.groupEnd();
    }

    static logResizeInfo(element) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        // const styles = window.getComputedStyle(element);
        const resizeInfo = {
            size: {
                width: rect.width,
                height: rect.height
            },
            // computed: {
            //     width: styles.width,
            //     height: styles.height,
            //     maxWidth: styles.maxWidth,
            //     maxHeight: styles.maxHeight,
            //     minWidth: styles.minWidth,
            //     minHeight: styles.minHeight
            // },
            window: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        console.group('%cResize Info:', this.generateStyle({ type: 'elementInfo' }));
        console.log('Element size:', resizeInfo.size);
        // console.log('Computed styles:', resizeInfo.computed);
        console.log('Window size:', resizeInfo.window);
        console.groupEnd();
    }

    static logStates(states) {
        if (states.length === 0) return;

        console.log(
            '%cStates:',
            this.generateStyle({
                type: 'elementInfo',
                customStyles: {
                    fontStyle: 'italic'
                }
            }),
            states
        );
    }

    static log(name, ...args) {

        if (!this.isLoggerEnabled(name)) return;
        this.formatMessage(name, ...args);
    }

    static test() {
        // Create a test element with animation
        const testElement = document.createElement('div');
        testElement.id = 'test-element';
        testElement.style.animation = 'fade 1s ease-in-out';
        testElement.className = 'test-class animation';

        // New element only with main element animation
        const testElementMain = document.createElement('div');
        testElementMain.id = 'test-element-main';
        testElementMain.className = 'test-class-main';

        // New element with only pseudo element animation
        const testElementPseudo = document.createElement('div');
        testElementPseudo.id = 'test-element-pseudo';
        testElementPseudo.className = 'test-class-pseudo';

        // Test element for scroll and resize
        const testElementScroll = document.createElement('div');
        testElementScroll.id = 'test-element-scroll';
        testElementScroll.className = 'test-class-scroll';


        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
        /* Styles for the first element with all animations */
        @keyframes fade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        @keyframes scaleUp {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }
        #test-element {
            animation: fade 1s ease-in-out;
            position: relative;
            width: 100px;
            height: 100px;
            background: #ccc;
        }
        #test-element::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 20px;
            height: 20px;
            background: red;
            animation: slideIn 1.5s ease-in-out;
        }
        #test-element::after {
            content: '';
            position: absolute;
            right: 0;
            bottom: 0;
            width: 20px;
            height: 20px;
            background: blue;
            animation: scaleUp 2s ease-in-out;
        }

        /* Styles for the element with only the main animation */
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #test-element-main {
            animation: rotate 2s linear infinite;
            width: 100px;
            height: 100px;
            background: #ffcccc;
        }

        /* Styles for the element with only pseudo element animation */
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        #test-element-pseudo {
            width: 100px;
            height: 100px;
            background: #ccffcc;
        }
        #test-element-pseudo::before {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: green;
            animation: bounce 1s ease-in-out infinite;
        }
    `;

        const scrollStyles = document.createElement('style');
        scrollStyles.textContent = `
    #test-element-scroll {
        width: 200px;
        height: 200px;
        background: #eee;
        overflow: auto;
        position: relative;
        margin: 20px;
    }
    
    #test-element-scroll::before {
        content: '';
        display: block;
        height: 400px;
        width: 400px;
        background: linear-gradient(45deg, #f0f0f0 25%, #e0e0e0 25%, #e0e0e0 50%, #f0f0f0 50%, #f0f0f0 75%, #e0e0e0 75%);
        background-size: 20px 20px;
    }
`;

        document.head.appendChild(styleSheet);
        document.body.appendChild(testElement);
        document.body.appendChild(testElementMain);
        document.body.appendChild(testElementPseudo);
        document.head.appendChild(scrollStyles);
        document.body.appendChild(testElementScroll);

        const logger = createLogger('TestLogger');

        // Test message
        console.log('************************************');
        console.log('Message')
        console.log('----------------------------------');
        logger.log('Base test simple message');

        // Test all types
        console.log('************************************');
        console.log('Message and type message')
        console.log('----------------------------------');
        for (const type of Object.keys(this.messageTypes)) {
            logger.log(`Test type ${type}`, {type: `${type}`});
        }

        // Test state without element, only with passed state
        console.log('************************************');
        console.log('Test state without element, only with passed state')
        console.log('----------------------------------');
        Object.keys(this.elementStates).forEach(state => {
            logger.log(`Test state. Type:  ${state}`,  {
                conditions: [state]
            });
        });

        // Test state with passed element
        console.log('************************************');
        console.log('Test state with passed element')
        console.log('----------------------------------');
        Object.keys(this.elementStates).forEach(state => {
            logger.log(`Test state. Type:  ${state}`, testElement, {
                conditions: [state]
            });
        });

        // Test with element and styles
        console.log('************************************');
        console.log('Test with element and styles')
        console.log('----------------------------------');
        logger.log('Test element with styles', testElement, {
            styles: {
                messageTextColor: '#fb042a',
                headerBackground: '#af274b'
            },
            conditions: ['visible', 'running'],
        });

        // Test with trackType
        console.log('************************************');
        console.log('Test with trackType')
        console.log('----------------------------------');
        logger.log('Test with trackType', testElement, {
            type: 'success',
            conditions: ['visible', 'running'],
            trackType: 'animation'
        });

        // Test with all parameters
        console.log('************************************');
        console.log('Test with all parameters')
        console.log('----------------------------------');
        logger.log('All parameters', testElement, {
            type: 'warning',
            conditions: ['visible', 'running'],
            styles: {
                messageTextColor: '#35af27',
                headerBackground: '#af274b',
            },
            functionName: 'testFunction',
            trackType: 'animation'
        });

        // Test animations with pseudo elements
        console.log('************************************');
        console.log('Test animations with pseudo elements');
        console.log('----------------------------------');
        logger.log('Check animations', testElement, {
            type: 'info',
            trackType: 'animation'
        });

        // Test element only with main animation
        console.log('************************************');
        console.log('Test element only with main animation');
        console.log('----------------------------------');
        logger.log('Element with main animation', testElementMain, {
            type: 'info',
            trackType: 'animation'
        });

        // Test element only with pseudo element animation
        console.log('************************************');
        console.log('Test element only with pseudo element animation');
        console.log('----------------------------------');
        logger.log('Element with pseudo element animation', testElementPseudo, {
            type: 'info',
            trackType: 'animation'
        });

        // Test for scroll
        console.log('************************************');
        console.log('Test scroll tracking');
        console.log('----------------------------------');

// Save link to function-handler
        const scrollHandler = (event) => {
            logger.log('Scroll event', event.target, {
                type: 'info',
                trackType: 'scroll'
            });
        };

// Add listener with saved function
        testElementScroll.addEventListener('scroll', scrollHandler);

        logger.log('Initial scroll state', testElementScroll, {
            type: 'info',
            trackType: 'scroll'
        });

// Test for resize
        console.log('************************************');
        console.log('Test resize tracking');
        console.log('----------------------------------');

// Create ResizeObserver for tracking size changes
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                logger.log('Size changed', entry.target, {
                    type: 'info',
                    trackType: 'resize'
                });
            }
        });

        resizeObserver.observe(testElementScroll);

        logger.log('Initial resize state', testElementScroll, {
            type: 'info',
            trackType: 'resize'
        });

// Test combined tracking
        console.log('************************************');
        console.log('Test combined tracking');
        console.log('----------------------------------');
        logger.log('Tracking started', testElementScroll, {
            type: 'info',
            trackType: ['scroll', 'resize']
        });

// Cleanup after 20 seconds
        setTimeout(() => {
            // Remove listener with correct parameters
            resizeObserver.disconnect();
            testElementScroll.removeEventListener('scroll', scrollHandler);

            // Remove elements
            document.body.removeChild(testElement);
            document.body.removeChild(testElementMain);
            document.body.removeChild(testElementPseudo);
            document.body.removeChild(testElementScroll);
            document.head.removeChild(styleSheet);
            document.head.removeChild(scrollStyles);
        }, 20000);
    }
}

export const createLogger = (name) => {
    if (!Logger.instances.has(name)) {
        Logger.instances.set(name, name);
        if (Logger.globalLoggingEnabled && !Logger.disabledLoggers.has(name)) {
            Logger.enabledLoggers.add(name);
        }
    }

    return {
        log(...args) {
            Logger.log(name, ...args);
        }
    };
};