import * as THREE from 'three';
import { createLogger } from "../../utils/logger";
import { getWorldScaleForPixelSize } from '../../utilsThreeD/utilsThreeD';

import vertexShader from '../../shaders/glow.vert';
import fragmentShader from '../../shaders/glow.frag';

export const SINGLE_GLOW_DEFAULT_OPTIONS = {
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
            zEnabled: false,
            speed: 0.1,
            range: { x: 0, y: 0, z: 0 },
        },
        pulseControl: {
            enabled: false,
            randomize: false,
        },
        opacity: { min: 1, max: 1 },
    },
    shaderOptions: {
        color: 0xFFFFFF,
        opacity: { min: 0.5, max: 1 },
        scale: { min: 1, max: 2 },
        pulse: {
            enabled: true,
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
};

// Константа для uniforms, используемых в шейдере
const SHADER_UNIFORMS = {
    color: v => ({ value: new THREE.Color(v.options.shaderOptions.color) }),
    opacity: v => ({ value: v.options.shaderOptions.opacity.max }),
    time: v => ({ value: 0 }),
    scaleMin: v => ({ value: v.options.shaderOptions.scale.min }),
    scaleMax: v => ({ value: v.options.shaderOptions.scale.max }),
    pulseSpeed: v => ({ value: v._pulseSpeed }),
    pulseIntensity: v => ({ value: v.options.shaderOptions.pulse.intensity }),
    objectPulse: v => ({ value: v.options.shaderOptions.objectPulse }),
    syncWithObject: v => ({ value: v.options.shaderOptions.pulse.sync ? 1.0 : 0.0 })
};

// Utility to strip alpha from rgba color string
function stripAlphaFromColor(colorStr) {
    // rgba(255,255,255,0.05) -> rgb(255,255,255)
    if (typeof colorStr === 'string' && colorStr.startsWith('rgba')) {
        const match = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
            return `rgb(${match[1]},${match[2]},${match[3]})`;
        }
    }
    return colorStr;
}

/**
 * SingleGlow class
 * @param {THREE.Scene} parentScene - The parent scene
 * @param {THREE.WebGLRenderer} parentRenderer - The parent renderer
 * @param {HTMLElement} container - The container element
 * @param {THREE.Camera} camera - The camera
 * @param {Object} options - итоговые опции для одного блика
 */
