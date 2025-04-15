import { createLogger } from '../../utils/logger';
import AnimationObserverCSS from '../../utils/animationObserver_CSS';

export class Roadmap {
    constructor(container) {
        this.container = container;
        this.observer = null;
        this.initialized = false;
        this.animationObserver = new AnimationObserverCSS();
        this.name = 'Roadmap';
        this.logger = createLogger(this.name);

        this.COLORS = [
            '#c344ff',
            'rgba(255, 68, 124, 1)',
            'rgba(68, 255, 199, 1)'
        ];

        this.ANIMATION_CONFIG = {
            dots: {
                count: 8,
                minSize: 2,
                maxSize: 5,
                minDuration: 3,
                maxDuration: 5
            },
            curvature: 0.5,
            resizeDelay: 250
        };

        this.init();
    }

    init() {
        if (this.initialized) return;

        this.createConnectionLines();
        this.setupResizeHandler();
        this.setupAnimations();
        this.initialized = true;

        this.logger.log({
            conditions: 'initializing-controller',
            functionName: 'init'
        });
    }

    setupAnimations() {
        // Добавляем анимации для точек
        const dots = this.container.querySelectorAll('.connection-lines circle');
        dots.forEach(dot => {
            dot.setAttribute('data-aos', 'dot-animation');
            // Убираем дублирующую анимацию, так как она уже задана в SVG
            dot.style.animation = 'none';
        });

        // Добавляем анимации для линий
        const paths = this.container.querySelectorAll('.connection-lines path');
        paths.forEach(path => {
            path.setAttribute('data-aos', 'path-animation');
            path.style.animation = 'pathDraw 1s ease-in-out forwards';
        });

        // Добавляем анимации для кругов
        const circles = this.container.querySelectorAll('.roadmap-circle');
        circles.forEach(circle => {
            circle.setAttribute('data-aos', 'circle-animation');
            circle.style.animation = 'circlePulse 2s ease-in-out infinite';
        });

        // Добавляем анимации для контента
        const items = this.container.querySelectorAll('.roadmap-item');
        items.forEach((item, index) => {
            item.setAttribute('data-aos', 'item-animation');
            item.style.animation = `itemFadeIn 0.5s ease-out ${index * 0.2}s forwards`;
        });

        this.logger.log('Animations setup completed', {
            type: 'initializing-scene',
            functionName: 'setupAnimations',
            trackType: 'animation'
        });
    }

    createConnectionLines() {
        const timeline = this.container.querySelector('.roadmap-timeline');
        const circles = this.container.querySelectorAll('.roadmap-circle');

        // Remove existing SVG if any
        const existingSvg = timeline.querySelector('.connection-lines');
        if (existingSvg) {
            existingSvg.remove();
        }

        // Create SVG container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connection-lines');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // Get coordinates of circles
        const points = Array.from(circles).map(circle => {
            const rect = circle.getBoundingClientRect();
            const timelineRect = timeline.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - timelineRect.left,
                y: rect.top + rect.height / 2 - timelineRect.top
            };
        });

        // Create connections
        const connections = [
            { from: 0, to: 1, reverse: false },
            { from: 1, to: 2, reverse: true },
            { from: 2, to: 3, reverse: false }
        ];

        connections.forEach((conn, i) => {
            const startPoint = {
                x: conn.reverse ? points[conn.from].x - 20 : points[conn.from].x + 20,
                y: points[conn.from].y
            };
            const endPoint = {
                x: conn.reverse ? points[conn.to].x + 20 : points[conn.to].x - 20,
                y: points[conn.to].y
            };
            
            const path = this.createCurvedPath(startPoint, endPoint, conn.reverse);
            svg.appendChild(path);

            const dots = this.createDots(path, this.COLORS[i]);
            dots.forEach(dot => svg.appendChild(dot));
        });

        timeline.appendChild(svg);

        this.logger.log('Connection lines created', svg, {
            type: 'initializing-scene',
            functionName: 'createConnectionLines',
            trackType: 'animation'
        });
    }

    createCurvedPath(start, end, isReverse) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        
        let controlPoint1, controlPoint2;
        
        if (isReverse) {
            controlPoint1 = {
                x: start.x + dx * this.ANIMATION_CONFIG.curvature,
                y: start.y + Math.abs(dx) * 0.2
            };
            controlPoint2 = {
                x: end.x - dx * this.ANIMATION_CONFIG.curvature,
                y: end.y + Math.abs(dx) * 0.2
            };
        } else {
            controlPoint1 = {
                x: start.x + dx * this.ANIMATION_CONFIG.curvature,
                y: start.y - Math.abs(dx) * 0.2
            };
            controlPoint2 = {
                x: end.x - dx * this.ANIMATION_CONFIG.curvature,
                y: end.y - Math.abs(dx) * 0.2
            };
        }
        
        const d = `M ${start.x},${start.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${end.x},${end.y}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'transparent');
        path.setAttribute('fill', 'none');
        
        return path;
    }

    createDots(path, color) {
        const dots = [];
        const { count, minSize, maxSize, minDuration, maxDuration } = this.ANIMATION_CONFIG.dots;

        for (let i = 0; i < count; i++) {
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const size = minSize + Math.random() * (maxSize - minSize);
            dot.setAttribute('r', size / 2);
            dot.setAttribute('fill', color);
            dot.style.filter = `blur(${size / 3}px)`;
            dot.style.opacity = '0.8';

            // Добавляем атрибут для отслеживания анимации
            dot.setAttribute('data-aos', 'dot-animation');

            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            const duration = minDuration + Math.random() * (maxDuration - minDuration);
            animate.setAttribute('dur', `${duration}s`);
            animate.setAttribute('repeatCount', 'indefinite');
            animate.setAttribute('path', path.getAttribute('d'));
            animate.setAttribute('rotate', 'auto');
            animate.setAttribute('begin', `${Math.random() * -duration}s`);

            dot.appendChild(animate);
            dots.push(dot);
        }

        return dots;
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.logger.log('Resize started', {
                    type: 'resize-started',
                    functionName: 'setupResizeHandler'
                });

                this.createConnectionLines();
                this.setupAnimations();

                this.logger.log('Resize completed', {
                    type: 'resize-completed',
                    functionName: 'setupResizeHandler'
                });
            }, this.ANIMATION_CONFIG.resizeDelay);
        });
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.animationObserver) {
            this.animationObserver.disconnect();
        }
        this.initialized = false;
    }
}

export function initRoadmap() {
    const container = document.querySelector('.roadmap');
    if (!container) {
        console.warn('Roadmap container not found');
        return;
    }

    return new Roadmap(container);
} 