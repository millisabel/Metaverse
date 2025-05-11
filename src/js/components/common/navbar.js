import { isMobile } from "../../utils/utils";
import { AnimationObserverCSS } from "../../utils/animationObserver_CSS";

/**
 * Initializes the navigation bar: handles active section highlighting, menu item animation,
 * navbar transparency on scroll, and navigation link click behavior.
 *
 * @param {Object} selectors - An object containing all required CSS selectors and class names.
 * @param {string} selectors.NAVBAR_SELECTOR - Selector for the main navbar element.
 * @param {string} selectors.NAVBAR_ITEMS_SELECTOR - Selector for all navbar menu items (li).
 * @param {string} selectors.NAVBAR_LINKS_SELECTOR - Selector for all navbar links (a).
 * @param {string} selectors.NAVBAR_COLLAPSE_CLASS - Selector for the collapsible menu container.
 * @param {string} selectors.NAVBAR_LINKS_ACTIVE_CLASS - Class name for the active nav link.
 * @param {string} selectors.NAVBAR_SCROLL_CLASS - Class name to apply when navbar is scrolled.
 * @param {string} selectors.NAVBAR_ANIMATE_CLASS - Class name for animating nav items.
 * @param {string} selectors.NAVBAR_SHOW_MENU_CLASS - Class name indicating the menu is open (Bootstrap).
 * @param {string} selectors.NAVBAR_LISTENER_EVENT_SHOW - Event name for showing the mobile menu (e.g. 'show.bs.collapse').
 * @param {string} selectors.NAVBAR_LISTENER_EVENT_HIDE - Event name for hiding the mobile menu (e.g. 'hide.bs.collapse').
 *
 * @example
 * initializeNavbar({
 *   NAVBAR_SELECTOR: '.navbar',
 *   NAVBAR_ITEMS_SELECTOR: '.navbar-nav .nav-item',
 *   NAVBAR_LINKS_SELECTOR: '.navbar .nav-link',
 *   NAVBAR_COLLAPSE_CLASS: '.navbar-collapse',
 *   NAVBAR_LINKS_ACTIVE_CLASS: 'active',
 *   NAVBAR_SCROLL_CLASS: 'navbar-scrolled',
 *   NAVBAR_ANIMATE_CLASS: 'navbar-animate-in',
 *   NAVBAR_SHOW_MENU_CLASS: 'show',
 *   NAVBAR_LISTENER_EVENT_SHOW: 'show.bs.collapse',
 *   NAVBAR_LISTENER_EVENT_HIDE: 'hide.bs.collapse'
 * });
 */

export const initializeNavbar = (selectors) => {
    const navbar = document.querySelector(selectors.NAVBAR_SELECTOR);
    const navItems = document.querySelectorAll(selectors.NAVBAR_ITEMS_SELECTOR);
    const navLinks = document.querySelectorAll(selectors.NAVBAR_LINKS_SELECTOR);
    const navbarCollapseClass = document.querySelector(selectors.NAVBAR_COLLAPSE_CLASS);
    const navbarActiveClass = selectors.NAVBAR_LINKS_ACTIVE_CLASS;
    const navbarScrollClass = selectors.NAVBAR_SCROLL_CLASS;
    const navbarAnimateClass = selectors.NAVBAR_ANIMATE_CLASS;
    const navbarShowMenuClass = selectors.NAVBAR_SHOW_MENU_CLASS;

    const scrollThreshold = 50;

    // Active section ===
    new AnimationObserverCSS(
        ['.star', '.game-character--badge'],
        (activeSectionId) => {
            highlightActiveNavLink(navLinks, activeSectionId, navbarActiveClass);
        }
    );

    // Navbar transparency ===
    const handleNavbarTransparency = () => {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add(navbarScrollClass);
        } else {
            navbar.classList.remove(navbarScrollClass);
        }
    };

    // Navbar items animation ===
    const animateNavItems = () => {
        navItems.forEach(item => item.classList.remove(navbarAnimateClass));
        navItems.forEach(item => item.style.opacity = '0');

        const animateNext = (index) => {
            if (index >= navItems.length) return;
            const item = navItems[index];
            item.classList.add(navbarAnimateClass);

            const onAnimationEnd = () => {
                item.removeEventListener('animationend', onAnimationEnd);
                animateNext(index + 1);
            };
            item.addEventListener('animationend', onAnimationEnd);
        };

        animateNext(0);
    };

    // Navbar links click ===
    const handleNavLinks = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                navLinks.forEach(l => l.classList.remove(navbarActiveClass));
                e.target.classList.add(navbarActiveClass);

                if (navbarCollapseClass.classList.contains(navbarShowMenuClass)) {
                    bootstrap.Collapse.getInstance(navbarCollapseClass).hide();
                }
            });
        });
    };

    function highlightActiveNavLink(navLinks, activeSectionId, activeClass = navbarActiveClass) {
        navLinks.forEach(link => {
            link.classList.remove(activeClass);
            if (link.getAttribute('href') === `#${activeSectionId}`) {
                link.classList.add(activeClass);
            }
        });
    }

    // Initialize ===
    const init = () => {
        if (isMobile(1400)) {
            navbarCollapseClass.addEventListener('shown.bs.collapse', animateNavItems);
            navbarCollapseClass.addEventListener('hide.bs.collapse', () => {
                navItems.forEach(item => {
                    item.classList.remove(navbarAnimateClass);
                    item.style.opacity = '0';
                });
            });
        } else {
            window.addEventListener('DOMContentLoaded', animateNavItems);
        }
        handleNavLinks();

        // Scroll only for navbar transparency!
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleNavbarTransparency();
                    ticking = false;
                });
                ticking = true;
            }
        });
    };

    init();
}; 