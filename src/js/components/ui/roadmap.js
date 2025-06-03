import { createLogger } from '../../utils/logger';
import AnimationObserverCSS from '../../utils/animationObserver_CSS';
import { getRandomValue, getColors, deepMergeOptions, getClassSelector } from '../../utils/utils';

/**
 * @description Default options for the roadmap component
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
    colors: ['rgb(255, 255, 255)'],
    classes: {
        container: null,
        quarters: null,
        timeline: null,
        quartersContainer: null,
        svgContainer: null,
    },
    dots: {
        count: 15,
        minSize: 1,
        maxSize: 5,
        minDuration: 2,
        maxDuration: 6,
        minOpacity: 0.05,
        maxOpacity: 1,
    },
    animationConfig: {
        resizeDelay: 250,
        curvature: 0.5,
    },
};

/**
 * @description Roadmap component
 * @class Roadmap
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options object
 */
export class Roadmap {
    constructor(container, options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.container = container;
        this.initialized = false;

        this.parentSVG = null;
        this.SVG = null;
        this.quarters = null;
        this.colors = null;
        this.resizeTimeout = null;

        this.options = deepMergeOptions(DEFAULT_OPTIONS, options);

        this.animationObserver = new AnimationObserverCSS(
            [{ 
                selector: getClassSelector(this.options.classes.quarters),
                pseudo: 'before'
            }], 
            null,
            null
        );

        this.init();
    }

    /**
     * @description Initializes the roadmap component
     * @returns {void}
     */
    init() {
        if (!this.container || this.initialized) return;
    
        this.logger.log({
            conditions: 'init',
            functionName: 'init'
        });

        this.parentSVG = this.container.querySelector(getClassSelector(this.options.classes.timeline));
        this.SVG = this._createSVG();
        this.quarters = this.container.querySelectorAll(getClassSelector(this.options.classes.quarters));
        this._getQuarterColor();

        // Create initial connection lines
        this._createConnectionLines();
        
        // Add resize handler
        this._handleResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._handleResize);

        // Add visibility handler
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this.container.addEventListener('animationend', this._handleVisibilityChange);

