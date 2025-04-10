import * as THREE from 'three';
import { ContainerManager } from '../utils/containerManager';
import { AnimationController } from '../utils/animationController_3D';
import { createCanvas, updateRendererSize, cleanupResources } from '../utils/canvasUtils';

export class Glow extends AnimationController {
    constructor(parent, options = {}) {
        super(parent);
        this.name = 'Glow';
        this.log(`Initializing ${this.name}`);

        // Default options
        this.options = {
            count: 5,
            colors: ['#ffffff', '#f0f0f0', '#e0e0e0'],
            size: {
                min: 0.5,
                max: 2
            },
            speed: {
                min: 0.1,
                max: 0.5
            },
            opacity: {
                min: 0.05,
                max: 0.25
            },
            scale: {
                min: 0.8,
                max: 1.2
            },
            pulse: {
                min: 0.2,
                max: 2.0
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
            this.camera = new THREE.OrthographicCamera(
                -1, 1, 1, -1, 0.1, 1000
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
            
            this.log('Scene initialized successfully');
        } catch (error) {
            this.log(`Error during scene initialization: ${error.message}`, 'error');
        }
    }

    createGlows() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        
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
                        vPulse = scale * (0.5 + 0.5 * sin(time * pulseSpeed));
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
        const scaleX = size * (aspect > 1 ? 1 : aspect);
        const scaleY = size * (aspect > 1 ? 1 / aspect : 1);
        mesh.scale.set(scaleX, scaleY, 1);
        
        // Random rotation for more natural look
        mesh.rotation.z = Math.random() * Math.PI * 2;
    }

    animate() {
        if (!this.isVisible) {
            if (this.animationFrameId) {
                this.log('Stopping animation');
                this.stopAnimation();
            }
            return;
        }

        if (!this.animationFrameId) {
            this.log('Starting animation');
        }

        const time = this.clock.getElapsedTime();
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        this.glows.forEach(glow => {
            const mesh = glow.mesh;
            
            // Update position
            mesh.position.x += glow.direction.x * glow.speed * 0.01;
            mesh.position.y += glow.direction.y * glow.speed * 0.01;
            
            // Add depth movement
            mesh.position.z = Math.sin(time * glow.speed) * 0.5;
            
            // Add subtle rotation
            mesh.rotation.z += glow.speed * 0.001;
            
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
        updateRendererSize(this.renderer, this.container, this.camera);
        
        // Update camera aspect ratio
        this.camera.left = -1;
        this.camera.right = 1;
        this.camera.top = 1;
        this.camera.bottom = -1;
        this.camera.updateProjectionMatrix();
    }

    cleanup() {
        this.log('Starting cleanup');
        
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

        cleanupResources(this.renderer, this.scene);
        super.cleanup();
        
        this.log('Cleanup completed');
    }

    getRandomValue(min, max) {
        return Math.random() * (max - min) + min;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${this.name}]`;
        const formattedMessage = `${timestamp} ${prefix} ${message}`;
        
        switch (type) {
            case 'error':
                console.error(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
}
