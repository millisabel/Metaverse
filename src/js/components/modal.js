// Function for correct focus on modal

function initModal() {
    let lastTriggerButton = null;
    const modals = document.querySelectorAll('.modal');
  
    function logFocus(eventType, element, modalId) {
      console.log(`[${eventType}] Modal ID: ${modalId}, Focused element:`, document.activeElement);
    }
  
    modals.forEach(modal => {
      modal.addEventListener('show.bs.modal', (event) => {
        lastTriggerButton = event.relatedTarget;
        const modalId = modal.getAttribute('id');
        logFocus('Modal opening triggered', lastTriggerButton, modalId);
      });
  
      modal.addEventListener('shown.bs.modal', () => {
        logFocus('Modal shown', document.activeElement, modal.getAttribute('id'));
      });
  
      modal.addEventListener('hide.bs.modal', (event) => {
        const modalId = modal.getAttribute('id');
        if (lastTriggerButton) {
          setTimeout(() => {
            lastTriggerButton.focus();
            logFocus('Focus returned before hide', lastTriggerButton, modalId);
  
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
  
      modal.addEventListener('hidden.bs.modal', () => {
        logFocus('Modal hidden', document.activeElement, modal.getAttribute('id'));
      });
    });
    }

export default initModal;