export class SingleGlow {
    constructor(parentScene, parentRenderer, container, camera, options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);
        // Ожидаем, что options уже приведён к структуре { objectOptions, shaderOptions }
        this.options = {
            objectOptions: {
                ...SINGLE_GLOW_DEFAULT_OPTIONS.objectOptions,
                ...(options.objectOptions || {})
            },
            shaderOptions: {
                ...SINGLE_GLOW_DEFAULT_OPTIONS.shaderOptions,
                ...(options.shaderOptions || {})
            }
        };
        this.scene = parentScene;
        this.renderer = parentRenderer;
        this.container = container;
        this.camera = camera || options.camera || null;
        this.logger.log('Creating glow', {
            conditions: ['init'],
            functionName: 'constructor',
            customData: {
                options: this.options,
                container: container,
                scene: this.scene,
                renderer: this.renderer,
                camera: this.camera
            }
        });
        this._randomOffset = Math.random() * Math.PI * 2;
        // Генерируем уникальные параметры траектории для блика
        const range = this.options.objectOptions.movement?.range || { x: 1, y: 1, z: 0.1 };
        this._trajectory = {
            freqX: Math.random() * 0.5 + 0.5,
            freqY: Math.random() * 0.5 + 0.5,
            freqZ: Math.random() * 0.5 + 0.5,
            ampX: (range.x || 1) * (0.5 + Math.random() * 0.5),
            ampY: (range.y || 1) * (0.5 + Math.random() * 0.5),
            ampZ: (range.z || 1) * (0.5 + Math.random() * 0.5),
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            phaseZ: Math.random() * Math.PI * 2,
        };
        // Цвет для плавного перехода
        this._currentColor = new THREE.Color(this.options.shaderOptions.color);
        this._targetColor = new THREE.Color(this.options.shaderOptions.color);
        this._highlightIntensity = this.options.shaderOptions.pulse?.highlightIntensity ?? 0;
        this._targetHighlightIntensity = this._highlightIntensity;
    }

    /**
     * @description Sets up the glow
     * @returns {void}
     */
    setup() {
        if (!this.scene) {
            this.logger.log('Scene not available for setup', {
                conditions: ['error'],
                functionName: 'setup'
            });
            return;
        }
        this._pulseSpeed = this._generatePulseSpeed();
        this.mesh = this._createMesh();
        // Затем выбираем режим позиционирования
        const mode = this.options.objectOptions.positioning?.mode;
        if (mode === 'element') {
            this._setPositionByElement(this.options.objectOptions.positioning);
        } else if (mode === 'fixed') {
            this._setPosition(this.options.objectOptions.positioning.initialPosition);
        } else { // 'random' или fallback
            this.options.objectOptions.positioning.initialPosition = this._calculateRandomPosition();
            this._setPosition(this.options.objectOptions.positioning.initialPosition);
        }
        this._setInitialSize();
        this.scene.add(this.mesh);
    }

    /**
     * @description Генерирует индивидуальную скорость пульсации для блика
     * @returns {number} Индивидуальная скорость пульсации
     */
    _generatePulseSpeed() {
        const pulseSpeed = this.options.shaderOptions?.pulse?.speed;
        if (typeof pulseSpeed === 'object' && pulseSpeed !== null) {
            const min = pulseSpeed.min ?? 0.5;
            const max = pulseSpeed.max ?? 0.5;
            return (min === max) ? min : (Math.random() * (max - min) + min);
        } else {
            return pulseSpeed ?? 0.5;
        }
    }

    /**
     * @description Рассчитывает случайную позицию для блика (если нет targetSelector/align)
     * @returns {Object}
     */
    _calculateRandomPosition() {
        // Если есть initialPositions — используем их
        if (Array.isArray(this.options.initialPositions) && this.options.initialPositions.length > 0) {
            // Для простоты: случайный индекс
            const idx = Math.floor(Math.random() * this.options.initialPositions.length);
            return this.options.initialPositions[idx];
        }
        // Иначе используем movement.range
        const movement = this.options.objectOptions.movement || {};
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
     * @description Создаёт меш для блика
     * @returns {THREE.Mesh}
     */
    _createMesh() {
        this.logger.log('Creating mesh', {
            functionName: '_createMesh',
        });
        const geometry = this._createGeometry();
        const material = this._createMaterial();
        return new THREE.Mesh(geometry, material);
    }

    /**
     * @description Создаёт геометрию для блика (по умолчанию круг)
     * @returns {THREE.Geometry}
     */
    _createGeometry() {
        this.logger.log('Creating geometry', {
            functionName: '_createGeometry',
        });
        const radius = 1;
        const segments = 32;

        return new THREE.CircleGeometry(radius, segments);
    }

    /**
     * @description Создаёт ShaderMaterial для блика
     * @returns {THREE.ShaderMaterial}
     */
    _createMaterial() {
        this.logger.log('Creating material', {
            functionName: '_createMaterial',
        });
        // Формируем uniforms на основе константы
        const uniforms = {};
        for (const key in SHADER_UNIFORMS) {
            uniforms[key] = SHADER_UNIFORMS[key](this);
        }
        uniforms.syncScale = { value: this.options.shaderOptions.pulse?.sync?.scale ? 1.0 : 0.0 };
        uniforms.cardScale = { value: 1.0 };
        uniforms.syncOpacity = { value: this.options.shaderOptions.pulse?.sync?.opacity ? 1.0 : 0.0 };
        uniforms.cardOpacity = { value: this.options.shaderOptions.opacity.max };
        uniforms.highlightIntensity = { value: this.options.shaderOptions.pulse?.highlightIntensity ?? 0 };
        return new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
    }

    /**
     * @description Устанавливает начальную позицию блика
     * @returns {void}
     */
    _setInitialPosition() {
        this.logger.log('Setting initial position', {
            functionName: '_setInitialPosition',
        });
        if (this.options.targetSelector) {
            this._setPositionByElement({
                targetSelector: this.options.targetSelector,
                align: this.options.align,
                offset: this.options.offset
            });
        } else if (this.options.position) {
            this.mesh.position.set(this.options.position.x, this.options.position.y, this.options.position.z);
        } else {
            this.mesh.position.set(0, 0, 0);
        }
    }

    /**
     * @description Устанавливает начальный размер блика
     * @returns {void}
     */
    _setInitialSize() {
        this.logger.log('Setting initial size', { functionName: '_setInitialSize' });
        const { sizePx, size } = this.options.objectOptions;
        if (sizePx && this.camera) {
            const min = size?.min ?? 1;
            const max = size?.max ?? min;
            const sizeFactor = (min === max) ? min : (Math.random() * (max - min) + min);
            this._sizeFactor = sizeFactor;
            const pixelSize = sizePx * sizeFactor;
            const worldScale = getWorldScaleForPixelSize(pixelSize, this.camera, this.mesh.position.z);
            this._baseWorldScale = worldScale;
            this.mesh.scale.set(worldScale, worldScale, 1);
        } else {
            const min = size?.min ?? 1;
            this.mesh.scale.set(min, min, 1);
            this._baseWorldScale = min;
            this._sizeFactor = min;
        }
    }

    /**
     * @description Устанавливает позицию меша по элементу
     * @param {Object} options - Опции
     * @returns {void}
     */
    _setPositionByElement({
        targetSelector,
        align = 'center center',
        offset = { x: 0, y: 0 }
      }) {
        this.logger.log('Setting position by element', {
            functionName: '_setPositionByElement',
        });
        const el = document.querySelector(targetSelector);
        if (!el) {
            console.warn('Glow: targetSelector not found', targetSelector, ' — will retry');
            setTimeout(() => this._setPositionByElement({ targetSelector, ...this.options.objectOptions.positioning }), 100);
            return;
        }
      
        const rect = el.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const sizePx = this.options.objectOptions.sizePx || 0;

        let vertical = 'center', horizontal = 'center';
        if (align) {
            const parts = align.split(' ');
            parts.forEach(part => {
                if (['top', 'center', 'bottom'].includes(part)) vertical = part;
                if (['left', 'center', 'right'].includes(part)) horizontal = part;
            });
        }

        let x, y;
        switch (horizontal) {
            case 'left':   x = rect.left + sizePx / 2; break;
            case 'center': x = rect.left + rect.width / 2; break;
            case 'right':  x = rect.left + rect.width - sizePx / 2; break;
            default:       x = rect.left + rect.width / 2;
        }
        switch (vertical) {
            case 'top':    y = rect.top + sizePx / 2; break;
            case 'center': y = rect.top + rect.height / 2; break;
            case 'bottom': y = rect.top + rect.height - sizePx / 2; break;
            default:       y = rect.top + rect.height / 2;
        }

        x -= containerRect.left;
        y -= containerRect.top;
        x += offset.x || 0;
        y += offset.y || 0;

        this._setMeshPositionFromScreen(x, y);
    }

    /**
     * @description Устанавливает позицию меша по экранным координатам с учётом камеры
     * @param {number} x - X в px
     * @param {number} y - Y в px
     * @returns {void}
     */
    _setMeshPositionFromScreen(x, y) {
        this.logger.log('Setting mesh position from screen', {
            functionName: '_setMeshPositionFromScreen',
        });

        // Гарантируем, что this.options.position всегда есть
        if (!this.options.position) {
            this.options.position = {};
        }

        let scenePos;
        if (this.camera) {
            const z = typeof this.options.position.z === 'number' ? this.options.position.z : 0.5;
            scenePos = this._convertScreenToScenePosition(x, y, z);
            this.mesh.position.copy(scenePos);
        } else {
            const z = typeof this.options.position.z === 'number' ? this.options.position.z : 0;
            this.mesh.position.set(x, y, z);
        }
    }

    /**
     * @description Преобразует экранные координаты (px) в координаты 3D-сцены
     * @param {number} xPx - X в пикселях
     * @param {number} yPx - Y в пикселях
     * @param {number} z - Z в NDC (0 ближе к near, 1 ближе к far)
     * @returns {THREE.Vector3}
     */
    _convertScreenToScenePosition(xPx, yPx, z = 0) {
        this.logger.log('Converting screen to scene position', {
            functionName: '_convertScreenToScenePosition',
        });
        const xNDC = (xPx / window.innerWidth) * 2 - 1;
        const yNDC = -((yPx / window.innerHeight) * 2 - 1);
        const vector = new THREE.Vector3(xNDC, yNDC, z);
        vector.unproject(this.camera);
        return vector;
    }

    /**
     * @description Sets the position of the glow
     * @param {Object} position - The position of the glow
     * @returns {void}
     */
    _setPosition(position) {
        this.logger.log('Setting position', {
            functionName: '_setPosition',
        });
        if (this.mesh) {
            this.mesh.position.set(
                position.x !== undefined ? position.x : this.mesh.position.x,
                position.y !== undefined ? position.y : this.mesh.position.y,
                position.z !== undefined ? position.z : this.mesh.position.z
            );
        }
    }

    /**
     * @description Updates the opacity uniform for pulsating effect
     * @param {number} time - Current animation time
     * @returns {void}
     */
    _updateScaleAndOpacity(time) {
        // Пульсация размера
        // let scaleFactor = this.options.size?.min ?? 1;
        // if (this.options.pulse?.enabled && this.options.size?.max !== undefined) {
        //     const t = (Math.sin(time * this._pulseSpeed) + 1) / 2;
        //     scaleFactor = (this.options.size.max - this.options.size.min) * t + this.options.size.min;
        // }
        // const scale = (this._baseWorldScale ?? 1) * scaleFactor;
        // this.mesh.scale.set(scale, scale, 1);

        // // Пульсация прозрачности (оставляем как было)
        // const opacityPulse = (Math.sin(time * this._pulseSpeed) + 1) / 2;
        // const opacity = (this.options.opacity?.min ?? 0.2) + ((this.options.opacity?.max ?? 0.3) - (this.options.opacity?.min ?? 0.2)) * opacityPulse;
        // if (this.mesh.material.uniforms) {
        //     this.mesh.material.uniforms.opacity.value = opacity;
        // }
      }

    /**
     * @description Sets the color of the glow dynamically
     * @param {string|THREE.Color} color - Новый цвет (CSS-строка или THREE.Color)
     * @returns {void}
     */
    setColor(color) {
        if (!this.mesh || !this.mesh.material) return;
        const newColor = (color instanceof THREE.Color) ? color : new THREE.Color(color);
        if (this.mesh.material.uniforms && this.mesh.material.uniforms.color) {
            this.mesh.material.uniforms.color.value = newColor;
        } else if (this.mesh.material.color) {
            this.mesh.material.color = newColor;
        }
        this.options.shaderOptions.color = newColor.getStyle ? newColor.getStyle() : color;
    }

    /**
     * @description Sets the size (scale) of the glow dynamically
     * @param {number} size - Новый базовый размер блика
     * @returns {void}
     */
    setSize(size) {
        if (!this.mesh) return;
        this.options.objectOptions.size.max = size;
        this.mesh.scale.set(size * this.options.shaderOptions.scale.min, size * this.options.shaderOptions.scale.min, 1);
        this.options.objectOptions.size = size;
    }

    /**
     * @description Sets the target value for objectPulse (for external sync)
     * @param {number} value - Target value (0..1)
     */
    setHighlightIntensity(value) {
        this._targetHighlightIntensity = value;
    }

    /**
     * @description Updates the position of the glow (movement animation)
     * @param {number} time - The current time (seconds)
     * @returns {void}
     */
    update(time) {
        this.mesh.material.uniforms.time.value = time;
        this._applyMovement(time);
        // --- Intersection logic ---
        if (this.options.intersection?.enabled) {
            this._updateIntersectionColor();
            // Плавно меняем цвет к целевому
            const lerpSpeed = this.options.intersection.lerpSpeed ?? 0.05;
            this._currentColor.lerp(this._targetColor, lerpSpeed);
            if (this.mesh.material.uniforms.color) {
                this.mesh.material.uniforms.color.value.copy(this._currentColor);
            }
        }

        // --- Highlight intensity sync ---
        if (typeof this._targetHighlightIntensity === 'number') {
            this._highlightIntensity += (this._targetHighlightIntensity - this._highlightIntensity) * 0.1;
            if (this.mesh.material.uniforms.highlightIntensity) {
                this.mesh.material.uniforms.highlightIntensity.value = this._highlightIntensity;
            }
        }
    }

    /**
     * @description Checks intersection with DOM elements and updates target color
     * Uses container-relative coordinates and tolerance for robust detection
     * @returns {void}
     */
    _updateIntersectionColor() {
        const intersection = this.options.intersection;
        if (!intersection?.enabled || !intersection.selector) return;
        // Get container rect
        const containerRect = this.container.getBoundingClientRect();
        // Project 3D position to screen (container) coordinates
        const vector = this.mesh.position.clone().project(this.camera);
        const x = (vector.x * 0.5 + 0.5) * containerRect.width + containerRect.left;
        const y = (1 - (vector.y * 0.5 + 0.5)) * containerRect.height + containerRect.top;
        const tolerance = 4; // px, area margin for intersection
        // Find all elements by selector
        const elements = Array.from(document.querySelectorAll(intersection.selector));
        const foundColors = [];
        for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (
                x >= rect.left - tolerance && x <= rect.right + tolerance &&
                y >= rect.top - tolerance && y <= rect.bottom + tolerance
            ) {
                // Try to get color from CSS variable or fallback to background
                let colorStr = null;
                if (intersection.colorVar) {
                    colorStr = getComputedStyle(el).getPropertyValue(intersection.colorVar).trim();
                }
                if (!colorStr) {
                    colorStr = getComputedStyle(el).backgroundColor;
                }
                if (colorStr) {
                    try {
                        // Удаляем альфа-канал, если есть
                        const safeColor = stripAlphaFromColor(colorStr);
                        foundColors.push(new THREE.Color(safeColor));
                    } catch (e) {
                        // Log color parse error
                        console.warn('Failed to parse color:', colorStr, e);
                    }
                }
            }
        }
        if (foundColors.length > 0) {
            // Average all found colors
            let r = 0, g = 0, b = 0;
            foundColors.forEach(c => { r += c.r; g += c.g; b += c.b; });
            r /= foundColors.length; g /= foundColors.length; b /= foundColors.length;
            this._targetColor.setRGB(r, g, b);
        } else {
            // Fallback to initial color
            this._targetColor.set(this.options.shaderOptions.color);
        }
    }

    /**
     * @description Cleans up the glow
     * @returns {void}
     */
    cleanup() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            if (this.scene && this.scene.children.includes(this.mesh)) {
                this.scene.remove(this.mesh);
            }
            this.mesh = null;
        }
    }

    _applyMovement(time) {
        const { movement, positioning } = this.options.objectOptions;
        if (!movement?.enabled) return;
        const { speed = 1, zEnabled = true } = movement;
        const t = time * speed;
        const tr = this._trajectory;
        const dx = Math.sin(t * tr.freqX + tr.phaseX) * tr.ampX;
        const dy = Math.cos(t * tr.freqY + tr.phaseY) * tr.ampY;
        const dz = zEnabled ? Math.sin(t * tr.freqZ + tr.phaseZ) * tr.ampZ : 0;
        this.mesh.position.x = positioning.initialPosition.x + dx;
        this.mesh.position.y = positioning.initialPosition.y + dy;
        this.mesh.position.z = positioning.initialPosition.z + dz;
    }

    setOpacity(opacity) {
        if (!this.mesh) return;
        this.options.shaderOptions.opacity.max = opacity;
        if (this.mesh.material.uniforms && this.mesh.material.uniforms.opacity) {
            this.mesh.material.uniforms.opacity.value = opacity;
        }
    }

    /**
     * @description Sets the scale of the glow dynamically
     * @param {number} scale - Новый масштаб блика
     */
    setScale(scale) {
        if (!this.mesh) return;
        this.mesh.scale.set(scale, scale, 1);
    }

    /**
     * @description Устанавливает масштаб объекта (Three.js)
     * @param {number} scale - Новый масштаб объекта
     */
    setObjectScale(scale) {
        if (!this.mesh) return;
        this.mesh.scale.set(scale, scale, 1);
    }

    /**
     * @description Устанавливает масштаб блика через uniform (масштаб в шейдере)
     * @param {number} scale - Новый масштаб для шейдера
     */
    setShaderScale(scale) {
        if (this.mesh && this.mesh.material.uniforms.cardScale) {
            this.mesh.material.uniforms.cardScale.value = scale;
        }
    }

    /**
     * @description Синхронизирует масштаб и прозрачность блика с позицией объекта (например, карточки) по оси Z
     * @param {Dynamics3D} object - объект, с позицией которого синхронизируем
     */
    syncWithObjectPosition(object) {
        const syncOptions = this.options.shaderOptions.pulse?.sync || {};
        if (!syncOptions.scale && !syncOptions.opacity) return;
        const position = object?.currentScale?.position;
        if (!position || typeof position.z !== 'number') return;
        const z = position.z;
        const zParams = object.animationParams.group?.position?.z || {};
        const baseZ = zParams.basePosition ?? 0;
        const amplitudeZ = zParams.amplitude ?? 0;
        const realMinZ = amplitudeZ * -1;
        const realMaxZ = baseZ;
        const tolerance = Math.abs(amplitudeZ) * 0;
        const minZ = realMinZ - tolerance;
        const maxZ = realMaxZ + tolerance;
        let normalizedZ = (z - minZ) / (maxZ - minZ);
        normalizedZ = Math.max(0, Math.min(1, normalizedZ));
        if (minZ > maxZ) {
            normalizedZ = 1 - normalizedZ;
        }
        const scaleRange = this.options.shaderOptions.scale;
        const opacityRange = this.options.shaderOptions.opacity;
        const scale = scaleRange.min + (scaleRange.max - scaleRange.min) * normalizedZ;
        const opacity = opacityRange.min + (opacityRange.max - opacityRange.min) * normalizedZ;
        // Управляем только шейдерным масштабом
        if (syncOptions.scale) this.setShaderScale(scale);
        if (syncOptions.opacity) this.setOpacity(opacity);
        // Для управления объектом используйте setObjectScale и objectOptions
    }
} 
