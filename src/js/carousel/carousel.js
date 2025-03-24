// About carousel initialization
document.addEventListener('DOMContentLoaded', function() {
    const aboutCarousel = document.getElementById('aboutCarousel');
    if (aboutCarousel) {
        // Bootstrap carousel will be automatically initialized
        // You can add custom event handlers here if needed
        
        // Example: add chapter indicator
        const chapterElement = document.createElement('div');
        chapterElement.className = 'chapter-indicator mt-3';
        chapterElement.innerHTML = '<span>CHAPTER <span class="chapter-number">1</span>/<span class="total-chapters">3</span></span>';
        aboutCarousel.appendChild(chapterElement);
        
        // Update chapter number on slide change
        aboutCarousel.addEventListener('slide.bs.carousel', function(event) {
            const chapterNumber = chapterElement.querySelector('.chapter-number');
            if (chapterNumber) {
                chapterNumber.textContent = event.to + 1;
            }
        });
    }
});