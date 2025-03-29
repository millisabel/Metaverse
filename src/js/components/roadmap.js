export function initRoadmap() {
    // Обработка кнопок "More"
    const moreButtons = document.querySelectorAll('.roadmap .more-btn');
    
    moreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const hiddenItems = this.previousElementSibling;
            hiddenItems.classList.toggle('show');
            this.textContent = hiddenItems.classList.contains('show') ? 'Less ←' : 'More →';
        });
    });

    // Создание SVG для соединительных линий
    function createConnectionLines() {
        const timeline = document.querySelector('.roadmap-timeline');
        const circles = document.querySelectorAll('.roadmap-circle');
        
        // Создаем SVG контейнер
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connection-lines');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');

        // Цвета для точек
        const colors = [
            '#c344ff',
            'rgba(255, 68, 124, 1)',
            'rgba(68, 255, 199, 1)'
        ];

        // Создаем анимированные точки на линиях
        function createDots(path, color) {
            const dots = [];
            for (let i = 0; i < 8; i++) {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const size = 2 + Math.random() * 3;
                dot.setAttribute('r', size / 2);
                dot.setAttribute('fill', color);
                dot.style.filter = `blur(${size / 3}px)`;
                dot.style.opacity = '0.8';
                
                const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
                animate.setAttribute('dur', `${3 + Math.random() * 2}s`);
                animate.setAttribute('repeatCount', 'indefinite');
                animate.setAttribute('path', path.getAttribute('d'));
                animate.setAttribute('rotate', 'auto');
                animate.setAttribute('begin', `${Math.random() * -5}s`);
                
                dot.appendChild(animate);
                dots.push(dot);
            }
            return dots;
        }

        // Функция для создания изогнутой линии между двумя точками
        function createCurvedPath(start, end, isReverse) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Рассчитываем контрольные точки для создания более выраженной дуги
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const curvature = 0.5; // Коэффициент кривизны
            
            let controlPoint1, controlPoint2;
            
            if (isReverse) {
                // Для обратного направления меняем контрольные точки
                controlPoint1 = {
                    x: start.x + dx * curvature,
                    y: start.y + Math.abs(dx) * 0.2
                };
                controlPoint2 = {
                    x: end.x - dx * curvature,
                    y: end.y + Math.abs(dx) * 0.2
                };
            } else {
                controlPoint1 = {
                    x: start.x + dx * curvature,
                    y: start.y - Math.abs(dx) * 0.2
                };
                controlPoint2 = {
                    x: end.x - dx * curvature,
                    y: end.y - Math.abs(dx) * 0.2
                };
            }
            
            const d = `M ${start.x},${start.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${end.x},${end.y}`;
            
            path.setAttribute('d', d);
            path.setAttribute('stroke', 'transparent');
            path.setAttribute('fill', 'none');
            
            return path;
        }

        // Получаем координаты кругов
        const points = Array.from(circles).map(circle => {
            const rect = circle.getBoundingClientRect();
            const timelineRect = timeline.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - timelineRect.left,
                y: rect.top + rect.height / 2 - timelineRect.top
            };
        });

        // Создаем соединения между кругами в нужном порядке
        const connections = [
            { from: 0, to: 1, reverse: false }, // от 1 к 2 (справа налево)
            { from: 1, to: 2, reverse: true },  // от 2 к 3 (слева направо)
            { from: 2, to: 3, reverse: false }  // от 3 к 4 (справа налево)
        ];

        // Создаем пути и точки
        connections.forEach((conn, i) => {
            const startPoint = {
                x: conn.reverse ? points[conn.from].x - 20 : points[conn.from].x + 20,
                y: points[conn.from].y
            };
            const endPoint = {
                x: conn.reverse ? points[conn.to].x + 20 : points[conn.to].x - 20,
                y: points[conn.to].y
            };
            
            const path = createCurvedPath(startPoint, endPoint, conn.reverse);
            svg.appendChild(path);

            const dots = createDots(path, colors[i]);
            dots.forEach(dot => svg.appendChild(dot));
        });

        timeline.appendChild(svg);
    }

    // Пересоздаем линии при изменении размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const oldSvg = document.querySelector('.connection-lines');
            if (oldSvg) {
                oldSvg.remove();
            }
            createConnectionLines();
        }, 250);
    });

    // Инициализация линий
    createConnectionLines();
} 