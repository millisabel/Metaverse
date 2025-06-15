import { isMobile } from "../../utils/utils";
import { AnimationObserverCSS } from "../../utils/animationObserver_CSS";

export function animateNavItems(navItems, navbarAnimateClass) {
    navItems.forEach(item => {
      item.classList.remove(navbarAnimateClass);
      item.style.opacity = '0';
      if (item._onAnimationEnd) {
        item.removeEventListener('animationend', item._onAnimationEnd);
        delete item._onAnimationEnd;
      }
    });
  
    const animateNext = (index) => {
      if (index >= navItems.length) return;
      const item = navItems[index];
      item.classList.add(navbarAnimateClass);
  
      const onAnimationEnd = () => {
        item.removeEventListener('animationend', onAnimationEnd);
        delete item._onAnimationEnd;
        animateNext(index + 1);
      };
      item._onAnimationEnd = onAnimationEnd;
      item.addEventListener('animationend', onAnimationEnd);
    };
  
    animateNext(0);
  }

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

    /**
     * @description Handles the active section
     * @returns {void}
     */
    new AnimationObserverCSS(
        [],
        (activeSectionId) => {
            highlightActiveNavLink(navLinks, activeSectionId, navbarActiveClass);
        }
    );

    /**
     * @description Handles the navbar transparency
     * @returns {void}
     */
    const handleNavbarTransparency = () => {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add(navbarScrollClass);
        } else {
            navbar.classList.remove(navbarScrollClass);
        }
    };

    /**
     * @description Handles the navbar links click
     * @returns {void}
     */
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

    /**
     * @description Highlights the active navbar link
     * @param {NodeList} navLinks - The navbar links
     * @param {string} activeSectionId - The active section id
     * @param {string} activeClass - The active class
     * @returns {void}
     */
    function highlightActiveNavLink(navLinks, activeSectionId, activeClass = navbarActiveClass) {
        navLinks.forEach(link => {
            link.classList.remove(activeClass);
            if (link.getAttribute('href') === `#${activeSectionId}`) {
                link.classList.add(activeClass);
            }
        });
    }

    /**
     * @description Initializes the navbar
     * @returns {void}
     */
    const init = () => {
        if (isMobile(1400)) {
            navbarCollapseClass.addEventListener('shown.bs.collapse', () => {
                animateNavItems(navItems, navbarAnimateClass);
            });
            navbarCollapseClass.addEventListener('hide.bs.collapse', () => {
                navItems.forEach(item => {
                    item.classList.remove(navbarAnimateClass);
                    item.style.opacity = '0';
                });
            });
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                animateNavItems(navItems, navbarAnimateClass);
            });
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

    /**
     * @description Handles the navbar resize
     * @returns {void}
     */
    window.addEventListener('resize', () => {
        const navItems = document.querySelectorAll(selectors.NAVBAR_ITEMS_SELECTOR);
        const isNowMobile = isMobile(1400);
    
        navItems.forEach(item => {
            item.classList.remove(navbarAnimateClass);
            item.style.opacity = '';
            item.style.animationPlayState = '';
            item.removeAttribute('data-animation-paused');
            if (item._onAnimationEnd) {
                item.removeEventListener('animationend', item._onAnimationEnd);
                delete item._onAnimationEnd;
            }
        });
    
        if (navbarCollapseClass.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapseClass)
                || new bootstrap.Collapse(navbarCollapseClass, {toggle: false});
            bsCollapse.hide();
        }
    
        if (!isNowMobile) {
            animateNavItems(navItems, navbarAnimateClass);
        }
    });

    init();
}; 