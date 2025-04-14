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
 * Logging Control:
 *
 * import { Logger } from './utils/logger';
 *
 * // Global control
 * Logger.enableGlobalLogging();
 * Logger.disableGlobalLogging();
 *
 * // Component-specific control
 * Logger.enableLoggerFor('MyComponent');
 * Logger.disableLoggerFor('MyComponent');
 *
 * Style Caching:
 *
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
                background: 'transparent'
            }
        },
        success: {
            icon: '✅',
            style: {
                background: '#E5FFE5',
                color: '#008000'
            }
        },
        warning: {
            icon: '⚠️',
            style: {
                background: '#FFF4E5',
                color: '#FFA500'
            }
        },
        error: {
            icon: '❌',
            style: {
                background: '#FFE5E5',
                color: '#FF0000'
            }
        },
        debug: {
            icon: '🔍',
            style: {
                background: '#F5F5F5',
                color: '#666666'
            }
        }
    };

    static elementStates = {
        visible: {
            icon: '👁️',
            style: {
                background: 'rgba(126,10,93,0.5)',
                color: '#666666'
            }
        },
        hidden: {
            icon: '🔒',
            style: {
                background: 'rgba(91,21,177,0.5)',
                color: '#666666'
            }
        },
        running: {
            icon: '▶️',
            style: {
                background: 'rgba(10,112,175,0.5)',
                color: '#666666'
            }
        },
        paused: {
            icon: '⏸️',
            style: {
                background: 'rgba(164,234,134,0.5)',
                color: '#666666'
            }
        }
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
        }
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
        const cacheKey = JSON.stringify({
            type: options.type || 'base',
            background: options.background,
            color: options.color,
            borderBottom: options.borderBottom,
            fontWeight: options.fontWeight,
            customStyles: options.customStyles,
            variant: options.variant
        });

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
            variant = 'default'
        } = options;

        const baseStyles = this.styleConfig[type] || {};
        const styles = {
            ...this.styleConfig.base,
            ...baseStyles,
            ...(background && { background }),
            ...(color && { color }),
            ...(borderBottom && { borderBottom }),
            ...(fontWeight && { fontWeight }),
            ...customStyles
        };

        const generatedStyle = Object.entries(styles)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
            .join(';');

        this.styleCache.set(cacheKey, generatedStyle);

        return generatedStyle;
    }

    static getStyles(componentColor, type, styles) {
        return {
            header: this.generateStyle({
                type: 'header',
                background: styles?.headerBackground ||
                    this.messageTypes[type]?.style.background ||
                    this.styleConfig.header.background ||
                    'transparent',
                color: componentColor,
                borderBottom: `1px solid ${componentColor}`,
            }),
            text: this.generateStyle({
                type: 'text',
                color: styles?.messageTextColor || this.styleConfig.text.color,
            })
        };
    }

    static getGroupHeaderStyles(states, type, componentColor, styles) {
        const backgroundColor = states.length > 0 && type !== 'info'
            ? this.messageTypes[type]?.style.background
            : (states.length > 0 ? this.elementStates[states[0]]?.style.background : 'transparent');

        return this.generateStyle({
            type: 'group',
            background: styles?.headerBackground || backgroundColor,
            color: componentColor,
            fontWeight: 'bold',
            borderBottom: `1px solid ${componentColor}`,
        });
    }

    static clearStyleCache() {
        this.styleCache.clear();
    }

    static getStyleCacheSize() {
        return this.styleCache.size;
    }

    static parseElementInfo(element) {
        if (!element) return null;

        return {
            tag: element.tagName?.toLowerCase() || 'unknown',
            classes: Array.from(element.classList || []).join(' ') || 'no-classes',
            id: element.id  || 'unknown',
            parent: this.getParentInfo(element)
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
            }
        });

        return { message, type, element, states, styles };
    }

    static logSimpleMessage(name, message, type, headerStyle, textStyle) {
        console.log(
            `%c${this.messageTypes[type].icon} [${name}]%c\n ${message}`,
            headerStyle,
            textStyle
        );
    }

    static logElementInfo(element) {
        if (!element) return;

        const elementInfo = this.parseElementInfo(element);
        console.log(
            '%cElement Info:\n',
            this.generateStyle({
                type: 'elementInfo'
            }),
            {
                tag: elementInfo.tag,
                id: elementInfo.id,
                classes: elementInfo.classes,
                parent: elementInfo.parent,
            }
        );

        console.log(
            '%cDOM element:\n',
            this.generateStyle({
                type: 'elementInfo'
            }),
            element
        );
    }

    static logDetailedMessage(name, message, type, element, states, headerStyle, textStyle) {
        const stateIcons = this.formatStateIcons(states);
        const groupHeaderStyles = this.getGroupHeaderStyles(states, type, this.getComponentColor(name));

        console.group(
            `%c${this.messageTypes[type].icon}  ${name} ${stateIcons}`,
            groupHeaderStyles
        );

        if (message) {
            console.log(`%c${message}`, textStyle);
        }

        this.logElementInfo(element);

        if (states.length > 0) {
            console.log('%cStates:\n', 'color: #666666; font-style: italic; border-bottom: 1px dotted #666666;', states);
        }

        console.groupEnd();
    }

    static formatMessage(name, ...args) {
        const componentColor = this.getComponentColor(name);
        const { message, type, element, states, styles } = this.parseArgs(args);
        const { header: headerStyle, text: textStyle } = this.getStyles(componentColor, type, styles);

        if (!element && states.length === 0) {
            this.logSimpleMessage(name, message, type, headerStyle, textStyle);
            return;
        }

        if (!element && states.length === 0) {
            console.log(
                `%c${this.messageTypes[type].icon} [${name}]%c ${message}`,
                headerStyle,
                textStyle
            );
            return;
        }

        this.logDetailedMessage(name, message, type, element, states, headerStyle, textStyle);
    }

    static log(name, ...args) {
        if (!this.isLoggerEnabled(name)) return;
        this.formatMessage(name, ...args);
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
