import { createLogger } from '../../utils/logger';
import AnimationObserverCSS from '../../utils/animationObserver_CSS';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { getRandomValue, getColors } from '../../utils/utils';

/**
 * Default options for the roadmap component
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
    colors: ['rgb(255, 255, 255)'],
    dots: {
        count: 10,
        minSize: 1,
        maxSize: 4,
        minDuration: 3,
        maxDuration: 5,
        minOpacity: 0.01,
        maxOpacity: 1,
    },
    animationConfig: {
        resizeDelay: 250,
        curvature: 0.5,
    }
};

/**
 * Roadmap component
 * @class Roadmap
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options object
 */
export class Roadmap {
    constructor(container, options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.container = container;
        this.observer = null;
        this.initialized = false;
        this.animationObserver = new AnimationObserverCSS();

        this.parentSVG = null;
        this.SVG = null;
        this.quarters = null;
        this.colors = null;

        this.options = AnimationController.mergeOptions( DEFAULT_OPTIONS, options);

        this.init();
    }

    init() {
        if (!this.container || this.initialized) return;
    
        this.logger.log({
            conditions: 'init',
            functionName: 'init'
        });

        this.parentSVG = this.container.querySelector(this.options.selectors.timeline);
        this.SVG = this._createSVG();
        this.quarters = this.container.querySelectorAll(this.options.selectors.quarters);
        this.colors = this._getQuarterColor();

        this._initResizeObserver();   
        this.initialized = true;
    }

    /**
     * Get colors from container
     * @private
     */
    _getQuarterColor() {
        this.colors = getColors(this.container, '.roadmap-quarter');
        if (!this.colors.length) {
            this.colors = this.options.colors;
        }
    }

    /**
    * Initializes the ResizeObserver for the container
     * @private
     */
    _initResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                    setTimeout(() => {
                        this._createConnectionLines();
                    }, this.options.animationConfig.resizeDelay);
                }
            }
        });
        this.resizeObserver.observe(this.container);
    }

    /**
     * Create SVG element
     * @private
     */
    _createSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add(this.options.classes.svgContainer);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        return svg;
    }

    /**
     * Create connection lines
     * @private
     */
    _createConnectionLines() {
        const existingSvg = this.parentSVG.querySelector(this.options.selectors.svgContainer);
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
     * Create points
     * @private
     */
    _createPoints() {
        const points = Array.from(this.quarters).map((quarter, index) => {
            const rect = quarter.getBoundingClientRect();
            const timelineRect = this.parentSVG.getBoundingClientRect();
            
            const styles = window.getComputedStyle(quarter);
            const paddingLeft = parseFloat(styles.paddingLeft);
            const paddingRight = parseFloat(styles.paddingRight);
            const paddingTop = parseFloat(styles.paddingTop);
            
            let x, y;
            
            if (index % 2 === 0) {
                x = rect.right - timelineRect.left - paddingRight;
                y = rect.top - timelineRect.top + paddingTop;
            } else {
                x = rect.left - timelineRect.left + paddingLeft;
                y = rect.top - timelineRect.top + paddingTop;
            }
            
            return { x, y };
        });

        return points;
    }

    /**
     * Create connection
     * @private
     */
    _createConnection(points) {
        const connections = points.slice(0, -1).map((start, index) => {
            const end = points[index + 1];
            
            const distance = Math.abs(end.x - start.x);
            const arcHeight = Math.min(distance * 0.3, 150); // max height
            
            const controlPoint1 = {
                x: start.x + (end.x - start.x) * 0.5,
                y: start.y - arcHeight,
            };
            
            const controlPoint2 = {
                x: end.x - (end.x - start.x) * 0.5,
                y: end.y - arcHeight,
            };
            
            return {
                start,
                end,
                controlPoint1,
                controlPoint2
            };
        });

        connections.forEach((conn, i) => {
            const path = this._createCurvedPath(conn.start, conn.end, conn.controlPoint1, conn.controlPoint2);
            this.SVG.appendChild(path);
            const dots = this._createDots(path, this.colors[i]);
            dots.forEach(dot => this.SVG.appendChild(dot));
        });
    }

    /**
     * Create curved path
     * @private
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
     * Create dots
     * @private
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
     * Create single dot
     * @private
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
     * Create single dot animate
     * @private
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
     * Disconnect observer
     * @private
     */
    _disconnect() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.animationObserver) {
            this.animationObserver.disconnect();
            this.animationObserver = null;
        }
        // Удалить SVG из DOM, если нужно полностью очистить визуализацию
        if (this.SVG && this.SVG.parentNode) {
            this.SVG.parentNode.removeChild(this.SVG);
            this.SVG = null;
        }
        this.initialized = false;
    }
}

