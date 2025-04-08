// Navbar functionality
export const initNavbar = () => {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.navbar .nav-link');
    const sections = document.querySelectorAll('section');
    const scrollThreshold = 50;
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navItems = document.querySelectorAll('.navbar-nav .nav-item');
    const logo = document.querySelector('.navbar-brand-logo');

    // Проверка возможности отрисовки SVG
    const checkSVGSupport = () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.appendChild(path);
        return svg.getBBox && path.getTotalLength;
    };

    // Установка запасного логотипа
    const setFallbackLogo = () => {
        const logoContainer = document.querySelector('.navbar-brand');
        if (logoContainer) {
            logoContainer.innerHTML = '<img src="assets/icons/Logo.svg" alt="Logo" width="48" height="48">';
        }
    };

    // Проверка поддержки SVG при инициализации
    if (!checkSVGSupport()) {
        setFallbackLogo();
    }

    // AOS attribute management
    const handleAOSAttributes = () => {
        const isMobile = window.innerWidth < 992; // Bootstrap lg breakpoint
        navItems.forEach(item => {
            if (isMobile) {
                item.removeAttribute('data-aos');
                item.removeAttribute('data-aos-delay');
            } else {
                const index = Array.from(navItems).indexOf(item);
                item.setAttribute('data-aos', 'fade-down');
                item.setAttribute('data-aos-delay', `${(index + 1) * 100}`);
            }
        });
    };

    // Handle navigation links click
    const handleNavLinks = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');

                if (navbarCollapse.classList.contains('show')) {
                    bootstrap.Collapse.getInstance(navbarCollapse).hide();
                }
            });
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
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    };

    // Initialize all navbar functionality
    const init = () => {
        handleAOSAttributes();
        handleNavLinks();
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

        // Window resize handler
        window.addEventListener('resize', () => {
            handleAOSAttributes();
            AOS.refresh();
        });
    };

    init();
}; 