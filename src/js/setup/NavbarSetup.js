import { createLogger } from '../utils/logger';

import { initializeNavbar } from '../components/common/navbar';


export class NavbarSetup {
    constructor() {

        this.name = 'NavbarSetup';
        this.logger = createLogger(this.name);

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
        this.logger.log({
            conditions: ['init'],
            functionName: 'init'
        });

        this.initNavbar();
    }

    initNavbar() {
        this.logger.log({
            conditions: ['initNavbar'],
            functionName: 'initNavbar'
        });
        initializeNavbar(this.NAVBAR_SELECTORS);
    }
}

export function initNavbar() {
    const navbarSetup = new NavbarSetup();
}


