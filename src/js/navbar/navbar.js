document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    
    // Add navbar highlight
    if (navbar) {
        const highlight = document.createElement('div');
        highlight.className = 'navbar-highlight';
        navbar.appendChild(highlight);
    }
    
    // Add scroll handler for navbar state change
    function checkScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }
    
    checkScroll();
    
    window.addEventListener('scroll', checkScroll);
});