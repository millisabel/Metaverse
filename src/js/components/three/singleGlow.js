import * as THREE from 'three';
import { createLogger } from "../../utils/logger";

export class SingleGlow {
    constructor(parentScene, parentRenderer, container, options = {}) {
        this.scene = parentScene;
        this.renderer = parentRenderer;
        this.container = container;
        
        this.options = {
            color: options.color || '#38DBFF',
            size: options.size || 0.5,
            opacity: {
                min: options.opacity?.min || 0.1,
                max: options.opacity?.max || 0.3
            },
            scale: {
                min: options.scale?.min || 0.5,
                max: options.scale?.max || 1.2
            },
            pulse: {
                speed: options.pulse?.speed || 0.5,
                intensity: options.pulse?.intensity || 0.6,
                sync: options.pulse?.sync || false
            },
            position: options.position || { x: 0, y: 0, z: 0 },
            movement: {
                enabled: options.movement?.enabled !== undefined ? options.movement.enabled : true,
                speed: options.movement?.speed || 0.05,
                range: options.movement?.range || { x: 0.8, y: 0.8, z: 0.5 }
            }
        };

        this.name = 'SingleGlow';
        this.logger = createLogger(this.name);
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
            vertexShader: `
                uniform float time;
                uniform float scaleMin;
                uniform float scaleMax;
                uniform float pulseSpeed;
                uniform float pulseIntensity;
                uniform float objectPulse;
                uniform float syncWithObject;
                varying vec2 vUv;
                varying float vPulse;

                void main() {
                    vUv = uv;
                    // Базовая пульсация с улучшенной интерполяцией
                    float basePulse = sin(time * pulseSpeed) * 0.5 + 0.5;
                    basePulse = pow(basePulse, 1.5) * pulseIntensity;
                    
                    // Улучшенное влияние движения объекта с плавным переходом
                    float objectInfluence = smoothstep(0.0, 1.0, objectPulse) * syncWithObject;
                    
                    // Улучшенное смешивание эффектов с нелинейной интерполяцией
                    float combinedEffect = mix(
                        basePulse,
                        basePulse * (1.0 + objectInfluence),
                        smoothstep(0.0, 1.0, objectInfluence)
                    );
                    
                    // Нелинейное масштабирование для более плавного эффекта
                    float scale = scaleMin + (scaleMax - scaleMin) * pow(combinedEffect, 1.2);
                    vPulse = scale;
                    
                    vec3 scaledPosition = position * scale;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                varying vec2 vUv;
                varying float vPulse;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    float glow = smoothstep(0.5, 0.0, dist);
                    float falloff = pow(1.0 - smoothstep(0.0, 0.5, dist), 2.0);
                    float intensity = glow * falloff;
                    
                    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                    intensity *= 0.9 + 0.1 * noise;
                    
                    gl_FragColor = vec4(color, intensity * opacity);
                }
            `,
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

    update(parentCamera) {
        if (!this.mesh) return;

        const time = this.clock.getElapsedTime();
        
        // Update uniforms for pulsation
        if (this.mesh.material.uniforms) {
            this.mesh.material.uniforms.time.value = time;
        }

        // Skip movement updates if disabled
        if (!this.options.movement.enabled) return;

        const timeOffset = time * this.options.movement.speed;

        // Calculate wave movement
        const waveX = Math.sin(timeOffset * this.waveParams.frequency) * this.waveParams.amplitude;
        const waveY = Math.cos(timeOffset * this.waveParams.frequency * 1.2) * this.waveParams.amplitude;
        
        // Add subtle secondary waves
        const secondaryWaveX = Math.sin(timeOffset * 0.3) * 0.2;
        const secondaryWaveY = Math.cos(timeOffset * 0.4) * 0.2;

        // Update position
        this.mesh.position.x += (waveX + secondaryWaveX) * this.currentPath.x * 0.003;
        this.mesh.position.y += (waveY + secondaryWaveY) * this.currentPath.y * 0.003;
        this.mesh.position.z = Math.sin(timeOffset * this.waveParams.frequency * 0.5) * 0.2;

        // Keep within bounds
        const { range } = this.options.movement;
        if (Math.abs(this.mesh.position.x) > range.x) {
            this.mesh.position.x = Math.sign(this.mesh.position.x) * range.x;
            this.currentPath.x *= -1;
            this.waveParams.frequency = Math.random() * 0.3 + 0.2;
        }
        
        if (Math.abs(this.mesh.position.y) > range.y) {
            this.mesh.position.y = Math.sign(this.mesh.position.y) * range.y;
            this.currentPath.y *= -1;
            this.waveParams.frequency = Math.random() * 0.3 + 0.2;
        }
    }

    // Methods for external control
    setPosition(position) {
        if (this.mesh) {
            this.mesh.position.set(
                position.x !== undefined ? position.x : this.mesh.position.x,
                position.y !== undefined ? position.y : this.mesh.position.y,
                position.z !== undefined ? position.z : this.mesh.position.z
            );
        }
    }

    setColor(color) {
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.color.value = new THREE.Color(color);
        }
    }

    setScale(scale) {
        if (this.mesh) {
            this.mesh.scale.set(scale, scale, 1);
        }
    }

    updateObjectPulse(value) {
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.objectPulse.value = value;
        }
    }

    toggleMovement(enabled) {
        this.options.movement.enabled = enabled;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
} 