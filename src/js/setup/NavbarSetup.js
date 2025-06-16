import { initializeNavbar } from '../components/common/navbar';


export class NavbarSetup {
    constructor() {
        this.NAVBAR_SELECTORS = {
            NAVBAR_SELECTOR: '.navbar',
            NAVBAR_ITEMS_SELECTOR: '.navbar-nav .nav-item',
            NAVBAR_LINKS_SELECTOR: '.navbar-nav .nav-link',
            NAVBAR_COLLAPSE_CLASS: '.navbar-collapse',
            NAVBAR_LINKS_ACTIVE_CLASS: 'active',
            NAVBAR_SCROLL_CLASS: 'navbar-scrolled',
            NAVBAR_ANIMATE_CLASS: 'animate',
            NAVBAR_SHOW_MENU_CLASS: 'show',
        };

        this.init();
    }

    init() { 
        this.initNavbar();
        this.initNavbarToggler();
    }

    initNavbar() {
        initializeNavbar(this.NAVBAR_SELECTORS);
    }

    initNavbarToggler() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler) {
            navbarToggler.addEventListener('mouseup', (e) => {
                navbarToggler.blur();
            });
        }
    }
}

export function initNavbar() {
    const navbarSetup = new NavbarSetup();
}


