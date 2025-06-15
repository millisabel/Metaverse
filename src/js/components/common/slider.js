/**
 * @description Initialize the slider
 * @returns {void}
 */	
export function initSlider() {
    const carouselElement = document.getElementById('aboutCarousel');
    const totalSlides = document.querySelectorAll('.about .carousel-item').length;
    const currentNumber = document.querySelector('.about .carousel-controls-buttons p span:first-child');
    const nextButton = document.querySelector('.about .carousel-control-next');
    const track = document.querySelector('.about .carousel-indicators-track');
    const fill = document.querySelector('.about .carousel-indicators-fill');
    const handle = document.querySelector('.about .carousel-indicators-handle');

    let isDragging = false;
    let startX = 0;
    let startLeft = 0;
    let currentSlide = 0;
    let animationFrame = null;

    /**
     * @description Get the dimensions of the carousel
     * @returns {Object} The dimensions of the carousel
     */
    function getDimensions() {
        const handleRect = handle.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        return {
            handleWidth: handleRect.width,
            trackWidth: trackRect.width,
            trackLeft: trackRect.left
        };
    }

    /**
     * @description Update the position of the indicator
     * @param {number} slideIndex - The index of the slide
     * @returns {void}
     */
    function updateIndicatorPosition(slideIndex) {
        const { handleWidth, trackWidth } = getDimensions();
        const progress = (slideIndex / (totalSlides - 1)) * 100;
        const maxPosition = trackWidth - handleWidth;
        const position = Math.min((progress / 100) * maxPosition, maxPosition);
        handle.style.left = `${position}px`;
        fill.style.width = `${position + handleWidth}px`;
    }

    /**
     * @description Get the slide index from the position
     * @param {number} position - The position of the indicator
     * @returns {number} The index of the slide
     */
    function getSlideIndexFromPosition(position) {
        const { handleWidth, trackWidth } = getDimensions();
        const progress = position / (trackWidth - handleWidth);
        return Math.round(progress * (totalSlides - 1));
    }

    /**
     * @description Smoothly move the indicator to the target position
     * @param {number} targetPosition - The target position of the indicator
     * @param {number} duration - The duration of the animation
     * @returns {void}
     */
    function smoothMoveToPosition(targetPosition, duration = 300) {
        const { handleWidth } = getDimensions();
        const startPosition = handle.offsetLeft;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smoothness function (easing)
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

    /**
     * @description Handle the drag start event
     * @param {Event} e - The event object
     * @returns {void}
     */
    function handleDragStart(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startLeft = handle.offsetLeft;
        carousel.pause();

        // Cancel current animation when dragging starts
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    /**
     * @description Handle the drag move event
     * @param {Event} e - The event object
     * @returns {void}
     */
    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const { handleWidth, trackWidth } = getDimensions();
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Limit movement strictly within the track
        const maxLeft = trackWidth - handleWidth;
        const newLeft = Math.max(0, Math.min(startLeft + deltaX, maxLeft));
        
        handle.style.left = `${newLeft}px`;
        fill.style.width = `${newLeft + handleWidth}px`;
    }

    /**
     * @description Handle the drag end event
     * @param {Event} e - The event object
     * @returns {void}
     */
    function handleDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const { handleWidth, trackWidth } = getDimensions();
        const finalX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
        const trackRect = track.getBoundingClientRect();
        const finalPosition = finalX - trackRect.left;
        
        // Limit final position within the track
        const maxPosition = trackWidth - handleWidth;
        const clampedPosition = Math.max(0, Math.min(finalPosition, maxPosition));
        const newSlideIndex = getSlideIndexFromPosition(clampedPosition);

        // Calculate target position for indicator
        const targetPosition = (newSlideIndex / (totalSlides - 1)) * (trackWidth - handleWidth);

        // Smoothly move indicator to final position
        smoothMoveToPosition(targetPosition);

        if (newSlideIndex !== currentSlide) {
            carousel.to(newSlideIndex);
        }

        currentSlide = newSlideIndex;
    }

    
    handle.addEventListener('mousedown', handleDragStart);
    handle.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    
    const carousel = new bootstrap.Carousel(carouselElement, {
        interval: 5000,
        touch: true,
        wrap: true,
        nextWhenVisible: false,
    });

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

    carouselElement.addEventListener('slide.bs.carousel', function(e) {
        updateNumbers(e.to);
        currentSlide = e.to;
    });

    updateNumbers(0);
}
