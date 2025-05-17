import * as THREE from 'three';
import { createLogger } from "../../utils/logger";
import { getWorldScaleForPixelSize } from '../../utilsThreeD/utilsThreeD';

import vertexShader from '../../shaders/glow.vert';
import fragmentShader from '../../shaders/glow.frag';

const DEFAULT_OPTIONS = {
    shaderOptions: {
        color: 0xFFFFFF,
        opacity: { 
            min: 0.5, 
            max: 1 
        },
        scale: { 
            min: 1, 
            max: 2 
        },
        pulse: { 
            enabled: true, 
            speed: { 
                min: 0.1, 
                max: 0.3 
            }, 
            intensity: 2, 
            sync: false },
        objectPulse: 0
    },
    sizePx: 100,
    size: {
        min: 1,
        max: 1
    },
    movement: {
        enabled: false,
        zEnabled: false,
        speed: 0.1,
        range: {
            x: 2,
            y: 4,   
            z: 0.5,
        }
    },
    intersection: {
        enabled: false,
        selector: null,
        lerpSpeed: 0.01,
    },
    position: { x: 0, y: 0, z: 0 },
    positioning: {
        mode: 'random', // 'element' | 'fixed' | 'random'
        targetSelector: null,
        align: 'center center',
        offset: { x: 0, y: 0 }
    }
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

        // Итоговые опции для одного блика
        this.options = { ...DEFAULT_OPTIONS, ...options };

        this.scene = parentScene;
        this.renderer = parentRenderer;
        this.container = container;
        this.camera = camera;

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
        this.mesh = this._createMesh(); // СНАЧАЛА создаём меш

        // Затем выбираем режим позиционирования
        const mode = this.options.positioning?.mode;
        if (mode === 'element') {
            this._setPositionByElement(this.options.positioning);
        } else if (mode === 'fixed') {
            this._setPosition(this.options.position);
        } else { // 'random' или fallback
            this.options.position = this._calculateRandomPosition();
            this._setPosition(this.options.position);
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
        const movement = this.options.movement || {};
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
        console.log('uniforms:', uniforms);
        return new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
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
        console.log('mesh.position:', this.mesh.position);
    }

    /**
     * @description Устанавливает начальный размер блика
     * @returns {void}
     */
    _setInitialSize() {
        this.logger.log('Setting initial size', { functionName: '_setInitialSize' });
        if (this.options.sizePx && this.camera) {
            // Выбираем случайный множитель в диапазоне [min, max]
            const min = this.options.size?.min ?? 1;
            const max = this.options.size?.max ?? min;
            const sizeFactor = (min === max) ? min : (Math.random() * (max - min) + min);
            this._sizeFactor = sizeFactor; // сохраняем для анимации, если нужно
            const pixelSize = this.options.sizePx * sizeFactor;
            const worldScale = getWorldScaleForPixelSize(pixelSize, this.camera, this.mesh.position.z);
            this._baseWorldScale = worldScale;
            this.mesh.scale.set(worldScale, worldScale, 1);
        } else {
            const min = this.options.size?.min ?? 1;
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
        if (!el) return;
      
        const rect = el.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const sizePx = this.options.sizePx || 0;

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

        // Логирование для отладки позиционирования
        this.logger.log('[Glow align debug]', {
            functionName: '_setPositionByElement',
            styles: {
                headerBackground: '#b4a631'
            },
            customData: {
                rect,
                containerRect,
                align,
                vertical,
                horizontal,
                x_before_offset: x - containerRect.left,
                y_before_offset: y - containerRect.top,
                x_final: x - containerRect.left + (offset.x || 0),
                y_final: y - containerRect.top + (offset.y || 0),
                sizePx,
                offset
            }
        });

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
        console.log('mesh.position:', this.mesh.position);
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
        this.options.size.max = size;
        this.mesh.scale.set(size * this.options.shaderOptions.scale.min, size * this.options.shaderOptions.scale.min, 1);
        this.options.size = size;
    }

    /**
     * @description Updates the position of the glow (movement animation)
     * @param {number} time - The current time (seconds)
     * @returns {void}
     */
    update(time) {
        if (!this.options.movement?.enabled) return;

        this.mesh.material.uniforms.time.value = time;

        // const { speed = 0.1, range = { x: 1, y: 1, z: 0.1 }, zEnabled = true } = this.options.movement;
        // const base = this.options.position || { x: 0, y: 0, z: 0 };

        // Индивидуальный randomOffset для рассинхронизации бликов
        // if (this._randomOffset === undefined) {
        //     this._randomOffset = Math.random() * 1000;
        // }
        // const t = time * speed + this._randomOffset;

        // const x = base.x + Math.sin(t) * (range.x / 2);
        // const y = base.y + Math.cos(t) * (range.y / 2);
        // let z = base.z;
        // if (zEnabled) {
        //     z += Math.sin(t * 0.7) * (range.z / 2);
        // }
        // this.mesh.position.set(x, y, z);
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
} 
