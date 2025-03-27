// Navbar scroll behavior
const handleNavbarTransparency = () => {
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 50; // Порог скролла в пикселях

    const toggleTransparency = () => {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('navbar-transparent');
        } else {
            navbar.classList.remove('navbar-transparent');
        }
    };

    // Инициализация
    toggleTransparency();

    // Добавляем обработчик события scroll с throttle
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                toggleTransparency();
                ticking = false;
            });
            ticking = true;
        }
    });
};

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', handleNavbarTransparency); 