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

    // Function to update the indicator position
    function updateIndicatorPosition(slideIndex) {
        const progress = (slideIndex / (totalSlides - 1)) * 100;
        handle.style.left = `${progress}%`;
        fill.style.width = `${progress}%`;
    }

    // Function to get the slide index from position
    function getSlideIndexFromPosition(position) {
        const trackRect = track.getBoundingClientRect();
        const progress = (position - trackRect.left) / trackRect.width;
        return Math.round(progress * (totalSlides - 1));
    }

    // Handlers for drag-and-drop
    function handleDragStart(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startLeft = handle.offsetLeft;
        carousel.pause();
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        const newLeft = Math.max(0, Math.min(startLeft + deltaX, track.offsetWidth));
        
        handle.style.left = `${newLeft}px`;
        fill.style.width = `${newLeft}px`;
    }

    function handleDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const trackRect = track.getBoundingClientRect();
        const finalX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
        const finalPosition = finalX - trackRect.left;
        const newSlideIndex = getSlideIndexFromPosition(finalPosition);

        if (newSlideIndex !== currentSlide) {
            carousel.to(newSlideIndex);
        }

        updateIndicatorPosition(newSlideIndex);
        currentSlide = newSlideIndex;
    }

    // Add event handlers
    handle.addEventListener('mousedown', handleDragStart);
    handle.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    // Initialize carousel
    const carousel = new bootstrap.Carousel(carouselElement, {
        interval: 5000,
        touch: true,
        wrap: true,
        nextWhenVisible: false,
    });

    // Track visibility of section
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

    // Listen for slide change event
    carouselElement.addEventListener('slide.bs.carousel', function(e) {
        updateNumbers(e.to);
        currentSlide = e.to;
    });

    // Initialize initial values
    updateNumbers(0);
}
