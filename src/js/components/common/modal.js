import { animateNavItems } from './navbar.js';
import { isMobile } from '../../utils/utils.js';

// Function for correct focus on modal

/**
 * Initializes focus management for all Bootstrap modals on the page.
 *
 * Ensures that when a modal is closed, focus returns to the element (button or link)
 * that triggered the modal. This improves accessibility and keyboard navigation.
 *
 * - Remembers the last trigger element that opened each modal.
 * - On modal close, returns focus to the trigger element.
 * - If focus is not restored, attempts to blur the close button and refocus the trigger.
 * - Logs warnings if focus cannot be restored.
 *
 * @function initModal
 * @example
 * import initModal from './modal.js';
 * // Call once after DOM is ready
 * initModal();
 *
 * // HTML example:
 * // <button data-bs-toggle="modal" data-bs-target="#contactModal">Open Modal</button>
 * // <div class="modal" id="contactModal">...</div>
 */
function initModal() {
    let lastTriggerButton = null;
    const modals = document.querySelectorAll('.modal');

    const hiddenItemsSelector = ['.navbar'];

    // Adjust navbar for modal
    modals.forEach(modal => {
      modal.addEventListener('show.bs.modal', () => adjustNavbarForModal(true, hiddenItemsSelector));
      modal.addEventListener('hidden.bs.modal', () => adjustNavbarForModal(false, hiddenItemsSelector));
    });

    function adjustNavbarForModal(open, selectors) {
      if (!selectors) return;

      selectors.forEach(selector => {
        const item = document.querySelector(selector);
        if (!item) return;
    
        if (open) {
          if (!item.hasAttribute('data-original-display')) {
            const computedDisplay = window.getComputedStyle(item).display;
            item.setAttribute('data-original-display', computedDisplay);
          }
          item.style.display = 'none';
        } else {
          const originalDisplay = item.getAttribute('data-original-display') || '';
          item.style.display = originalDisplay;
          item.removeAttribute('data-original-display');
        }
    
        if (selector === '.navbar' && !isMobile(1400)) {
          const navItems = document.querySelectorAll('.navbar-nav .nav-item');
          const navbarAnimateClass = 'animate'; 
          animateNavItems(navItems, navbarAnimateClass);
        }
      });
    }
    
    // Focus management for modals
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