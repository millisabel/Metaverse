/**
 * Универсальная функция для отслеживания анимаций с помощью Intersection Observer
 * @param {Object} options - Настройки для Intersection Observer
 * @param {number} [options.threshold=0.1] - Порог видимости (0-1)
 * @param {number} [options.rootMargin='0px'] - Отступы для области видимости
 * @param {Function} [options.onEnter] - Callback при появлении элемента
 * @param {Function} [options.onLeave] - Callback при исчезновении элемента
 * @param {Function} [options.onChange] - Callback при изменении видимости
 * @returns {Function} Функция для добавления наблюдателя к элементам
 */
export const createAnimationObserver = ({
    threshold = 0.1,
    rootMargin = '0px',
    onEnter = null,
    onLeave = null,
    onChange = null
} = {}) => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const { isIntersecting, target } = entry;
            
            // Вызываем общий callback при изменении видимости
            if (onChange) {
                onChange(entry);
            }

            if (isIntersecting) {
                // Добавляем класс для анимации
                target.classList.add('animate');
                
                // Вызываем callback при появлении
                if (onEnter) {
                    onEnter(target);
                }
            } else {
                // Удаляем класс анимации
                target.classList.remove('animate');
                
                // Вызываем callback при исчезновении
                if (onLeave) {
                    onLeave(target);
                }
            }
        });
    }, {
        threshold,
        rootMargin
    });

    /**
     * Добавляет элемент под наблюдение
     * @param {HTMLElement|string} element - Элемент или селектор для поиска элементов
     * @param {Object} [options] - Дополнительные опции для конкретного элемента
     * @param {string} [options.animationClass='animate'] - Класс для анимации
     * @param {Function} [options.onEnter] - Callback при появлении элемента
     * @param {Function} [options.onLeave] - Callback при исчезновении элемента
     */
    const observe = (element, options = {}) => {
        const {
            animationClass = 'animate',
            onEnter: elementOnEnter,
            onLeave: elementOnLeave
        } = options;

        // Если передан селектор, находим все элементы
        const elements = typeof element === 'string' 
            ? document.querySelectorAll(element)
            : [element];

        elements.forEach(el => {
            // Добавляем класс для анимации
            el.classList.add(animationClass);
            
            // Добавляем под наблюдение
            observer.observe(el);

            // Добавляем обработчики для конкретного элемента
            if (elementOnEnter) {
                el.addEventListener('animationenter', () => elementOnEnter(el));
            }
            if (elementOnLeave) {
                el.addEventListener('animationleave', () => elementOnLeave(el));
            }
        });
    };

    /**
     * Прекращает наблюдение за элементом
     * @param {HTMLElement|string} element - Элемент или селектор
     */
    const unobserve = (element) => {
        const elements = typeof element === 'string' 
            ? document.querySelectorAll(element)
            : [element];

        elements.forEach(el => {
            observer.unobserve(el);
        });
    };

    /**
     * Отключает наблюдатель
     */
    const disconnect = () => {
        observer.disconnect();
    };

    return {
        observe,
        unobserve,
        disconnect
    };
}; 