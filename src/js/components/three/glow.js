import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';

import { createCanvas, updateRendererSize } from '../../utilsThreeD/canvasUtils';
import { createLogger } from "../../utils/logger";

export class Glow extends AnimationController {
    constructor(parent, options = {}) {
        super(parent);
        this.name = 'Glow';
        this.logger = createLogger(this.name);
        this.logger.log('Controller initialization', {
            conditions: ['initializing-controller'],
        });
        
        this.options = {
            count: 5,
            colors: ['#ffffff', '#f0f0f0', '#e0e0e0'],
            size: {
                min: 0.5,
                max: 2,
            },
            speed: {
                min: 0.05,
                max: 0.1,
            },
            opacity: {
                min: 0.05,
                max: 0.15,
            },
            scale: {
                min: 0.5,
                max: 1.2,
            },
            pulse: {
                min: 0.02,
                max: 1.0,
            },
            zIndex: '1',
            ...options
        };

        this.glows = [];
        this.clock = new THREE.Clock();
        this.isInitialized = false;
    }

    initScene() {
        if (this.isInitialized) {
            this.logger.log('Scene already initialized', 'warn');
            return;
        }

        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'initScene'
        });

        try {
            this.scene = new THREE.Scene();
            
            const rect = this.container.getBoundingClientRect();
            const aspect = rect.width / rect.height;
            this.camera = new THREE.OrthographicCamera(
                -aspect, aspect, 1, -1, 0.1, 1000
            );
            this.camera.position.z = 1;

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            const canvas = createCanvas(this.renderer, { zIndex: this.options.zIndex });
            this.container.appendChild(canvas);

            this.createGlows();
            
            this.render();
            
            this.isInitialized = true;
        } catch (error) {
            this.logger.log(`Error during scene initialization: ${error.message}`, 'error');
            this.cleanup();
        }
    }

    createGlows() {
        const segments = 32;
        const geometry = new THREE.CircleGeometry(0.5, segments);
        
        for (let i = 0; i < this.options.count; i++) {
            const size = this.getRandomValue(this.options.size.min, this.options.size.max);
            const color = new THREE.Color(this.options.colors[Math.floor(Math.random() * this.options.colors.length)]);
            const opacity = this.getRandomValue(this.options.opacity.min, this.options.opacity.max);
            const pulseSpeed = this.getRandomValue(this.options.pulse.min, this.options.pulse.max);
            const scale = this.getRandomValue(this.options.scale.min, this.options.scale.max);
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: color },
                    opacity: { value: opacity },
                    time: { value: 0 },
                    scale: { value: scale },
                    pulseSpeed: { value: pulseSpeed }
                },
                vertexShader: `
                        uniform float time;
    uniform float scale;
    uniform float pulseSpeed;
    varying vec2 vUv;
    varying float vPulse;

    void main() {
        vUv = uv;
        // Более выраженная пульсация
        vPulse = scale * (0.7 + 0.3 * sin(time * pulseSpeed));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
                        
                        // Create a more natural glow effect
                        float glow = smoothstep(0.5, 0.0, dist);
                        float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
                        float intensity = glow * falloff;
                        
                        // Add some noise for more organic look
                        float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                        intensity *= 0.95 + 0.05 * noise;
                        
                        gl_FragColor = vec4(color, intensity * opacity * vPulse);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            
            this.setRandomPosition(mesh, size);
            
            this.glows.push({
                mesh,
                speed: this.getRandomValue(this.options.speed.min, this.options.speed.max),
                direction: new THREE.Vector2(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                ).normalize(),
                size,
                opacity,
                pulseSpeed,
                scale
            });

            this.scene.add(mesh);
        }
    }

    setRandomPosition(mesh, size) {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        
        mesh.position.x = (Math.random() * 2 - 1) * aspect;
        mesh.position.y = Math.random() * 2 - 1;
        mesh.position.z = Math.random() * 2 - 1;
        
        mesh.scale.set(size, size, 1);
        
        mesh.rotation.z = Math.random() * Math.PI * 2;
    }

    animate() {
        if (!this.isVisible || !this.scene || !this.camera || !this.isInitialized) {
            if (this.animationFrameId) {
                this.stopAnimation();
            }
            return;
        }

        if (!this.animationFrameId) {
            this.logger.log('Animation started', {
                conditions: ['running'],
                functionName: 'animate'
            });
        }

        const { time, aspect, isMobile } = this._getTimeAndAspect();

        this.glows.forEach(glow => {
            const mesh = glow.mesh;
            const timeOffset = time * glow.speed;
            
            // Создаем более сложное движение с использованием нескольких волн
            const wave1 = Math.sin(timeOffset * 0.5) * 0.3;
            const wave2 = Math.cos(timeOffset * 0.3) * 0.2;
            const wave3 = Math.sin(timeOffset * 0.7) * 0.1;
            
            // Обновляем позицию с учетом всех волн
            mesh.position.x += (wave1 + wave2) * glow.direction.x * 0.002;
            mesh.position.y += (wave2 + wave3) * glow.direction.y * 0.002;
            
            // Добавляем движение по Z с разной частотой
            mesh.position.z = Math.sin(timeOffset * 0.4) * 0.2 + Math.cos(timeOffset * 0.2) * 0.1;
            
            // Добавляем вращение с разной скоростью
            mesh.rotation.x += glow.speed * 0.0001;
            mesh.rotation.y += glow.speed * 0.00015;
            mesh.rotation.z += glow.speed * 0.0002;
            
            // Проверяем границы и меняем направление
            if (Math.abs(mesh.position.x) > aspect) {
                glow.direction.x *= -1;
                mesh.position.x = Math.sign(mesh.position.x) * aspect;
            }
            if (Math.abs(mesh.position.y) > 1) {
                glow.direction.y *= -1;
                mesh.position.y = Math.sign(mesh.position.y);
            }
            
            // Обновляем время для материала
            mesh.material.uniforms.time.value = time;
        });

        this.render();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize() {
        if (!this.renderer || !this.camera) return;

        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        updateRendererSize(this.renderer, this.container, this.camera);
        
        // Update camera aspect ratio
        this.camera.left = -aspect;
        this.camera.right = aspect;
        this.camera.top = 1;
        this.camera.bottom = -1;
        this.camera.updateProjectionMatrix();
    }

    cleanup() {
        this.logger.log('Starting cleanup');
        
        if (this.glows) {
            this.glows.forEach(glow => {
                if (glow.mesh) {
                    this.scene.remove(glow.mesh);
                    glow.mesh.geometry.dispose();
                    glow.mesh.material.dispose();
                }
            });
            this.glows = [];
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isInitialized = false;

        super.cleanup();
        
        this.logger.log('Cleanup completed');
    }

    getRandomValue(min, max) {
        return Math.random() * (max - min) + min;
    }

    update() {
        if (!this.isVisible || !this.scene || !this.camera || !this.isInitialized) {
            return;
        }

        const time = this.clock.getElapsedTime();
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        this.glows.forEach(glow => {
            const mesh = glow.mesh;
            const timeOffset = time * glow.speed * 0.5;

            // Update position
            mesh.position.x += Math.sin(timeOffset) * glow.direction.x * 0.002;
            mesh.position.y += Math.cos(timeOffset) * glow.direction.y * 0.002;
            mesh.position.z = Math.sin(time * glow.speed * 0.3) * 0.2;
            mesh.rotation.z += glow.speed * 0.0002;

            // Check boundaries
            if (Math.abs(mesh.position.x) > aspect) {
                glow.direction.x *= -1;
                mesh.position.x = Math.sign(mesh.position.x) * aspect;
            }
            if (Math.abs(mesh.position.y) > 1) {
                glow.direction.y *= -1;
                mesh.position.y = Math.sign(mesh.position.y);
            }

            mesh.material.uniforms.time.value = time;
        });

        this.render();
    }
}
