import { createLogger } from './logger';

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
    const logger = createLogger('Utils');
    
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
            logger.log(`Color from CSS var for ${selector}: ${cssVarValue.trim()}`, {
                functionName: 'getColors',
                conditions: ['update']
            });
            return cssVarValue.trim();
        }

        // 2. Try to get color from data-attribute
        const dataColor = element.dataset[dataAttr];
        if (dataColor) {
            logger.log(`Color from data attr for ${selector}: ${dataColor}`, {
                functionName: 'getColors',
                conditions: ['update']
            });
            return dataColor;
        }

        // 3. Use background color as a fallback
        if (useBackground) {
            const bgColor = getComputedStyle(element).backgroundColor;
            logger.log(`Color from background for ${selector}: ${bgColor}`, {
                functionName: 'getColors',
                conditions: ['update']
            });
            return bgColor;
        }

        return null;
    }).filter(color => color !== null);

    logger.log(`Colors updated for ${selector}`, {
        functionName: 'getColors',
        conditions: ['update'],
        colors
    });

    return colors;
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

// getRandomColor ============================================
/**
 * Generates a random color
 * @returns {string} A random color in hex format
 */
export function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}
