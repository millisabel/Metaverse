import * as THREE from 'three';

import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { SingleGlow } from './singleGlow';

import { createLogger } from "../../utils/logger";
import { getQuarterColorFromVar, shuffleArray, cascadeMergeOptions, mergeOptions } from '../../utils/utils';
import { lerpColor, averageColors, isPointInRect, initGlowCurrentColor } from '../../utilsThreeD/utilsThreeD';

const DEFAULT_OPTIONS = {
    shaderOptions: {
        color: null,
        opacity: {
            min: 0, // минимальная прозрачность блика
            max: 1 // максимальная прозрачность блика
        },
        scale: {
            min: 0, // минимальный масштаб блика
            max: 1.0
        },
        pulse: {
            enabled: false,
            speed: { min: 0.1, max: 0.3 }, // теперь объект с min и max
            intensity: 2,
            sync: false
        },
        objectPulse: 0
    },
    colorPalette: [],
    count: 3, // количество бликов
    shuffleColors: false, // перемешать цвета из массива цветов
    size: {
        min: 1, // минимальный размер блика
        max: 1
    },
    movement: {
        enabled: false, // включение/выключение движения блика  
        zEnabled: true,
        speed: 0.1, // скорость движения блика
        range: { 
            x: 2, 
            y: 2, 
            z: 1 } // диапазон движения блика
    },
    position: { x: 0, y: 0, z: 0 }, // позиция блика
    positioning: {
        mode: 'random', // 'element' | 'fixed' | 'random'
        targetSelector: null,
        align: 'center center',
        offset: { x: 0, y: 0 }
    },
    individualOptions: [],
};

/**
 * @extends {AnimationController}
 * @description Glow class
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options
 * @param {Object} defaultOptions - The default options
 */
export class Glow extends AnimationController {
    constructor(container, options = {}) {
        super(container, options, DEFAULT_OPTIONS);

        this.name = this.constructor.name + ' ' + this.options.containerName;
        this.logger = createLogger(this.name);

        this.glows = [];
        // this._quarterBlocks = [];
        // this._updateQuarterBlocks();

        this.logger.log('Setting up scene', {
            conditions: ['init'],
            functionName: 'constructor',
            customData: {
                options: this.options
            }
        });
    }

    /**
     * @description Sets up the scene
     * @returns {void}
     */
    async setupScene() {
        this.logger.log('Setting up scene', {
            functionName: 'setupScene'
        });

        this._createGlows();

        this.logger.log('Setting up scene', {
            type: 'success',
            functionName: 'setupScene'
        });
    }

    /**
     * @description Creates the glows with individual options
     * @returns {void}
     */
    _createGlows() {
        this.logger.log('Creating glows', {
            conditions: ['created'],
            functionName: '_createGlows',
        });
        const individualOptions = Array.isArray(this.options.individualOptions) ? this.options.individualOptions : [];
        const count = individualOptions.length > 0 ? individualOptions.length : (this.options.count || DEFAULT_OPTIONS.count);

        // Реализация shuffleColors для групповых бликов
        if (
            (!this.options.individualOptions || this.options.individualOptions.length === 0) &&
            Array.isArray(this.options.color)
        ) {
            if (this.options.shuffleColors) {
                this._shuffledColors = shuffleArray([...this.options.color]);
            } else {
                this._shuffledColors = [...this.options.color];
            }
        }

        for (let i = 0; i < count; i++) {
            this._createGlow(i);
        }
    }

    /**
     * @description Creates a glow object
     * @param {number} index - The index of the glow
     * @returns {void}
     */
    _createGlow(index) {
        const glowOptions = this._getGlowOptions(index);
        const glow = new SingleGlow(
            this.scene,
            this.renderer,
            this.container,
            this.camera,
            glowOptions
        );
        glow.setup();
        this.glows.push(glow);
        this.logger.log(`Glow ${index + 1} created`, {
            customData: {
                options: glowOptions,
                container: this.container,
                scene: this.scene,
                renderer: this.renderer,
                camera: this.camera
            },
            conditions: ['created'],
            functionName: '_createGlows',
            styles: {
                headerBackground: '#af274b'
            }
        });
    }

