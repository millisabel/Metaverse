// Import components
import { initNavbar } from './components/navbar';
import { initSlider } from './components/slider';
import { initStars } from './components/stars';
import { initRoadmap } from './components/roadmap';
import { createAnimationObserver } from './utils/animationObserver';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Создаем наблюдатель для анимаций
    const animationObserver = createAnimationObserver({
        threshold: 0.1,
        rootMargin: '0px',
        onEnter: (element) => {
            // Можно добавить дополнительную логику при появлении элемента
            console.log('Element entered viewport:', element);
        },
        onLeave: (element) => {
            // Можно добавить дополнительную логику при исчезновении элемента
            console.log('Element left viewport:', element);
        }
    });

    // Добавляем наблюдение за всеми анимированными секциями
    const animatedSections = [
        '#home',
        '#about',
        '#roadmap',
        '#dynamics',
        '#vr-market',
        '#team',
        '#faq',
        '#social'
    ];

    animatedSections.forEach(section => {
        animationObserver.observe(section, {
            animationClass: 'section-animate'
        });
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

