import * as THREE from 'three';
import { createLogger } from "../../utils/logger";
import { mergeOptionsWithObjectConfig } from '../../utils/utils';

import vertexShader from '../../shaders/glow.vert';
import fragmentShader from '../../shaders/glow.frag';

const DEFAULT_OPTIONS = {
    color: '#FFFFFF',
    size: 1,
    opacity: {
        min: 0.1,
        max: 1
    },
    scale: {
        min: 0.5,
        max: 2
    },
    pulse: {
        speed: 0.1,
        intensity: 2,
        sync: false
    },
    movement: {
        enabled: true,
        speed: 0.005,
        range: { x: 2, y: 2, z: 0.1 }
    },
    position: { x: 0, y: 0, z: 0 },
};

export class SingleGlow {
    constructor(parentScene, parentRenderer, container, options = {}) {
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.scene = parentScene;
        this.renderer = parentRenderer;
        this.container = container;
        
        const { objectConfig, ...restOptions } = options;
        const mergedOptions = {
        ...restOptions,
        ...(objectConfig || {})
        };
        this.options = mergeOptionsWithObjectConfig(DEFAULT_OPTIONS, mergedOptions);

        // Diagnostic log for movement options
        console.log('[SingleGlow] movement options:', this.options.movement);

        this.clock = new THREE.Clock();
        this.mesh = null;
        this.currentPath = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        };
        this.waveParams = {
            frequency: Math.random() * 0.3 + 0.2,
            amplitude: Math.random() * 0.3 + 0.3
        };

        // Индивидуальные параметры движения
        this.basePosition = {
            x: options.position?.x ?? 0,
            y: options.position?.y ?? 0,
            z: options.position?.z ?? 0
        };
        console.log('[SingleGlow] basePosition:', this.basePosition);

        // Индивидуальные параметры для каждой оси
        this.motionParams = {
            x: {
                amplitude: (options.movement?.range?.x ?? 1) * (0.5 + Math.random() * 0.5),
                frequency: 0.2 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                speed: (options.movement?.speed ?? 0.01) * (0.8 + Math.random() * 0.4)
            },
            y: {
                amplitude: (options.movement?.range?.y ?? 1) * (0.5 + Math.random() * 0.5),
                frequency: 0.2 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                speed: (options.movement?.speed ?? 0.01) * (0.8 + Math.random() * 0.4)
            },
            z: {
                amplitude: (options.movement?.range?.z ?? 1) * (0.5 + Math.random() * 0.5),
                frequency: 0.2 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                speed: (options.movement?.speed ?? 0.01) * (0.8 + Math.random() * 0.4)
            }
        };

        // Индивидуальные параметры пульсации (масштаб и прозрачность)
        this.pulseParams = {
            scale: {
                min: options.scale?.min ?? 1,
                max: options.scale?.max ?? 1.5,
                speed: (options.pulse?.speed ?? 0.1) * (0.8 + Math.random() * 0.4),
                phase: Math.random() * Math.PI * 2
            },
            opacity: {
                min: options.opacity?.min ?? 0.1,
                max: options.opacity?.max ?? 0.2,
                speed: (options.pulse?.speed ?? 0.1) * (0.8 + Math.random() * 0.4),
                phase: Math.random() * Math.PI * 2
            }
        };

        this.baseSize = options.size ?? 1;

        this.enableScalePulse = options.pulse?.enabled !== false; // по умолчанию true

        console.log(`[SingleGlow] scale speed: ${this.pulseParams.scale.speed}, phase: ${this.pulseParams.scale.phase}`);

        this.randomOffset = Math.random() * 1000; // Added for random offset

