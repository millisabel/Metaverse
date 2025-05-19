import * as THREE from 'three';

import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { SingleGlow } from './singleGlow';

import { createLogger } from "../../utils/logger";
import { getGlowGroupOptions, getSingleGlowOptions, getAllSingleGlowOptions } from '../../utilsThreeD/glowUtils';
import { SINGLE_GLOW_DEFAULT_OPTIONS } from './singleGlow';

export const GLOWS_DEFAULT_OPTIONS = {
    count: 1, // количество бликов
    colorPalette: [],
    shuffleColors: false, // перемешать цвета из массива цветов
    size: {// минимальный и максимальный размер блика
        min: 1, 
        max: 1
    },
    movement: { //  движения блика  
        enabled: false, // включение/выключение движения блика  
        zEnabled: true, // включение/выключение движения блика по оси Z
        speed: 0.1, // скорость движения блика
        range: { // диапазон движения блика
            x: 2, 
            y: 2, 
            z: 1 } 
    },
    position: { x: 0, y: 0, z: 0 }, // позиция блика
    positioning: {
        mode: 'random', // 'element' | 'fixed' | 'random'
        targetSelector: null,
        align: 'center center',
        offset: { x: 0, y: 0 }
    },
    pulseControl: {
        enabled: false, // управляет наличием пульсации (JS-логика)
        randomize: false // управляет рандомизацией параметров пульсации (JS-логика)
    },
    shaderOptions: {
        color: null, // цвет блика
        opacity: { // минимальная и максимальная прозрачность блика
            min: 0, 
            max: 1 
        },
        scale: { // минимальный и максимальный масштаб блика
            min: 0, 
            max: 1.0
        },
        pulse: { // только параметры для шейдера
            speed: { min: 0.1, max: 0.3 }, 
            intensity: 2, 
            sync: false,
        },
        objectPulse: 0
    },
    individualOptions: [],
};

/**
 * @extends {AnimationController}
 * @description Glow class
 * @param {HTMLElement} container - The container element
 * @param {Object} options - The options
 */
export class Glow extends AnimationController {
    constructor(container, options = {}) {
        super(container, getGlowGroupOptions(options));
        this.name = this.constructor.name + ' ' + (this.options.containerName || '');
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
     * @description Sets the objectPulse value for a specific glow (for external sync)
     * @param {number} index - Glow index
     * @param {number} value - Target value (0..1)
     */
    setGlowPulse(index, value) {
        console.log('setGlowPulse', index, value);
        if (this.glows[index] && typeof this.glows[index].setObjectPulse === 'function') {
            this.glows[index].setObjectPulse(value);
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
        
        this._prevZ = this._prevZ || [];
        if (this._prevZ[glowIndex] === card.currentScale.position.z) return;
        this._prevZ[glowIndex] = card.currentScale.position.z;

        const glow = this.glows[glowIndex];
        const glowShaderOptions = glow.options.shaderOptions;

        const position = card.currentScale.position;
        
        const z = position.z;

        const zParams = card.animationParams.group?.position?.z || {};
        const baseZ = zParams.basePosition ?? 0;
        const amplitudeZ = zParams.amplitude ?? 0;
        
        const realMinZ = amplitudeZ * -1;
        const realMaxZ = baseZ;

        const tolerance = Math.abs(amplitudeZ) * 0.005;
        const minZ = realMinZ - tolerance;
        const maxZ = realMaxZ + tolerance;

        let normalizedZ = (z - minZ) / (maxZ - minZ);
        normalizedZ = Math.max(0, Math.min(1, normalizedZ));

        if (minZ > maxZ) {
            normalizedZ = 1 - normalizedZ;
        }
        
// 
        const scaleRange = glowShaderOptions.scale;
        const opacityRange = glowShaderOptions.opacity;

        const scale = scaleRange.min + (scaleRange.max - scaleRange.min) * normalizedZ;
        const opacity = opacityRange.min + (opacityRange.max - opacityRange.min) * normalizedZ;
        
        if(normalizedZ > 0.9) {
            console.log(glowIndex, 'z', z, 'minZ', minZ, 'maxZ', maxZ, 'normalizedZ', normalizedZ, 'scale', scale, 'opacity', opacity, 'baseZ', baseZ, 'amplitudeZ', amplitudeZ);
        }

        if (glow.mesh) {
            const currentScale = glow.mesh.scale.x;
            if (Math.abs(currentScale - scale) > 0.001) {
                glow.mesh.scale.set(scale, scale, 1);
            }
        
            const currentOpacity = glow.mesh.material.uniforms?.opacity.value;
            if (currentOpacity !== undefined && Math.abs(currentOpacity - opacity) > 0.01) {
                glow.mesh.material.uniforms.opacity.value = opacity;
            }
        }
    }
}
/*
const groupZPosition = card.group.position.z;
const meshZPosition = card.mesh ? card.mesh.position.z : 0;
const zPosition = groupZPosition + meshZPosition;

const params = card.animationParams;

// Calculate z-position range based on animation parameters
const zRange = {
    min: params.position.z.basePosition + params.position.z.amplitude, // Maximum distance
    max: params.position.z.basePosition // Maximum proximity
};

// Calculate normalized position (0 to 1)
let normalizedZ = (zPosition - zRange.min) / (zRange.max - zRange.min);
normalizedZ = Math.max(0, Math.min(1, normalizedZ));

// Calculate scale and opacity using exponential scaling for more dramatic effect
const scaleRange = this.options.scale;
const opacityRange = this.options.opacity;

// Use exponential scaling for more dramatic effect when object is closer
const scaleFactor = Math.pow(normalizedZ, 1.5); // Exponential scaling
const scale = scaleRange.min + (scaleRange.max - scaleRange.min) * scaleFactor;

// Opacity follows a similar curve but with different power
const opacityFactor = Math.pow(normalizedZ, 2); // More dramatic opacity change
const opacity = opacityRange.min + (opacityRange.max - opacityRange.min) * opacityFactor;
*/
