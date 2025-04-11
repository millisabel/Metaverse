import * as THREE from 'three';
import { AnimationController } from '../utils/animationController_3D';
import { createCanvas, updateRendererSize, cleanupResources } from '../utils/canvasUtils';
import {createLogger} from "../utils/logger";

export class Glow extends AnimationController {
    constructor(parent, options = {}) {
        super(parent);
        this.name = 'Glow';
        this.logger = createLogger(this.name);
        this.logger.log('Initializing controller');
        
        const isMobile = window.innerWidth <= 768;

        // Default options
        this.options = {
            count: isMobile ? 3 : 5,
            colors: ['#ffffff', '#f0f0f0', '#e0e0e0'],
            size: {
                min: isMobile ? 0.2 : 0.5,
                max: isMobile ? 1.5 : 2
            },
            speed: {
                min: isMobile ? 0.05 : 0.0002,
                max: isMobile ? 0.1 : 0.0005
            },
            opacity: {
                min: 0.05,
                max: 0.15
            },
            scale: {
                min: 0.5,
                max: 1.2
            },
            pulse: {
                min: 0.02,
                max: 1.0
            },
            zIndex: '1',
            ...options
        };

        this.glows = [];
        this.clock = new THREE.Clock();
    }

    initScene() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            
            // Create camera
            const rect = this.container.getBoundingClientRect();
            const aspect = rect.width / rect.height;
            this.camera = new THREE.OrthographicCamera(
                -aspect, aspect, 1, -1, 0.1, 1000
            );
            this.camera.position.z = 1;

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Create canvas and add to container
            const canvas = createCanvas(this.renderer, { zIndex: this.options.zIndex });
            this.container.appendChild(canvas);

            // Create glows
            this.createGlows();
            
            // Initial render
            this.render();

            this.logger.log('Scene initialized successfully');
        } catch (error) {
            this.logger.log(`Error during scene initialization: ${error.message}`, 'error');
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
            
            // Create material with glow effect
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
            
            // Set initial position
            this.setRandomPosition(mesh, size);
            
            // Store glow properties
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
        
        // Adjust scale based on aspect ratio for both axes
        mesh.scale.set(size, size, 1);
        
        // Random rotation for more natural look
        mesh.rotation.z = Math.random() * Math.PI * 2;
    }

    animate() {
        if (!this.isVisible || !this.scene || !this.camera || !this.isInitialized) {
            if (this.animationFrameId) {
                this.stopAnimation();
            }
            return;
        }

        super.animate();

        const time = this.clock.getElapsedTime();
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        this.glows.forEach(glow => {
            const mesh = glow.mesh;
            const timeOffset = time * glow.speed * 0.5;
            
            // Update position
            mesh.position.x += Math.sin(timeOffset) * glow.direction.x * 0.002;
            mesh.position.y += Math.cos(timeOffset) * glow.direction.y * 0.002;
            
            // Add depth movement
            mesh.position.z = Math.sin(time * glow.speed * 0.3) * 0.2;
            
            // Add subtle rotation
            mesh.rotation.z += glow.speed * 0.0002;
            
            // Check boundaries and bounce
            if (Math.abs(mesh.position.x) > aspect) {
                glow.direction.x *= -1;
                mesh.position.x = Math.sign(mesh.position.x) * aspect;
            }
            if (Math.abs(mesh.position.y) > 1) {
                glow.direction.y *= -1;
                mesh.position.y = Math.sign(mesh.position.y);
            }
            
            // Update material time
            mesh.material.uniforms.time.value = time;
        });

        this.render();
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
}