        this.initialized = true;
    }

    /**
     * @description Handle resize event with debounce
     * @private
     */
    _handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            if (this.initialized) {
                this._createConnectionLines();
            }
            this.resizeTimeout = null;
        }, this.options.animationConfig.resizeDelay);
    }

    /**
     * @description Handle visibility changes
     * @param {Event} event - Animation end event
     * @private
     */
    _handleVisibilityChange(event) {
        if (this.initialized && event.target === this.container) {
            this._createConnectionLines();
        }
    }

    /**
     * @description Get colors from container
     * @returns {void}
     */
    _getQuarterColor() {
        this.colors = getColors(this.container, getClassSelector(this.options.classes.quarters));
        
        if (!this.colors.length) {
            this.colors = this.options.colors;
        }
    }

    /**
     * @description Create SVG element
     * @returns {SVGElement}
     */
    _createSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add(this.options.classes.svgContainer);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        return svg;
    }

    /**
     * @description Create connection lines
     * @returns {void}
     */
    _createConnectionLines() {
        const existingSvg = this.parentSVG.querySelector(getClassSelector(this.options.classes.svgContainer));
        if (existingSvg) {
            existingSvg.remove();
        }

        this.SVG = this._createSVG();
        this._getQuarterColor();

        const points = this._createPoints();
        this._createConnection(points);
        this.parentSVG.appendChild(this.SVG);
    }

    /**
     * @description Create points for the path
     * @returns {Array}
     */
    _createPoints() {
        const timelineRect = this.parentSVG.getBoundingClientRect();
        
        return Array.from(this.quarters).map((quarter, index) => {
            const rect = quarter.getBoundingClientRect();
            const styles = window.getComputedStyle(quarter);
            const paddingLeft = parseFloat(styles.paddingLeft);
            const paddingRight = parseFloat(styles.paddingRight);
            const paddingTop = parseFloat(styles.paddingTop);
            
            // Вычисляем смещение для точек в зависимости от индекса
            const offsetX = index % 2 === 0 ? paddingRight : -paddingRight;
            
            let x, y;
            
            if (index % 2 === 0) {
                // Для четных элементов (слева)
                x = rect.right - timelineRect.left + offsetX;
                y = rect.top - timelineRect.top + paddingTop;
            } else {
                // Для нечетных элементов (справа)
                x = rect.left - timelineRect.left + offsetX;
                y = rect.top - timelineRect.top + paddingTop;
            }
            
            return { x, y };
        });
    }

    /**
     * @description Create connection between points
     * @param {Array} points - The points to connect
     * @returns {void}
     */
    _createConnection(points) {
        const connections = points.slice(0, -1).map((start, index) => {
            const end = points[index + 1];
            
            // Вычисляем расстояние между точками
            const distance = Math.abs(end.x - start.x);
            
            // Настраиваем высоту дуги в зависимости от расстояния
            const arcHeight = Math.min(distance * this.options.animationConfig.curvature, 150);
            
            // Создаем контрольные точки для кривой Безье
            const controlPoint1 = {
                x: start.x + (end.x - start.x) * 0.5,
                y: start.y - arcHeight
            };
            
            const controlPoint2 = {
                x: end.x - (end.x - start.x) * 0.5,
                y: end.y - arcHeight
            };
            
            return {
                start,
                end,
                controlPoint1,
                controlPoint2
            };
        });

        // Создаем пути и точки
        connections.forEach((conn, i) => {
            const path = this._createCurvedPath(conn.start, conn.end, conn.controlPoint1, conn.controlPoint2);
            this.SVG.appendChild(path);
            const dots = this._createDots(path, this.colors[i]);
            dots.forEach(dot => this.SVG.appendChild(dot));
        });
    }

    /**
     * @description Create curved path
     * @param {Object} start - The start point
     * @param {Object} end - The end point
     * @param {Object} controlPoint1 - The first control point
     * @param {Object} controlPoint2 - The second control point
     * @returns {SVGElement}
     */
    _createCurvedPath(start, end, controlPoint1, controlPoint2) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const d = `M ${start.x},${start.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${end.x},${end.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'transparent');
        path.setAttribute('fill', 'none');
        
        return path;
    }

    /**
     * @description Create dots
     * @param {SVGElement} path - The path
     * @param {string} color - The color
     * @returns {Array}
     */
    _createDots(path, color) {
        const dots = [];
        const { count, minSize, maxSize, minDuration, maxDuration, minOpacity, maxOpacity } = this.options.dots;

        for (let i = 0; i < count; i++) {
            const size = getRandomValue(minSize, maxSize);
            const duration = getRandomValue(minDuration, maxDuration);
            const opacity = getRandomValue(minOpacity, maxOpacity);

            const dot = this._createSingleDot(color, size, opacity);
            const animate = this._createSingleDotAnimate(path, duration);

            dots.push(dot);
            dot.appendChild(animate);
        }

        return dots;
    }

    /**
     * @description Create single dot
     * @param {string} color - The color
     * @param {number} size - The size
     * @param {number} opacity - The opacity
     * @returns {SVGElement}
     */
    _createSingleDot(color, size, opacity) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', size / 2);
        dot.setAttribute('fill', color);
        dot.style.filter = `blur(${size / 3}px)`;
        dot.style.opacity = opacity;

        return dot;
    }

    /**
     * @description Create single dot animate
     * @param {SVGElement} path - The path
     * @param {number} duration - The duration
     * @returns {SVGElement}
     */
    _createSingleDotAnimate(path, duration) {
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animate.setAttribute('dur', `${duration}s`);
        animate.setAttribute('repeatCount', 'indefinite');
        animate.setAttribute('path', path.getAttribute('d'));
        animate.setAttribute('rotate', 'auto');
        animate.setAttribute('begin', `${Math.random() * -duration}s`);

        return animate;
    }

    /**
     * @description Cleanup the component
     * @returns {void}
     */
    dispose() {
        if (this.animationObserver) {
            this.animationObserver.dispose();
        }

        if (this.SVG && this.SVG.parentNode) {
            this.SVG.parentNode.removeChild(this.SVG);
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        window.removeEventListener('resize', this._handleResize);
        this.container.removeEventListener('animationend', this._handleVisibilityChange);
        
        this.initialized = false;
        this.container = null;
        this.parentSVG = null;
        this.SVG = null;
        this.quarters = null;
        this.colors = null;
    }
}



