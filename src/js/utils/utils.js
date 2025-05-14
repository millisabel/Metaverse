// COMMON UTILS ===============================================


//  isMobile ===============================================
/**
 * Checks if device is mobile
 * @returns {boolean} True if device is mobile
 */
export function isMobile(size = 768) {
    return window.innerWidth <= size;
}

//  createContainer ===============================================
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

// typeText =================================================
/**
 * Creates typing effect with blinking cursor
 * @param {HTMLElement} element 
 * @param {string} text 
 * @param {number} speed 
 * @returns {Promise} 
 */
export function typeText(element, text, speed = 20) {
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

//  getColors ===============================================
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

// getRandomColor ============================================
/**
 * Generates a random color
 * @returns {string} A random color in hex format
 */
export function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

// getRandomValue ============================================
/**
 * Generates a random number between min and max values
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random number between min and max
 */
export function getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
}

// updateCopyrightYear ============================================
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

// shuffleArray ============================================
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


