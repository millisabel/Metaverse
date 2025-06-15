import { animateNavItems } from './navbar.js';
import { isMobile } from '../../utils/utils.js';

const DEFAULT_OPTIONS = {
    selectors: {
        modal: '.modal',
        navbar: '.navbar',
        hiddenItemsSelector: ['.navbar'],
    },
    attribute: 'data-original-display'
}

/**
 * @description Initializes focus management for all Bootstrap modals on the page.
 * @returns {void}
 */
function initModal(selector = DEFAULT_OPTIONS.selectors.modal, hiddenItemsSelector = [DEFAULT_OPTIONS.selectors.navbar]) {
    let lastTriggerButton = null;
    const modals = document.querySelectorAll(selector);

    modals.forEach(modal => {
      modal.addEventListener('show.bs.modal', () => adjustNavbarForModal(true, hiddenItemsSelector));
      modal.addEventListener('hidden.bs.modal', () => adjustNavbarForModal(false, hiddenItemsSelector));
    });

    /**
     * @description Adjusts the navbar for the modal
     * @param {boolean} open - Whether the modal is open
     * @param {Array<string>} selectors - The selectors to adjust
     * @returns {void}
     */
    function adjustNavbarForModal(open, selectors) {
      if (!selectors) return;

      selectors.forEach(selector => {
        const item = document.querySelector(selector);
        if (!item) return;
    
        if (open) {
          if (!item.hasAttribute(DEFAULT_OPTIONS.selectors.attribute)) {
            const computedDisplay = window.getComputedStyle(item).display;
            item.setAttribute(DEFAULT_OPTIONS.selectors.attribute, computedDisplay);
          }
          item.style.display = 'none';
        } else {
          const originalDisplay = item.getAttribute(DEFAULT_OPTIONS.attribute) || '';
          item.style.display = originalDisplay;
          item.removeAttribute(DEFAULT_OPTIONS.attribute);
        }
    
        if (selector === '.navbar' && !isMobile(1400)) {
          const navItems = document.querySelectorAll('.navbar-nav .nav-item');
          const navbarAnimateClass = 'animate'; 
          animateNavItems(navItems, navbarAnimateClass);
        }
      });
    }
    
    /**
     * @description Focus management for modals
     * @returns {void}
     */
    modals.forEach(modal => {
      modal.addEventListener('show.bs.modal', (event) => {
        lastTriggerButton = event.relatedTarget;
      });
  
      modal.addEventListener('hide.bs.modal', () => {
        const modalId = modal.getAttribute('id');
        if (lastTriggerButton) {
          setTimeout(() => {
            lastTriggerButton.focus();
  
            if (document.activeElement !== lastTriggerButton) {
              console.warn(`[${modalId}] Focus did not move, forcing blur on btn-close`);
              const btnClose = modal.querySelector('.btn-close');
              if (btnClose) btnClose.blur();
              lastTriggerButton.focus();
            }
          }, 0); 
        } else {
          console.warn(`[${modalId}] No trigger button found to return focus`);
        }
      });
    });
}

export default initModal;