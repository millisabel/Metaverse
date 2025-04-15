export class MoreButton {
    constructor(container) {
        this.container = container;
        this.initialized = false;

        this.init();
    }

    init() {
        if (this.initialized) return;

        this.setupButtons();
        this.initialized = true;
    }

    setupButtons() {
        const moreButtons = this.container.querySelectorAll('.more-btn');
        
        moreButtons.forEach(button => {
            button.addEventListener('click', () => {
                const hiddenItems = button.previousElementSibling;
                hiddenItems.classList.toggle('show');
                button.textContent = hiddenItems.classList.contains('show') ? 'Less ←' : 'More →';

                if (hiddenItems.classList.contains('show')) {
                    const items = hiddenItems.querySelectorAll('.roadmap-item');
                    items.forEach((item, index) => {
                        item.style.animation = 'none';
                        void item.offsetWidth;
                        item.style.animation = `itemReveal 0.5s ease-out ${index * 0.1}s forwards`;
                        item.setAttribute('data-aos', 'item-reveal');
                    });

                    hiddenItems.style.animation = 'none';
                    void hiddenItems.offsetWidth;
                    hiddenItems.style.animation = 'containerReveal 0.3s ease-out forwards';
                    hiddenItems.setAttribute('data-aos', 'container-reveal');
                } else {
                    const items = hiddenItems.querySelectorAll('.roadmap-item');
                    items.forEach((item, index) => {
                        item.style.animation = `itemHide 0.3s ease-in ${index * 0.05}s forwards`;
                    });
                }
            });
        });
    }
}

export function initMoreButtons(container) {
    if (!container) {
        console.warn('MoreButton container not found');
        return;
    }

    return new MoreButton(container);
} 