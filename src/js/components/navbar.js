// Navbar functionality
export const initNavbar = () => {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.navbar .nav-link');
    const sections = document.querySelectorAll('section');
    const scrollThreshold = 50;
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navItems = document.querySelectorAll('.navbar-nav .nav-item');

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
        // Reset AOS attributes when menu is hidden
        navbarCollapse.addEventListener('hidden.bs.collapse', () => {
            navItems.forEach(item => {
                item.setAttribute('data-aos-delay', item.getAttribute('data-aos-delay'));
                item.classList.remove('aos-animate');
            });
        });

        // Refresh AOS when menu is shown
        navbarCollapse.addEventListener('shown.bs.collapse', () => {
            navItems.forEach(item => {
                item.classList.remove('aos-animate');
            });
            setTimeout(() => {
                AOS.refresh();
                navItems.forEach(item => {
                    item.classList.add('aos-animate');
                });
            }, 50);
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