        this.setup();
    }

    /**
     * Sets up the glow
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

        const segments = 32;
        const geometry = new THREE.CircleGeometry(0.5, segments);
        const color = new THREE.Color(this.options.color);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: color },
                opacity: { value: this.options.opacity.max },
                time: { value: 0 },
                scaleMin: { value: this.options.scale.min },
                scaleMax: { value: this.options.scale.max },
                pulseSpeed: { value: this.options.pulse.speed },
                pulseIntensity: { value: this.options.pulse.intensity },
                objectPulse: { value: 0 },
                syncWithObject: { value: this.options.pulse.sync ? 1.0 : 0.0 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.basePosition.x, this.basePosition.y, this.basePosition.z);
        this.mesh.scale.set(this.baseSize * this.pulseParams.scale.min, this.baseSize * this.pulseParams.scale.min, 1);        
        this.scene.add(this.mesh);
    }

    /**
     * Sets the position of the glow
     * @param {Object} position - The position of the glow
     * @returns {void}
     */
    _setPosition(position) {
        if (this.mesh) {
            this.mesh.position.set(
                position.x !== undefined ? position.x : this.mesh.position.x,
                position.y !== undefined ? position.y : this.mesh.position.y,
                position.z !== undefined ? position.z : this.mesh.position.z
            );
        }
    }

    /**
     * Updates the position of the glow
     * @param {number} time - The current time
     * @returns {void}
     */
    _updatePosition(time) {
        const x = this.basePosition.x + Math.sin(time * this.motionParams.x.frequency * this.motionParams.x.speed + this.motionParams.x.phase) * this.motionParams.x.amplitude;
        const y = this.basePosition.y + Math.cos(time * this.motionParams.y.frequency * this.motionParams.y.speed + this.motionParams.y.phase) * this.motionParams.y.amplitude;
        let z = this.basePosition.z;
        if (this.options.movement.zEnabled !== false) {
            z += Math.sin(time * this.motionParams.z.frequency * this.motionParams.z.speed + this.motionParams.z.phase) * this.motionParams.z.amplitude;
        }
        this.mesh.position.set(x, y, z);
    }

    /**
     * Updates the opacity uniform for pulsating effect
     * @param {number} time - Current animation time
     */
    _updateScaleAndOpacity(time) {
        let scale = this.baseSize;
        if (this.enableScalePulse) {
            const scalePulse = (Math.sin(time * this.pulseParams.scale.speed + this.pulseParams.scale.phase) + 1) / 2;
            scale = this.baseSize * (this.pulseParams.scale.min + (this.pulseParams.scale.max - this.pulseParams.scale.min) * scalePulse);
        }
        this.mesh.scale.set(scale, scale, 1);

        // Прозрачность (opacity) — всегда пульсирует
        const opacityPulse = (Math.sin(time * this.pulseParams.opacity.speed + this.pulseParams.opacity.phase) + 1) / 2;
        const opacity = this.pulseParams.opacity.min + (this.pulseParams.opacity.max - this.pulseParams.opacity.min) * opacityPulse;
        if (this.mesh.material.uniforms) {
            this.mesh.material.uniforms.opacity.value = opacity;
        }
    }

    /**
     * Updates the glow
     * @returns {void}
     */
    update(camera, index = 0, shouldLog = false) {
        if (!this.mesh) return;
    
        const time = this.clock.getElapsedTime() + this.randomOffset;
        this._updatePosition(time);
        this._updateScaleAndOpacity(time);
    
        if (!this.options.movement.enabled) return;
    
        if (this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value = time;
        }

        if (shouldLog) {
            const pos = this.mesh.position;
            const scale = this.mesh.scale;
            const opacity = this.mesh.material.uniforms?.opacity?.value ?? 'n/a';
            const color = this.mesh.material.uniforms?.color?.value?.getStyle?.() ?? 'n/a';
            // Можно добавить любые другие параметры, которые хотите отслеживать
            console.log(
                `[SingleGlow][${index}]`,
                `time=${time.toFixed(2)}\n`,
                `x=${pos.x.toFixed(2)}\n`,
                `y=${pos.y.toFixed(2)}\n`,
                `z=${pos.z.toFixed(2)}\n`,
                `size=${this.baseSize}\n`,
                `scale=${scale.x.toFixed(2)}\n`,
                `opacity=${opacity}\n`,
                `_________________________________________________`
            );
        }

        if (shouldLog) {
            console.log(`[SingleGlow][${index}] x=${this.mesh.position.x}, y=${this.mesh.position.y}`);
        }
    }

    /**
     * Cleans up the glow
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