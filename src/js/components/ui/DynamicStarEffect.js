import { deepMergeOptions } from '../../utils/utils';

const DEFAULT_OPTIONS_STAR_DYNAMICS = {
    size: null,
    color: null,
    opacity: { min: 0, max: 1 },
    scale: { min: 0.5, max: 1.5 },
    visibleDuration: { min: 4000, max: 6000 },
    hiddenDuration: { min: 2000, max: 3000 },
    fadeDuration: 2000,
    position: {
        mode: 'random',
        x: [0, 100],
        y: [0, 100],
        anchorElement: null,
        offset: { x: 0, y: 0 },
        initial: { x: 0, y: 0 }
    },
};

class DynamicStarEffect {
    constructor(id_Parent, options = {}) {
        this.parentEl = document.getElementById(id_Parent);
        if (!this.parentEl) return;

        this.options = deepMergeOptions(DEFAULT_OPTIONS_STAR_DYNAMICS, options);

        this.starEl = null;
        this._timeout = null;
        this._isDestroyed = false;
    }

    init() {
        this._setStylesParent();
        this._createStarElement();
        const pos = this._getPosition();
        this._setStarPosition(pos.x, pos.y);
        this._setStarCSSVars(this.options.cssVars);
        this._showStar();
    }

    _setStylesParent() {
        if (this.parentEl.style.position === 'static') {
            this.parentEl.style.position = 'relative';
        }
    }

    /**
     * Создать DOM-элемент звезды
     * @private
     */
    _createStarElement() {
        this.starEl = document.createElement('span');
        this.starEl.className = 'star star--pulse';

        this.starEl.style.position = 'absolute';
        this.starEl.style.opacity = this.options.opacity.min;
        this.starEl.style.transform = `scale(${this.options.scale.min})`;

        this._setStarSize(this.options.size);
        this._setStarColor(this.options.color);
        this.parentEl.appendChild(this.starEl);
    }

    /**
     * @description Set the color of the star through custom property
     * @private
     * @param {string} color - hex
     */
    _setStarColor(color) {
        if (color) {
            this.starEl.style.setProperty('--star-color', color);
            this.starEl.style.filter = `drop-shadow(0 0 10px ${color})`;
        }
    }

    _setStarSize(size) {
        if (size) {
            this.starEl.style.width = size;
            this.starEl.style.height = size;
        }
    }

    /**
     * @description Set the CSS variables of the star
     * @private
     * @param {Object} vars - Custom CSS variables
     */
    _setStarCSSVars(vars) {
        if (!vars) return;
        for (const key in vars) {
            this.starEl.style.setProperty(key, vars[key]);
        }
    }

    /**
     * @description Set the position of the star (px relative to the parent)
     * @private
     * @param {number} x
     * @param {number} y
     */
    _setStarPosition(x, y) {
        this.starEl.style.left = `${x}px`;
        this.starEl.style.top = `${y}px`;
    }

    /**
     * @description Get the position of the star according to the options
     * @private
     * @returns {{x:number,y:number}}
     */
    _getPosition() {
        const { mode, x, y, anchorElement, offset, initial } = this.options.position;
        const parentRect = this.parentEl.getBoundingClientRect();
        if (mode === 'fixed') {
            return {
                x: initial.x,
                y: initial.y
            };
        } else if (mode === 'element' && anchorElement) {
            const anchorRect = anchorElement.getBoundingClientRect();
            return {
                x: anchorRect.left - parentRect.left + (anchorRect.width / 2) + (offset?.x || 0),
                y: anchorRect.top - parentRect.top + (anchorRect.height / 2) + (offset?.y || 0)
            };
        } else { 
            const xPercent = this._randomInRange(x);
            const yPercent = this._randomInRange(y);
            return {
                x: (parentRect.width * xPercent) / 100,
                y: (parentRect.height * yPercent) / 100
            };
        }
    }

    /**
     * @description Get a random value from a range
     * @private
     * @param {{min:number,max:number}|[number,number]} range
     * @returns {number}
     */
    _randomInRange(range) {
        if (Array.isArray(range)) {
            const [min, max] = range;
            return Math.random() * (max - min) + min;
        } else if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
            return Math.random() * (range.max - range.min) + range.min;
        }
        return 0;
    }

    /**
     * @description Show the star
     * @private
     * @returns {void}
     */
    _showStar() {
        if (this._isDestroyed) return;
        const visibleDuration = this._randomInRange(this.options.visibleDuration);
        const hiddenDuration = this._randomInRange(this.options.hiddenDuration);
        const fadeDuration = this.options.fadeDuration;

        // 1. Сброс к невидимому состоянию
        this.starEl.style.transition = 'none';
        this.starEl.style.opacity = this.options.opacity.min;
        this.starEl.style.transform = `scale(${this.options.scale.min})`;

        // 2. Запуск fade-in через transition
        setTimeout(() => {
            this.starEl.style.transition = `opacity ${fadeDuration}ms, transform ${fadeDuration}ms`;
            this.starEl.style.opacity = this.options.opacity.max;
            this.starEl.style.transform = `scale(${this.options.scale.max})`;

            // 3. После fade-in — держим звезду видимой
            setTimeout(() => {
                // 4. Fade-out
                this.starEl.style.opacity = this.options.opacity.min;
                this.starEl.style.transform = `scale(${this.options.scale.min})`;

                // 5. После fade-out — пауза и повтор
                setTimeout(() => {
                    const pos = this._getPosition();
                    this._setStarPosition(pos.x, pos.y);
                    this._timeout = setTimeout(() => this._showStar(), hiddenDuration);
                }, fadeDuration);
            }, visibleDuration);
        }, 20); 
    }

    /**
     * @description Destroy the star
     * @returns {void}
     */
    destroy() {
        this._isDestroyed = true;
        if (this._timeout) clearTimeout(this._timeout);
        if (this.starEl && this.starEl.parentNode) {
            this.starEl.parentNode.removeChild(this.starEl);
        }
        this.starEl = null;
        this._timeout = null;
    }
} 

export const dynamicStar = (id_Parent, options = {}) => {
    const star = new DynamicStarEffect(id_Parent, options);
    return star.init();
}