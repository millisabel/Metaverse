import * as THREE from 'three';
import { createLogger } from "../../utils/logger";

import vertexShader from '../../shaders/glow.vert';
import fragmentShader from '../../shaders/glow.frag';

import { 
    generateTrajectoryParams, 
    calculateMovementPosition,
    applyRandomizedPulseOptions
} from '../../utilsThreeD/glowUtils';



export const SINGLE_GLOW_DEFAULT_OPTIONS = {
    objectOptions: {
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
        intersection: {
            enabled: false,
            selector: null,
            colorVar: null,
            lerpSpeed: 0,
        },
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

const SHADER_UNIFORMS = {
    color: v => ({ value: new THREE.Color(v.options.shaderOptions.color) }),
    opacity: v => ({ value: v.options.shaderOptions.opacity.max }),
    time: v => ({ value: 0 }),
    scaleMin: v => ({ value: v.options.shaderOptions.scale.min }),
    scaleMax: v => ({ value: v.options.shaderOptions.scale.max }),
    pulseSpeed: v => ({ value: v._pulseSpeed }),
    pulseIntensity: v => ({ value: typeof v.options.shaderOptions.pulse.intensity === 'number' ? 
        v.options.shaderOptions.pulse.intensity : 
        v.options.shaderOptions.pulse.intensity.max ?? 2 }),
    objectPulse: v => ({ value: v.options.shaderOptions.objectPulse }),
    syncWithObject: v => ({ value: v.options.shaderOptions.pulse.sync ? 1.0 : 0.0 }),
    highlightIntensity: v => ({ value: v.options.shaderOptions.pulse?.highlightIntensity ?? 0 })
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
    constructor(options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.options = options;
        this.index = options.index ?? 0;

        this.position = this.options.objectOptions.positioning?.position;
        this.range = this.options.objectOptions.movement?.range;
        this._trajectory = null;
        
        if (this.options.shaderOptions.pulse?.enabled) {
            if (this.options.shaderOptions.pulse.randomize) {
                applyRandomizedPulseOptions(this.options.shaderOptions);
            }
            this._pulseSpeed = this._initPulseSpeed();
        }
        
        if (options.objectOptions.intersection?.enabled) {
            this._currentColor = new THREE.Color(this.options.shaderOptions.color);
            this._targetColor = new THREE.Color(this.options.shaderOptions.color);
        }
    }

    /**
     * @description Sets up the glow
     * @returns {void}
     */
    setup() {
        this.mesh = this._createMesh();
        this._trajectory = generateTrajectoryParams(this.range);
        this._setPosition(this.position);

        if (this.index === 0) {
            console.log(`[SingleGlow][setup][index=0] mesh.position:`, this.mesh.position);
        }
    }

    /**
     * @description Updates the position of the glow (movement animation)
     * @param {number} time - The current time (seconds)
     * @returns {void}
     */
    update(time) {
        if (this.mesh && this.mesh.material) {
            this.mesh.material.uniforms.time.value = time;
        }
        if (this.options.objectOptions.movement?.enabled) {
            this._applyMovement(time);
        }
        if (this.options.objectOptions.intersection?.enabled) {
            this._lerpColor();
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

    /**
     * @description Создаёт меш для блика
     * @returns {THREE.Mesh}
     */
    _createMesh() {
        const geometry = this._createGeometry();
        const material = this._createMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    /**
     * @description Создаёт геометрию для блика (по умолчанию круг)
     * @returns {THREE.Geometry}
     */
    _createGeometry() {
        const radius = 1;
        const segments = 32;
        const geometry = new THREE.CircleGeometry(radius, segments);
        return geometry;
    }

    /**
     * @description Создаёт ShaderMaterial для блика
     * @returns {THREE.ShaderMaterial}
     */
    _createMaterial() {
        const uniforms = {};
        for (const key in SHADER_UNIFORMS) {
            uniforms[key] = SHADER_UNIFORMS[key](this);
        }
        uniforms.syncScale = { value: this.options.shaderOptions.pulse?.sync?.scale ? 1.0 : 0.0 };
        uniforms.cardScale = { value: 1.0 };
        uniforms.syncOpacity = { value: this.options.shaderOptions.pulse?.sync?.opacity ? 1.0 : 0.0 };
        uniforms.cardOpacity = { value: this.options.shaderOptions.opacity.max };
        uniforms.highlightIntensity = { value: this.options.shaderOptions.pulse?.highlightIntensity ?? 0 };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        return material;
    }

    /**
     * @description Sets the position of the glow mesh
     * @param {Object} position - The position {x, y, z}
     * @private
     */
    _setPosition(position) {
        if (!this.mesh || !position) {
            console.warn('_setPosition: no mesh or position', { mesh: this.mesh, position });
            return;
        }
        
        const newPosition = new THREE.Vector3(
            position.x || 0,
            position.y || 0,
            position.z || 0
        );
        
        this.mesh.position.copy(newPosition);
    }

    /**
     * @description Применяет движение к блику
     * @param {number} time - Текущее время
     * @returns {void}
     */
    _applyMovement(time) {
        const { movement, positioning } = this.options.objectOptions;
        if (!movement?.enabled) return;

        const newPosition = calculateMovementPosition(
            time,
            this._trajectory,
            positioning.initialPosition,
            movement.speed,
            movement.zEnabled
        );

        this._setPosition(newPosition);
    }

    /**
     * @description Updates the target color for interpolation
     * @param {THREE.Color} color - New target color
     */
    updateTargetColor(color) {
        if (this._targetColor) {
            this._targetColor.copy(color);
        }
    }

    /**
     * @description Smoothly changes the current color to the target
     * @private
     */
    _lerpColor() {
        const lerpSpeed = this.options.objectOptions.intersection?.lerpSpeed ?? 0.05;
        this._currentColor.lerp(this._targetColor, lerpSpeed);
        
        if (this.mesh.material.uniforms.color) {
            this.mesh.material.uniforms.color.value.copy(this._currentColor);
        }
    }

    /**
     * @description Initializes the pulse speed
     * @private
     * @returns {number} The pulse speed
     */
    _initPulseSpeed() {
        const pulseSpeed = this.options.shaderOptions?.pulse?.speed;
        if (typeof pulseSpeed === 'number') {
            return pulseSpeed;
        }
        
        return pulseSpeed?.max ?? 0.5;
    }


    /**
     * @description Updates the opacity uniform for pulsating effect
     * @param {number} time - Current animation time
     * @returns {void}
     */
    // _updateScaleAndOpacity(time) {
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
    //   }

    /**
     * @description Sets the color of the glow dynamically
     * @param {string|THREE.Color} color - Новый цвет (CSS-строка или THREE.Color)
     * @returns {void}
     */
    // setColor(color) {
    //     if (!this.mesh || !this.mesh.material) return;
    //     const newColor = (color instanceof THREE.Color) ? color : new THREE.Color(color);
    //     if (this.mesh.material.uniforms && this.mesh.material.uniforms.color) {
    //         this.mesh.material.uniforms.color.value = newColor;
    //     } else if (this.mesh.material.color) {
    //         this.mesh.material.color = newColor;
    //     }
    //     this.options.shaderOptions.color = newColor.getStyle ? newColor.getStyle() : color;
    // }


    /**
     * @description Sets the target value for objectPulse (for external sync)
     * @param {number} value - Target value (0..1)
     */
    // setHighlightIntensity(value) {
    //     this._targetHighlightIntensity = value;
    // }



    /**
     * @description Sets the opacity of the glow dynamically
     * @param {number} opacity - Новый прозрачность блика
     */	
    setOpacity(opacity) {
        if (!this.mesh || !this.mesh.material?.uniforms?.opacity) return;
        this.mesh.material.uniforms.opacity.value = opacity;
        if (this.index === 0) {
            console.log(`[SingleGlow][setOpacity][index=0] opacity:`, opacity);
        }
    }

    /**
     * @description Sets the scale of the glow dynamically
     * @param {number} scale - Новый масштаб блика
     */
    // setScale(scale) {
    //     if (!this.mesh) return;
    //     this.mesh.scale.set(scale, scale, 1);
    // }


    /**
     * @description Устанавливает масштаб блика через uniform (масштаб в шейдере)
     * @param {number} scale - Новый масштаб для шейдера
     */
    setShaderScale(scale) {
        if (!this.mesh || !this.mesh.material?.uniforms?.cardScale) return;
        this.mesh.material.uniforms.cardScale.value = scale;
        if (this.index === 0) {
            console.log(`[SingleGlow][setShaderScale][index=0] scale:`, scale);
        }
    }

    /**
     * @description Синхронизирует масштаб и прозрачность блика с позицией объекта (например, карточки) по оси Z
     * @param {Dynamics3D} object - объект, с позицией которого синхронизируем
     */
    syncWithObjectPosition(object) {
        if(!object) return

        const syncOptions = this.options.shaderOptions.pulse?.sync || {};
        
        if (!syncOptions.scale && !syncOptions.opacity) return;

        const position = object.currentPosition?.position;

        if (!position || typeof position.z !== 'number') {
            console.warn('Invalid position data:', { position, object });
            return;
        }

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

        
        if (this.options.shaderOptions.pulse?.sync?.scale) this.setShaderScale(scale);
        if (this.options.shaderOptions.pulse?.sync?.opacity) this.setOpacity(opacity);

        if (syncOptions.scale) this.setShaderScale(scale);
        if (syncOptions.opacity) this.setOpacity(opacity);
    }
} 
