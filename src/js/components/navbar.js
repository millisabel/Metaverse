// Navbar functionality
export const initNavbar = () => {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.navbar .nav-link');
    const sections = document.querySelectorAll('section');
    const scrollThreshold = 50;
    const navbarCollapse = document.querySelector('.navbar-collapse');

    // Handle navigation links click
    const handleNavLinks = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                e.target.classList.add('active');

                // If using mobile menu, close it after click
                if (navbarCollapse.classList.contains('show')) {
                    bootstrap.Collapse.getInstance(navbarCollapse).hide();
                }
            });
        });
    };

    // Handle mobile menu toggle
    const handleMobileMenu = () => {
        navbarCollapse.addEventListener('show.bs.collapse', () => {
            // Refresh AOS animations when menu opens
            setTimeout(() => {
                AOS.refresh();
            }, 150); // Небольшая задержка для уверенности, что меню полностью открылось
        });
    };

    // Handle scroll-based active section
    const handleActiveSection = () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    };

    // Handle navbar transparency
    const handleNavbarTransparency = () => {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('navbar-transparent');
        } else {
            navbar.classList.remove('navbar-transparent');
        }
    };

    // Initialize all navbar functionality
    const init = () => {
        handleNavLinks();
        handleMobileMenu();
        handleNavbarTransparency();

        // Add scroll event listener with throttle
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleActiveSection();
                    handleNavbarTransparency();
                    ticking = false;
                });
                ticking = true;
            }
        });
    };

    init();
}; 