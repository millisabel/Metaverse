// Import components
import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initStars } from './components/stars';
import { initRoadmap } from './components/roadmap';
import { createAnimationObserver } from './utils/animationObserver';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Создаем наблюдатель для кастомных анимаций
    const animationObserver = createAnimationObserver({
        threshold: 0.1,
        rootMargin: '0px',
        onEnter: (element) => {
            // Добавляем класс для анимации
            element.classList.add('roadmap-animate');
        },
        onLeave: (element) => {
            // Удаляем класс анимации
            element.classList.remove('roadmap-animate');
        }
    });

    // Добавляем наблюдение за кастомными анимированными элементами в roadmap
    const roadmapElements = [
        '.roadmap-quarter', // Квартальные блоки
        '.roadmap-circle',  // Круги
        '.connection-lines circle' // Точки на линиях
    ];

    roadmapElements.forEach(selector => {
        animationObserver.observe(selector);
    });

    // Добавляем наблюдение за элементами с анимацией появления
    animationObserver.observe('[data-aos]', {
        animationClass: 'aos-animate'
    });

    // Initialize components
    initNavbar();
    initSlider();
    initStars();
    initRoadmap();
});

