// Function for correct focus on modal

function initModal() {
    let lastTriggerButton = null;
    const modals = document.querySelectorAll('.modal');
  
    modals.forEach(modal => {
      modal.addEventListener('show.bs.modal', (event) => {
        lastTriggerButton = event.relatedTarget;
        const modalId = modal.getAttribute('id');
      });
  
      modal.addEventListener('hide.bs.modal', (event) => {
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