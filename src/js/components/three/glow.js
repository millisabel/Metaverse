import * as THREE from 'three';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { SingleGlow } from './singleGlow';

import { createLogger } from "../../utils/logger";
import { deepMergeOptions, shuffleArray } from '../../utils/utils';
import { resolveGlowColor, resolveGlowPosition, resolvePositioningMode } from '../../utilsThreeD/glowUtils';
import { SINGLE_GLOW_DEFAULT_OPTIONS } from './singleGlow';

export const GLOWS_DEFAULT_OPTIONS = {
    count: 1,
    colorPalette: [],
    shuffleColors: false,
    objectOptions: {
        sizePx: 100,
        size: { min: 1, max: 1 },
        scale: { min: 1, max: 1 },
        positioning: {
            mode: 'random',
            targetSelector: null,
            align: 'center center',
            offset: { x: 0, y: 0 },
            initialPosition: { x: 0, y: 0, z: 0 },
        },
        movement: {
            enabled: false,
            zEnabled: true,
            speed: 0.1,
            range: { x: 2, y: 2, z: 1 },
        },
        pulseControl: {
            enabled: false,
            randomize: false,
        },
        opacity: { min: 1, max: 1 },
    },
    shaderOptions: {
        color: null,
        opacity: { min: 0, max: 1 },
        scale: { min: 0, max: 1 },
        pulse: {
            enabled: false,
            speed: { min: 0.1, max: 0.3 },
            intensity: 2,
            randomize: false,
            sync: {
                scale: false,
                opacity: false,
            },
            highlightIntensity: 0,
        },
    },
    individualOptions: [],
};

/**
 * @extends {AnimationController}
 * @description Glow class
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options
 */
export class Glow extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, GLOWS_DEFAULT_OPTIONS);
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.glows = [];
    }

    /**
     * @description Sets up the scene
     * @returns {void}
     */
    async setupScene() {
        this._createGlows();
    }

    /**
     * @description Updates the glows
     * @returns {void}
     */
    update() {
        const time = performance.now() / 1000;
        this.glows.forEach(glow => glow.update(time));
        super.update();
    }

    /**
     * @description Cleans up the glows
     * @returns {void}
     */
    cleanup() {
        if (this.glows && Array.isArray(this.glows)) {
            this.glows.forEach((glow, index) => {
                if (glow && typeof glow.cleanup === 'function') {
                    glow.cleanup();
                }
            });
        }
        this.glows = [];
        super.cleanup();
    }

    /**
     * @description Gets the glow count
     * @returns {number}
     */
    _getGlowCount() {
        const individualOptions = Array.isArray(this.options.individualOptions) ? this.options.individualOptions : [];
        let count = this.options.count || 1;

        if (individualOptions.length > count) count = individualOptions.length;
        if (individualOptions.length > 0) {
            return typeof count === 'number' && count > individualOptions.length
                ? count
                : individualOptions.length;
        }
        if (typeof count === 'number' && count > 0) {
            return count;
        }
        return count;
    }


    /**
     * @description Prepares merged options for all glows
     * @returns {Array<Object>}
     */
    _prepareGlowOptions() {
        const glowCount = this._getGlowCount();
        const palette = this._preparePalette();
        const baseOptions = deepMergeOptions(SINGLE_GLOW_DEFAULT_OPTIONS, this.options);
        const optionsArray = [];

        for (let i = 0; i < glowCount; i++) {
            const currentBaseOptions = JSON.parse(JSON.stringify(baseOptions));
            const currentGroupOptions = JSON.parse(JSON.stringify(this.options));
            
            
            const optionsGlow = {
                objectOptions: this._getGlowObjectOptions(currentBaseOptions, currentGroupOptions, i, glowCount),
                shaderOptions: this._getGlowShaderOptions(currentBaseOptions, currentGroupOptions.individualOptions?.[i] || {}, i, palette),
            };
            optionsArray.push(optionsGlow);
        }

        return optionsArray;
    }

    /**
     * @description Prepares object options for a single glow
     * @private
     */
    _getGlowObjectOptions(baseOptions, groupOptions, index, glowCount) {
        const individual = groupOptions.individualOptions?.[index] || {};
        const objectOptions = deepMergeOptions(baseOptions.objectOptions, individual.objectOptions || {});
        
        objectOptions.positioning = objectOptions.positioning || {};
        objectOptions.positioning.container = this.container;
        
        this._preparePositioning(objectOptions, index, glowCount);
        
        return objectOptions;
    }

    /**
     * @description Prepares shader options for a single glow
     * @private
     */
    _getGlowShaderOptions(baseOptions, individual, index, palette) {
        const shaderOptions = deepMergeOptions(baseOptions.shaderOptions, individual.shaderOptions || {});

        shaderOptions.color = resolveGlowColor(
            index,
            individual.shaderOptions || {},
            individual,
            this.options,
            GLOWS_DEFAULT_OPTIONS,
            SINGLE_GLOW_DEFAULT_OPTIONS,
            palette
        );

        return shaderOptions;
    }

    /**
     * @description Prepares the palette
     * @returns {Array}
     */
    _preparePalette() {
        const groupOptions = this.options;
        let palette = Array.isArray(groupOptions.colorPalette) ? [...groupOptions.colorPalette] : [];
        if (groupOptions.shuffleColors && palette.length > 1) {
            palette = shuffleArray(palette);
        }
        return palette;
    }

    /**
     * @description Prepares the positioning
     * @param {Object} options - The options
     * @param {number} index - The index
     * @returns {void}
     */
    _preparePositioning(options, index, glowCount) {
        options.positioning = resolvePositioningMode(options);
        options.positioning.position = resolveGlowPosition(options, index, glowCount);
    }

    /**
     * @description Creates the glows with individual options
     * @returns {void}
     */
    _createGlows() {
        const optionsArray = this._prepareGlowOptions();
        
        optionsArray.forEach((options) => {
            
            const glow = new SingleGlow(options);
            glow.setup();
            
            if (glow.mesh) {
                this.scene.add(glow.mesh);
            }
            
            this.glows.push(glow);
        });
    }

    // setGlowScale(cardIndex, scale) {
    //     if (this.glows && this.glows[cardIndex]) {
    //         this.glows[cardIndex].setScale(scale);
    //     }
    // }

    /**
     * @description Sets the highlightIntensity value for a specific glow (for external sync)
     * @param {number} index - Glow index
     * @param {number} value - Target value (0..1)
     */
    // setGlowHighlightIntensity(index, value) {
    //     if (this.glows[index] && typeof this.glows[index].setHighlightIntensity === 'function') {
    //         this.glows[index].setHighlightIntensity(value);
    //     }
    // }

    /**
     * @description Sets the opacity value for a specific glow
     * @param {number} cardIndex - Glow index
     * @param {number} opacity - Target opacity value (0..1)
     */
    // setGlowOpacity(cardIndex, opacity) {
    //     console.log('setGlowOpacity', cardIndex, opacity);
    //     if (this.glows && this.glows[cardIndex]) {
    //         this.glows[cardIndex].setOpacity(opacity);
    //     }
    // }

    /**
     * @description Синхронизирует блик под карточкой с позицией и анимацией карточки
     * @param {Dynamics3D} card - объект карточки Dynamics3D
     * @param {number} glowIndex - индекс блика
     */
    // syncWithCard(card, glowIndex = 0) {
    //     if (!card || !this.glows || !this.glows[glowIndex]) return;
    //     this.glows[glowIndex].syncWithObjectPosition(card);
    // }
}

