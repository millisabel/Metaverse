import { createLogger } from '../../utils/logger';
import AnimationObserverCSS from '../../utils/animationObserver_CSS';

export class Roadmap {
    constructor(container, options = {}) {
        this.container = container;
        this.observer = null;
        this.initialized = false;
        this.animationObserver = new AnimationObserverCSS();
        this.name = 'Roadmap';
        this.logger = createLogger(this.name);

        this.options = {
            colors: options.colors || ['rgba(255, 68, 124, 1)', 'rgba(68, 255, 199, 1)'],
            dots: {
                count: options.dots?.count || 10,
                minSize: options.dots?.minSize || 1,
                maxSize: options.dots?.maxSize || 4,
                minDuration: options.dots?.minDuration || 3,
                maxDuration: options.dots?.maxDuration || 5
            },
        };

        this.ANIMATION_CONFIG = {
            dots: {
                count: this.options.dots.count,
                minSize: this.options.dots.minSize,
                maxSize: this.options.dots.maxSize,
                minDuration: this.options.dots.minDuration,
                maxDuration: this.options.dots.maxDuration
            },
            curvature: 0.5,
            resizeDelay: 250
        };

        this.init();
    }

    init() {
        if (!this.container || this.initialized) return;

        this.logger.log({
            conditions: 'initializing-controller',
            functionName: 'init'
        });

        // Используем ResizeObserver для отслеживания изменений размеров
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                    setTimeout(() => {
                        this.createConnectionLines();
                    }, this.ANIMATION_CONFIG.resizeDelay);
                }
            }
        });

        // Начинаем наблюдение за контейнером
        resizeObserver.observe(this.container);

        // Сохраняем observer для последующей очистки
        this.observer = resizeObserver;

        this.setupResizeHandler();
        this.initialized = true;

        this.logger.log('Roadmap initialized', {
            colors: this.options.colors,
            conditions: ['initializing-controller'],
            trackType: ['animation'],
            functionName: 'init'
        });
    }

    createConnectionLines() {
        const timeline = this.container.querySelector('.roadmap-timeline');
        const quarters = this.container.querySelectorAll('.roadmap-quarter');

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
        const points = Array.from(quarters).map(quarter => {
            const rect = quarter.getBoundingClientRect();
            const timelineRect = timeline.getBoundingClientRect();
            
            // Получаем индекс текущего элемента
            const index = Array.from(quarters).indexOf(quarter);
            
            // Получаем computed стили для учета padding и других свойств
            const styles = window.getComputedStyle(quarter);
            const paddingLeft = parseFloat(styles.paddingLeft);
            const paddingRight = parseFloat(styles.paddingRight);
            const paddingTop = parseFloat(styles.paddingTop);
            
            // Определяем точки соединения в зависимости от индекса
            let x, y;
            
            if (index % 2 === 0) {
                // Для четных элементов (1 и 3) - правый верхний угол
                x = rect.right - timelineRect.left - paddingRight;
                y = rect.top - timelineRect.top + paddingTop;
            } else {
                // Для нечетных элементов (2 и 4) - левый верхний угол
                x = rect.left - timelineRect.left + paddingLeft;
                y = rect.top - timelineRect.top + paddingTop;
            }
            
            return { x, y };
        });

        // Создаем кривые между точками
        const connections = points.slice(0, -1).map((start, index) => {
            const end = points[index + 1];
            
            // Высота арки зависит от расстояния между точками
            const distance = Math.abs(end.x - start.x);
            const arcHeight = Math.min(distance * 0.3, 150); // Максимальная высота 150px
            
            // Определяем контрольные точки в зависимости от направления
            const controlPoint1 = {
                x: start.x + (end.x - start.x) * 0.5,
                y: start.y - arcHeight // Поднимаем контрольную точку вверх
            };
            
            const controlPoint2 = {
                x: end.x - (end.x - start.x) * 0.5,
                y: end.y - arcHeight // Поднимаем контрольную точку вверх
            };
            
            return {
                start,
                end,
                controlPoint1,
                controlPoint2
            };
        });

        connections.forEach((conn, i) => {
            const path = this.createCurvedPath(conn.start, conn.end, conn.controlPoint1, conn.controlPoint2);
            svg.appendChild(path);
            const dots = this.createDots(path, this.options.colors[i]);
            dots.forEach(dot => svg.appendChild(dot));
        });

        timeline.appendChild(svg);

        this.logger.log('Connection lines created', svg, {
            type: 'initializing-scene',
            functionName: 'createConnectionLines',
            trackType: 'animation'
        });
    }

    createCurvedPath(start, end, controlPoint1, controlPoint2) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
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

        this.animationObserver.setupResizeObserver();

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.logger.log('Resize started', {
                    type: 'resize-started',
                    functionName: 'setupResizeHandler'
                });

                this.createConnectionLines();

                this.logger.log('Resize completed', {
                    type: 'resize-completed',
                    functionName: 'setupResizeHandler'
                });
            }, this.ANIMATION_CONFIG.resizeDelay);
        });

        this.animationObserver.handleResize = (element) => {
            if (element === this.container) {
                this.logger.log('Roadmap resized', {
                    conditions: ['resize'],
                    trackType: ['resize'],
                    functionName: 'handleResize'
                });
            }
        };
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

export function initRoadmap(className) {
    const container = document.querySelector(className);
    if (!container) {
        console.warn('Roadmap container not found');
        return;
    }

    return new Roadmap(container);
} 