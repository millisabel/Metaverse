import { typeText } from '../utils/utils';	

export class MoreButton {
    constructor(container, options = {}) {
        this.container = container;
        this.initialized = false;
        
        this.options = {
            buttonSelector: options.buttonSelector || '.more-btn',
            hiddenElementsSelector: options.hiddenElementsSelector || '.hidden-items',
            revealDelay: options.revealDelay || 100,
            typingSpeed: options.typingSpeed || 20 
        };

        this.init();
    }

    init() {
        if (this.initialized) return;

        this.setupButtons();
        this.initialized = true;
    }

    setupButtons() {
        const moreButtons = this.container.querySelectorAll(this.options.buttonSelector);
        
        moreButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                
                const hiddenItems = button.previousElementSibling;
                if (!hiddenItems || !hiddenItems.classList.contains('hidden-items')) {
                    return;
                }
                
                const items = hiddenItems.querySelector('.roadmap-quarter-list').querySelectorAll('li');
                if (!items.length) {
                    return;
                }

                if (hiddenItems.classList.contains('show')) {
                    this.hideItems(items, button, hiddenItems);
                } else {
                    this.revealItems(items, button, hiddenItems);
                }
            });
        });
    }

    setButtonState(button, disabled) {
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.5' : '1';
        button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }

    revealItems(items, button, hiddenItems) {
        this.setButtonState(button, true);
        
        hiddenItems.classList.add('show');
        button.textContent = 'Less ←';

        items.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'none';
            item.style.display = 'block'; 
        });

        hiddenItems.style.height = '0';
        hiddenItems.style.overflow = 'hidden';
        hiddenItems.style.transition = 'height 0.3s ease-out';

        const itemStyle = window.getComputedStyle(items[0]);
        const marginBottom = parseFloat(itemStyle.marginBottom);
        const marginTop = parseFloat(itemStyle.marginTop);

        let currentIndex = 0;
        
        const revealNextItem = async () => {
            if (currentIndex >= items.length) {
                const finalHeight = hiddenItems.scrollHeight;
                hiddenItems.style.height = `${finalHeight}px`;
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                hiddenItems.style.height = 'auto';
                hiddenItems.style.overflow = 'visible';
                
                this.setButtonState(button, false);
                return;
            }
            
            const item = items[currentIndex];
            
            if (!item.hasAttribute('data-original-text')) {
                item.setAttribute('data-original-text', item.textContent);
            }
            
            const originalText = item.getAttribute('data-original-text');
            
            item.style.animation = 'none';
            void item.offsetWidth;
            
            item.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            
            const visibleItems = Array.from(items).slice(0, currentIndex + 1);
            const totalHeight = visibleItems.reduce((height, item, index) => {
                const itemHeight = item.offsetHeight;
                const margin = index < visibleItems.length - 1 ? marginBottom : 0;
                return height + itemHeight + margin;
            }, 0);
            
            hiddenItems.style.height = `${totalHeight}px`;
            
            await typeText(item, originalText, this.options.typingSpeed);
            
            currentIndex++;
            
            if (currentIndex < items.length) {
                await new Promise(resolve => setTimeout(resolve, this.options.revealDelay));
                revealNextItem();
            } else {
                this.setButtonState(button, false);
            }
        };
        
        revealNextItem();
    }

    hideItems(items, button, hiddenItems) {
        this.setButtonState(button, true);
        
        hiddenItems.classList.remove('show');
        button.textContent = 'More →';

        hiddenItems.style.transition = 'height 0.5s ease-out';
        hiddenItems.style.overflow = 'hidden';

        const hideNextItem = async (index) => {
            if (index < 0) {
                hiddenItems.style.height = '0';
                this.setButtonState(button, false);
                return;
            }

            const item = items[index];
            
            item.style.display = 'none';
            
            const visibleItems = Array.from(items).slice(0, index);
            const totalHeight = visibleItems.reduce((height, item) => {
                return height + item.offsetHeight;
            }, 0);
            
            hiddenItems.style.height = `${totalHeight}px`;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            hideNextItem(index - 1);
        };

        hideNextItem(items.length - 1);
    }
}

export function initMoreButtons(container) {
    if (!container) {
        console.warn('MoreButton container not found');
        return;
    }

    return new MoreButton(container);
} 