    /**
     * @description Собирает итоговые опции для одного блика
     * @param {number} index - Индекс блика
     * @returns {Object} Итоговые опции для SingleGlow
     */
    _getGlowOptions(index) {
        const groupOptions = this.options;
        const defaultOptions = DEFAULT_OPTIONS;
        const individual = (groupOptions.individualOptions && groupOptions.individualOptions[index]) || {};

        const mergedGroup = mergeOptions(defaultOptions, groupOptions);
        const merged = mergeOptions(mergedGroup, individual);

        merged.shaderOptions = merged.shaderOptions || {};
        merged.positioning = this._resolvePositioningMode(merged);
        merged.position = this._resolveGlowPosition(merged, index);
        console.log('Итоговые опции блика:', merged);
        // Устанавливаем цвет через отдельный метод с приоритетом individual > group > массив > default
        merged.shaderOptions.color = this._resolveGlowColor(
            index,
            individual.shaderOptions || {},
            groupOptions,
            defaultOptions
        );

        return merged;
    }

    /**
     * @description Resolves the color for the current glow (shuffle, cycling, etc.)
     * @param {number} index - The index of the glow
     * @param {Object} individual - Individual shaderOptions
     * @param {Object} groupOptions - Group shaderOptions
     * @param {Object} defaultOptions - Default shaderOptions
     * @returns {string|number} The resolved color
     */
    _resolveGlowColor(index, individual, groupOptions, defaultOptions) {
        // 1. Индивидуальный цвет
        if (individual && individual.color) return individual.color;
        // 2. Групповой цвет (если не массив)
        if (groupOptions && groupOptions.shaderOptions && groupOptions.shaderOptions.color && !Array.isArray(groupOptions.shaderOptions.color)) {
            return groupOptions.shaderOptions.color;
        }
        // 3. Массив цветов (shuffle) — ищем colorPalette на верхнем уровне groupOptions
        if (
            (!this.options.individualOptions || this.options.individualOptions.length === 0) &&
            Array.isArray(groupOptions.colorPalette)
        ) {
            if (!this._shuffledColors) {
                if (groupOptions.shuffleColors) {
                    this._shuffledColors = shuffleArray([...groupOptions.colorPalette]);
                } else {
                    this._shuffledColors = [...groupOptions.colorPalette];
                }
            }
            return this._shuffledColors[index % this._shuffledColors.length];
        }
        // 4. Дефолтный цвет
        return defaultOptions.shaderOptions.color;
    }

    /**
     * @description Resolves the positioning mode
     * @param {Object} options - The options
     * @returns {Object} The resolved positioning mode
     */
    _resolvePositioningMode(options) {
        let positioning = options.positioning || {};
        if (!positioning.mode) {
            if (positioning.targetSelector) {
                positioning.mode = 'element';
            } else if (options.position) {
                positioning.mode = 'fixed';
            } else {
                positioning.mode = 'random';
            }
        }
        return positioning;
    }
    
    /**
     * @description Resolves the glow position
     * @param {Object} options - The options
     * @param {number} index - The index
     * @returns {Object} The resolved glow position
     */
    _resolveGlowPosition(options, index) {
        if (options.positioning?.mode === 'fixed') {
            return options.position;
        }
        if (options.positioning?.mode === 'random') {
            return this._getRandomGlowPosition(options, index);
        }
        return undefined;
    }

    /**
     * @description Strips the group options
     * @param {Object} options - The options
     * @returns {Object} The stripped options
     */
    _stripGroupOptions(options) {
        const {
            count,
            individualOptions,
            shuffleColors,
            colorPalette,
            ...rest
        } = options;
        return rest;
    }

    /**
     * @description Gets the random glow position
     * @param {Object} options - The options
     * @param {number} index - The index
     * @returns {Object} The random glow position
     */
    _getRandomGlowPosition(options, index) {
        if (Array.isArray(options.initialPositions) && options.initialPositions.length > 0) {
            return options.initialPositions[index % options.initialPositions.length];
        }
        const movement = options.movement || {};
        const xSpread = movement.range?.x || 1;
        const ySpread = movement.range?.y || 1;
        const zRange = movement.range?.z || 0.1;
        const zEnabled = movement.zEnabled !== false;
        const x = (Math.random() - 0.5) * xSpread;
        const y = (Math.random() - 0.5) * ySpread;
        const z = zEnabled ? (Math.random() * 2 - 1) * zRange : 0;
        return { x, y, z };
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
        let logMessage = `starting cleanup in ${this.constructor.name}\n`;

        if (this.glows && Array.isArray(this.glows)) {
            this.glows.forEach((glow, index) => {
                if (glow && typeof glow.cleanup === 'function') {
                    glow.cleanup();
                    logMessage += `${this.constructor.name} glow disposed: ${index}\n`;
                }
            });
        }
        
        this.glows = [];

        super.cleanup(logMessage);
    }
}
