import { typeText, getClassSelector,  deepMergeOptions, eraseText} from '../../utils/utils';	

const DEFAULT_OPTIONS = {
    classes: {
        button: 'more-btn',
        showItems: 'show',
        hiddenItems: 'hidden-items',
        list: 'roadmap-quarter-list',
    },
    revealDelay: 100,
    typingSpeed: 20,
    eraseSpeed: 15,
};

/**
 * @description Class for handling the "More" button in the roadmap section
 * 
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options for the MoreButton
 * @property {Object} options - The options for the MoreButton
 * @property {HTMLElement} container - The container element
 * @property {boolean} initialized - Whether the MoreButton has been initialized
 * 
 */
export class MoreButton {
    constructor(container, options = {}) {
        this.container = container;
        this.initialized = false;
        
        this.options = deepMergeOptions(DEFAULT_OPTIONS, options);

        this._init();
    }

    /**
     * @description Initializes the MoreButton
     * @returns {void}
     */
    _init() {
        if (this.initialized) return;

        this._setupButtons();    
        this.initialized = true;
    }

    /**
     * @description Sets up the buttons for the MoreButton
     * @returns {void}
     */
    _setupButtons() {
        const moreButtons = this.container.querySelectorAll(getClassSelector(this.options.classes.button));
        
        moreButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                
                const hiddenItems = button.previousElementSibling;
                if (!hiddenItems || !hiddenItems.classList.contains(this.options.classes.hiddenItems)) {
                    return;
                }
                
                const items = hiddenItems.querySelector(getClassSelector(this.options.classes.list)).querySelectorAll('li');
                if (!items.length) {
                    return;
                }

                if (hiddenItems.classList.contains(this.options.classes.showItems)) {
                    this._hideItems(items, button, hiddenItems);
                } else {
                    this._revealItems(items, button, hiddenItems);
                }
            });
        });
    }

    /**
     * @description Sets the state of the button
     * @param {HTMLElement} button - The button element
     * @param {boolean} disabled - Whether the button is disabled
     * @returns {void}
     */
    _setButtonState(button, disabled) {
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.5' : '1';
        button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }

    /**
     * @description Resets the state of the items
     * @param {NodeList|Array} items - The items
     * @returns {void}
     */
    _resetItemsState(items) {
        items.forEach(item => {
            if (!item.hasAttribute('data-original-text')) {
                item.setAttribute('data-original-text', item.textContent);
            }
            item.textContent = '';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.style.transition = 'none';
            item.style.display = 'none'; 
        });
    }

    /**
     * @description Reveals the items
     * @param {NodeList|Array} items - The items
     * @param {HTMLElement} button - The button element
     * @param {HTMLElement} hiddenItems - The hidden items element
     * @returns {Promise}
     */
    async _revealItems(items, button, hiddenItems) {
        this._setButtonState(button, true);
        hiddenItems.classList.add(this.options.classes.showItems);
        button.textContent = 'Less ←';

        this._resetItemsState(items);

        hiddenItems.style.overflow = 'hidden';
        hiddenItems.style.transition = 'height 0.3s ease-out';
        hiddenItems.style.height = '0';

        await new Promise(resolve => setTimeout(resolve, 50));

        let currentIndex = 0;

        const revealNextItem = async () => {
            if (currentIndex >= items.length) {
                hiddenItems.style.height = 'auto';
                hiddenItems.style.overflow = 'visible';
                this._setButtonState(button, false);
                return;
            }

            const item = items[currentIndex];
            item.style.display = 'block';
            item.textContent = ''
            item.style.minHeight = '1em';

            await new Promise(resolve => setTimeout(resolve, 20));

            hiddenItems.style.height = hiddenItems.scrollHeight + 'px';

            await new Promise(resolve => setTimeout(resolve, 300));

            await typeText(item, item.getAttribute('data-original-text'), this.options.typingSpeed);

            item.style.minHeight = '';

            hiddenItems.style.height = hiddenItems.scrollHeight + 'px';

            await new Promise(resolve => setTimeout(resolve, this.options.revealDelay));

            currentIndex++;
            revealNextItem();
        };

        revealNextItem();
    }

    /**
     * @description Updates the height of the container by visible items
     * @param {HTMLElement} hiddenItems - The container element
     * @param {NodeList|Array} items - The items list
     * @param {number} [count] - The number of items to consider (e.g., up to index)
     * @returns {void}
     */
    _updateContainerHeight(hiddenItems, items, count = null) {
        let visibleItems;
        if (count === null) {
            visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
        } else {
            visibleItems = Array.from(items).slice(0, count);
        }
        const totalHeight = visibleItems.reduce((height, item) => height + item.offsetHeight, 0);
        hiddenItems.style.height = `${totalHeight}px`;
    }

    /**
     * @description Hides the items
     * @param {NodeList|Array} items - The items list
     * @param {HTMLElement} button - The button element
     * @param {HTMLElement} hiddenItems - The hidden items element
     * @returns {void}
     */
    _hideItems(items, button, hiddenItems) {
        this._setButtonState(button, true);

        button.textContent = 'More →';
    
        hiddenItems.style.transition = 'height 0.4s ease';
        hiddenItems.style.overflow = 'hidden';
    
        this._hideItemsRecursive(items, button, hiddenItems, items.length - 1);
    }

    /**
     * @description Recursively hides items with the erase effect and height animation
     * @param {NodeList|Array} items - The items list
     * @param {HTMLElement} button - The button element
     * @param {HTMLElement} hiddenItems - The hidden items element
     * @param {number} index - The current index
     * @returns {Promise}
     */ 
    async _hideItemsRecursive(items, button, hiddenItems, index) {
        if (index < 0) {
            hiddenItems.style.height = '0';
            hiddenItems.classList.remove(this.options.classes.showItems);
            this._setButtonState(button, false);
            return;
        }

        const item = items[index];
        await eraseText(item, this.options.eraseSpeed);
        item.style.display = 'none';

        this._updateContainerHeight(hiddenItems, items, index);

        await new Promise(resolve => setTimeout(resolve, this.options.revealDelay));
        await this._hideItemsRecursive(items, button, hiddenItems, index - 1);
    }
}