// COMMON UTILS ===============================================

/**
 * Checks if device is mobile
 * @returns {boolean} True if device is mobile
 */
export function isMobile(size = 768) {
    return window.innerWidth <= size;
}

/**
 * Creates a container with specified options
 * @param {HTMLElement} parent - Parent element
 * @param {Object} options - Container options
 * @param {string} options.zIndex - Z-index value
 * @returns {HTMLElement} Created container
 */
export function createContainer(parent, options = {}) {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = options.zIndex || '0';
    parent.appendChild(container);
    return container;
}

/**
 * Creates typing effect with blinking cursor
 * @param {HTMLElement} element 
 * @param {string} text 
 * @param {number} speed 
 * @returns {Promise} 
 */
export function typeText(element, text, speed = 20) {
        console.log('typeText');
    return new Promise((resolve) => {
        let i = 0;
        element.textContent = '';
        element.style.position = 'relative';
        
        const cursor = document.createElement('span');
        cursor.style.display = 'inline-block';
        cursor.style.width = '2px';
        cursor.style.height = '1em';
        cursor.style.backgroundColor = 'currentColor';
        cursor.style.animation = 'blink 0.7s infinite';
        cursor.style.verticalAlign = 'middle';
        cursor.style.marginLeft = '2px';
        element.appendChild(cursor);
        
        const type = () => {
            if (i < text.length) {
                cursor.remove();
                
                element.textContent += text.charAt(i);
                
                element.appendChild(cursor);
                
                i++;
                setTimeout(type, speed);
            } else {
                cursor.remove();
                resolve();
            }
        };
        
        type();
    });
}

/**
 * Get colors from element
 * @param {HTMLElement} container
 * @param {string} selector 
 * @param {Object} options 
 * @param {string} options.cssVar 
 * @param {string} options.dataAttr 
 * @param {boolean} options.useBackground 
 * @returns {string[]} 
 */
export function getColors(container, selector, options = {}) {
    
    const {
        cssVar = '--roamap-color',
        dataAttr = 'color',
        useBackground = true
    } = options;

    const elements = container.querySelectorAll(selector);
    const colors = Array.from(elements).map(element => {
        // 1. Try to get  color from CSS var
        const cssVarValue = getComputedStyle(element).getPropertyValue(cssVar);
        if (cssVarValue) {
            return cssVarValue.trim();
        }

        // 2. Try to get color from data-attribute
        const dataColor = element.dataset[dataAttr];
        if (dataColor) {
            return dataColor;
        }

        // 3. Use background color as a fallback
        if (useBackground) {
            const bgColor = getComputedStyle(element).backgroundColor;
            return bgColor;
        }

        return null;
    }).filter(color => color !== null);

    return colors;
}

/**
 * Generates a random color
 * @returns {string} A random color in hex format
 */
export function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

/**
 * Generates a random number between min and max values
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random number between min and max
 */
export function getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Updates the copyright year
 * @param {string} selector - Selector for the copyright year element
 * @returns {void}
 */
export function updateCopyrightYear(selector) {
    const currentYear = new Date().getFullYear();
    const copyrightYearElement = document.querySelectorAll(selector);
    copyrightYearElement.forEach(element => {
        element.textContent = currentYear;
    });
}

/**
 * Shuffles an array
 * @description Shuffles an array
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Generates a class selector from a string or array of class names
 * @param {string|Array} classNames - The class names to generate a selector from
 * @returns {string} The generated class selector
 */
export function getClassSelector(classNames) {
    if (!classNames) return '';
    if (Array.isArray(classNames)) {
      return '.' + classNames.map(c => c.trim()).join('.');
    }
    return '.' + classNames.trim().replace(/\s+/g, '.');
  }

/**
 * Merges default options, options, and objectConfig into a single options object.
 * @param {Object} defaultOptions - Default options.
 * @param {Object} options - User options.
 * @param {Object} [objectConfig] - Additional object config.
 * @returns {Object} - Merged options.
 */
export function mergeOptionsWithObjectConfig(defaultOptions, options = {}, objectConfig = {}) {
    const { objectConfig: _ignored, ...restOptions } = options;
    const mergedOptions = {
        ...restOptions,
        ...(objectConfig || {})
    };
    return mergeOptions(defaultOptions, mergedOptions);
}

/**
 * Deeply merges two objects (used for options).
 * @param {Object} defaults - Default options.
 * @param {Object} options - User options.
 * @returns {Object} - Deeply merged object.
 */
export function mergeOptions(defaults, options) {
    const merged = deepClone(defaults);
    function assign(target, source) {
        for (const key in source) {
            if (
                source[key] &&
                typeof source[key] === 'object' &&
                !Array.isArray(source[key])
            ) {
                if (!target[key]) target[key] = {};
                assign(target[key], source[key]);
            } else {
                target[key] = deepClone(source[key]);
            }
        }
    }
    assign(merged, options);
    return merged;
}

/**
 * Deeply clones an object or array.
 * @param {any} value - The value to clone.
 * @returns {any} - Deeply cloned value.
 */
export function deepClone(value) {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(deepClone);
    }
    const cloned = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            cloned[key] = deepClone(value[key]);
        }
    }
    return cloned;
}

/**
 * Erase text by one letter from right to left
 * @param {HTMLElement} element - element, text of which is erased
 * @param {number} speed - delay between erasing letters (ms)
 * @returns {Promise}
 */
export function eraseText(element, speed = 20) {
    return new Promise(resolve => {
        let text = element.textContent;
        function erase() {
            if (text.length > 0) {
                text = text.slice(0, -1);
                element.textContent = text;
                setTimeout(erase, speed);
            } else {
                resolve();
            }
        }
        erase();
    });
}

/**
 * Extracts RGB values from a color string
 * @param {string} colorStr - The color string to extract RGB values from
 * @returns {string} The extracted RGB values
 */
export function extractRGB(colorStr) {
    // rgba(255, 255, 255, 0.05) или rgb(255, 255, 255)
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
    }
    return colorStr; 
}

/**
 * Gets the color from the quarter's CSS variable
 * @param {HTMLElement} quarter - The quarter element
 * @returns {string} The color in RGB format
 */
export function getQuarterColorFromVar(quarter) {
    const rgb = getComputedStyle(quarter).getPropertyValue('--roamap-color-rgb').trim();
    if (rgb) {
        return `rgb(${rgb})`;
    }
    return null;
}