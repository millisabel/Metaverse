// COMMON UTILS ===============================================

/**
 * Deep merges user options with default options
 * @param {Object} defaultOptions - Default configuration object
 * @param {Object} userOptions - User provided configuration object
 * @returns {Object} Merged configuration object
 */
export function deepMergeOptions(defaultOptions, userOptions) {
    // Guard against invalid inputs

    if(!defaultOptions && !userOptions) {
        return {};
    }
    if (!defaultOptions || typeof defaultOptions !== 'object') {
        return userOptions || {};
    }
    if (!userOptions || typeof userOptions !== 'object') {
        return defaultOptions;
    }

    // Create a new object to store the merged result
    const result = {};

    // Get all unique keys from both objects
    const allKeys = new Set([
        ...Object.keys(defaultOptions),
        ...Object.keys(userOptions)
    ]);

    // Process each key
    for (const key of allKeys) {
        const defaultValue = defaultOptions[key];
        const userValue = userOptions[key];

        // If user value is undefined, use default
        if (userValue === undefined) {
            result[key] = defaultValue;
            continue;
        }

        // If default value is undefined, use user value
        if (defaultValue === undefined) {
            result[key] = userValue;
            continue;
        }

        // Handle arrays
        if (Array.isArray(defaultValue) && Array.isArray(userValue)) {
            result[key] = userValue;
            continue;
        }

        // Handle nested objects
        if (
            typeof defaultValue === 'object' && 
            defaultValue !== null &&
            typeof userValue === 'object' && 
            userValue !== null
        ) {
            result[key] = deepMergeOptions(defaultValue, userValue);
            continue;
        }

        // For all other cases, use user value
        result[key] = userValue;
    }

    return result;
}

/**
 * @description Checks if device is mobile
 * @param {number} size - The size of the device
 * @returns {boolean} True if device is mobile
 */
export function isMobile(size = 768) {
    return window.innerWidth <= size;
}







export function getSizeContainer(container) {
    const rect = container.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}
/**
 * @description Gets the aspect ratio of a container
 * @param {HTMLElement} container - The container element
 * @returns {number} The aspect ratio
 */
export function getAspectRatio(container) {
    const { width, height } = getSizeContainer(container);
    return width / height;
}

/**
 * @description Creates typing effect with blinking cursor
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
 * @description Erase text by one letter from right to left
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
 * @description Updates the copyright year
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
 * @description Generates a class selector from a string or array of class names
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
 * @description Get colors from element
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
 * @description Generates a random color
 * @returns {string} A random color in hex format
 */
export function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

/**
 * @description Generates a random number between min and max values
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random number between min and max
 */
export function getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
}


/**
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
 * @description Extracts RGB values from a color string
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
 * @description Gets the color from the quarter's CSS variable
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

/**
 * @description Merges default options, options, and objectConfig into a single options object.
 * @param {Object} defaultOptions - Default options.
 * @param {Object} options - User options.
 * @param {Object} [objectConfig] - Additional object config.
 * @returns {Object} - Merged options.
 */
// export function mergeOptionsWithObjectConfig(defaultOptions, options = {}, objectConfig = {}) {
//     const { objectConfig: _ignored, ...restOptions } = options;
//     const mergedOptions = {
//         ...restOptions,
//         ...(objectConfig || {})
//     };
//     return mergeOptions(defaultOptions, mergedOptions);
// }

/**
 * @description Deeply merges two objects (used for options).
 * @param {Object} defaults - Default options.
 * @param {Object} options - User options.
 * @returns {Object} - Deeply merged object.
 */
// export function mergeOptions(defaults, options) {
//     const merged = deepClone(defaults);
//     function assign(target, source) {
//         for (const key in source) {
//             if (
//                 source[key] &&
//                 typeof source[key] === 'object' &&
//                 !Array.isArray(source[key])
//             ) {
//                 if (!target[key]) target[key] = {};
//                 assign(target[key], source[key]);
//             } else {
//                 target[key] = deepClone(source[key]);
//             }
//         }
//     }
//     assign(merged, options);
//     return merged;
// }

/**
 * @description Deeply clones an object or array.
 * @param {any} value - The value to clone.
 * @returns {any} - Deeply cloned value.
 */
// export function deepClone(value) {
//     if (value === null || typeof value !== 'object') {
//         return value;
//     }
//     if (Array.isArray(value)) {
//         return value.map(deepClone);
//     }
//     const cloned = {};
//     for (const key in value) {
//         if (Object.prototype.hasOwnProperty.call(value, key)) {
//             cloned[key] = deepClone(value[key]);
//         }
//     }
//     return cloned;
// }

/**
 * Merges user options with default options for 3D object configuration
 * @param {Object} defaultConfig - Default configuration object
 * @param {Object} userConfig - User provided configuration object
 * @returns {Object} Merged configuration object
 */
// export function mergeDefaultAndCustomOptions(defaultConfig, userConfig) {
//     // Validate inputs
//     if (!defaultConfig || typeof defaultConfig !== 'object') {
//         console.warn('Invalid default configuration provided');
//         return userConfig || {};
//     }

//     // Deep merge the configurations
//     const mergedConfig = deepMergeOptions(defaultConfig, userConfig);

//     return mergedConfig;
// }

