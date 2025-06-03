import * as THREE from 'three';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { SingleGlow } from './singleGlow';

import { createLogger } from "../../utils/logger";
// import { getGlowGroupOptions, getSingleGlowOptions, getAllSingleGlowOptions } from '../../utilsThreeD/glowUtils';
import { SINGLE_GLOW_DEFAULT_OPTIONS } from './singleGlow';

export const GLOWS_DEFAULT_OPTIONS = {
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
    colorPalette: [],
    shuffleColors: false,
    count: 1,
};

/**
 * @extends {AnimationController}
 * @description Glow class
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options
 */
export class Glow extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, getGlowGroupOptions(options));
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);
        this.glows = [];
    }

    /**
     * @description Sets up the scene
     * @returns {void}
     */
    async setupScene() {
        this.logger.log('Setting up scene', { functionName: 'setupScene' });
        this._createGlows();

        this.logger.log('Scene setup complete', { 
            functionName: `${this.options.containerName} setupScene` 
        });
    }

    /**
     * @description Creates the glows with individual options
     * @returns {void}
     */
    _createGlows() {
        this.logger.log('Creating glows', { functionName: '_createGlows' });

        // Используем objectConfig, если он есть, иначе весь options
        const groupOptions = this.options.objectConfig || this.options;
        const glowOptionsArray = getAllSingleGlowOptions(
            groupOptions,
            GLOWS_DEFAULT_OPTIONS,
            SINGLE_GLOW_DEFAULT_OPTIONS
        );

        for (let i = 0; i < glowOptionsArray.length; i++) {
            const options = glowOptionsArray[i];
            const glow = new SingleGlow(
                this.scene,
                this.renderer,
                this.container,
                this.camera,
                options
            );
            glow.setup();
            this.glows.push(glow);
            this.logger.log(`Glow ${i + 1} created`, {
                customData: { options },
                functionName: '_createGlows'
            });
        }
    }

    setGlowScale(cardIndex, scale) {
        if (this.glows && this.glows[cardIndex]) {
            this.glows[cardIndex].setScale(scale);
        }
    }

    /**
     * @description Updates the glows
     * @returns {void}
     */
    update() {
        if (!this.canAnimate()) return;
        const time = performance.now() / 1000;
        this.glows.forEach(glow => glow.update(time));
        this.renderScene();
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
     * @description Sets the highlightIntensity value for a specific glow (for external sync)
     * @param {number} index - Glow index
     * @param {number} value - Target value (0..1)
     */
    setGlowHighlightIntensity(index, value) {
        if (this.glows[index] && typeof this.glows[index].setHighlightIntensity === 'function') {
            this.glows[index].setHighlightIntensity(value);
        }
    }

    setGlowOpacity(cardIndex, opacity) {
        console.log('setGlowOpacity', cardIndex, opacity);
        if (this.glows && this.glows[cardIndex]) {
            this.glows[cardIndex].setOpacity(opacity);
        }
    }

    /**
     * @description Синхронизирует блик под карточкой с позицией и анимацией карточки
     * @param {Dynamics3D} card - объект карточки Dynamics3D
     * @param {number} glowIndex - индекс блика
     */
    syncWithCard(card, glowIndex = 0) {
        if (!card || !this.glows || !this.glows[glowIndex]) return;
        this.glows[glowIndex].syncWithObjectPosition(card);
    }
}

