export function initSlider() {
    const carouselElement = document.getElementById('aboutCarousel');
    const totalSlides = document.querySelectorAll('#aboutCarousel .carousel-item').length;
    const currentNumber = document.querySelector('.carousel-controls-buttons p span:first-child');
    const nextButton = document.querySelector('.carousel-control-next');
    const track = document.querySelector('.carousel-indicators-track');
    const fill = document.querySelector('.carousel-indicators-fill');
    const handle = document.querySelector('.carousel-indicators-handle');

    let isDragging = false;
    let startX = 0;
    let startLeft = 0;
    let currentSlide = 0;
    let animationFrame = null;

    // Функция для получения актуальных размеров и позиций
    function getDimensions() {
        const handleRect = handle.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        return {
            handleWidth: handleRect.width,
            trackWidth: trackRect.width,
            trackLeft: trackRect.left
        };
    }

    // Функция для обновления позиции индикатора
    function updateIndicatorPosition(slideIndex) {
        const { handleWidth, trackWidth } = getDimensions();
        const progress = (slideIndex / (totalSlides - 1)) * 100;
        const maxPosition = trackWidth - handleWidth;
        const position = Math.min((progress / 100) * maxPosition, maxPosition);
        handle.style.left = `${position}px`;
        fill.style.width = `${position + handleWidth}px`;
    }

    // Функция для получения индекса слайда из позиции
    function getSlideIndexFromPosition(position) {
        const { handleWidth, trackWidth } = getDimensions();
        const progress = position / (trackWidth - handleWidth);
        return Math.round(progress * (totalSlides - 1));
    }

    // Функция для плавного перемещения индикатора
    function smoothMoveToPosition(targetPosition, duration = 300) {
        const { handleWidth } = getDimensions();
        const startPosition = handle.offsetLeft;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Функция плавности (easing)
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const currentPosition = startPosition + (distance * easeProgress);
            handle.style.left = `${currentPosition}px`;
            fill.style.width = `${currentPosition + handleWidth}px`;

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        }

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        animationFrame = requestAnimationFrame(animate);
    }

    // Обработчики для drag-and-drop
    function handleDragStart(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startLeft = handle.offsetLeft;
        carousel.pause();

        // Отменяем текущую анимацию при начале перетаскивания
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const { handleWidth, trackWidth } = getDimensions();
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Ограничиваем перемещение строго в пределах трека
        const maxLeft = trackWidth - handleWidth;
        const newLeft = Math.max(0, Math.min(startLeft + deltaX, maxLeft));
        
        handle.style.left = `${newLeft}px`;
        fill.style.width = `${newLeft + handleWidth}px`;
    }

    function handleDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const { handleWidth, trackWidth } = getDimensions();
        const finalX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
        const trackRect = track.getBoundingClientRect();
        const finalPosition = finalX - trackRect.left;
        
        // Ограничиваем финальную позицию в пределах трека
        const maxPosition = trackWidth - handleWidth;
        const clampedPosition = Math.max(0, Math.min(finalPosition, maxPosition));
        const newSlideIndex = getSlideIndexFromPosition(clampedPosition);

        // Вычисляем конечную позицию для индикатора
        const targetPosition = (newSlideIndex / (totalSlides - 1)) * (trackWidth - handleWidth);

        // Плавно перемещаем индикатор к конечной позиции
        smoothMoveToPosition(targetPosition);

        if (newSlideIndex !== currentSlide) {
            carousel.to(newSlideIndex);
        }

        currentSlide = newSlideIndex;
    }

    // Добавляем обработчики событий
    handle.addEventListener('mousedown', handleDragStart);
    handle.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    // Инициализируем карусель
    const carousel = new bootstrap.Carousel(carouselElement, {
        interval: 5000,
        touch: true,
        wrap: true,
        nextWhenVisible: false,
    });

    // Отслеживаем видимость секции
    const aboutSection = document.getElementById('about');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                carousel.cycle();
            } else {
                carousel.pause();
            }
        });
    }, {
        threshold: 0.5
    });

    observer.observe(aboutSection);

    function updateNumbers(currentIndex) {
        currentNumber.textContent = currentIndex + 1;
        const nextIndex = (currentIndex + 1) % totalSlides;
        nextButton.innerHTML = `<span class="carousel-control-next-number">${nextIndex + 1}</span>`;
        updateIndicatorPosition(currentIndex);
    }

    // Слушаем событие изменения слайда
    carouselElement.addEventListener('slide.bs.carousel', function(e) {
        updateNumbers(e.to);
        currentSlide = e.to;
    });

    // Инициализируем начальные значения
    updateNumbers(0);
}
