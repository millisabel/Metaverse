import * as THREE from 'three';
import { createLogger } from "../../utils/logger";
import { AnimationController } from '../../utilsThreeD/animationController_3D';

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
        this.options = AnimationController.mergeOptions( DEFAULT_OPTIONS, mergedOptions);

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
        this.mesh.position.set(
            this.options.position.x,
            this.options.position.y,
            this.options.position.z
        );
        this.mesh.scale.set(this.options.size, this.options.size, 1);
        
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
        const timeOffset = time;
        const speed = this.options.movement.speed;
    
        const waveX = Math.sin(timeOffset * this.waveParams.frequency) * this.waveParams.amplitude;
        const waveY = Math.cos(timeOffset * this.waveParams.frequency * 1.2) * this.waveParams.amplitude;
        const secondaryWaveX = Math.sin(timeOffset * 0.3) * 0.2;
        const secondaryWaveY = Math.cos(timeOffset * 0.4) * 0.2;
    
        let x = this.mesh.position.x + (waveX + secondaryWaveX) * this.currentPath.x * speed;
        let y = this.mesh.position.y + (waveY + secondaryWaveY) * this.currentPath.y * speed;
        let z = Math.sin(timeOffset * this.waveParams.frequency * 0.5) * 0.2;
    
        const { range } = this.options.movement;
        if (Math.abs(x) > range.x) {
            x = Math.sign(x) * range.x;
            this.currentPath.x *= -1;
            this.waveParams.frequency = Math.random() * 0.3 + 0.2;
        }
        if (Math.abs(y) > range.y) {
            y = Math.sign(y) * range.y;
            this.currentPath.y *= -1;
            this.waveParams.frequency = Math.random() * 0.3 + 0.2;
        }
    
        this._setPosition({ x, y, z });
    }

    /**
     * Updates the opacity uniform for pulsating effect
     * @param {number} time - Current animation time
     */
    _updateOpacity(time) {
        const { min, max } = this.options.opacity;
        const pulse = (Math.sin(time * this.options.pulse.speed) + 1) / 2; // 0..1
        const opacity = min + (max - min) * pulse;
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.opacity.value = opacity;
        }
    }

    /**
     * Updates the glow
     * @returns {void}
     */
    update() {
        if (!this.mesh) return;
    
        const time = this.clock.getElapsedTime();
        if (this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value = time;
            this._updateOpacity(time);
        }
    
        if (!this.options.movement.enabled) return;
    
        this._updatePosition(time);
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