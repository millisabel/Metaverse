import * as THREE from 'three';
import { AnimationController } from '../../utils/animationController_3D';
import {createCanvas, updateRendererSize} from "../../utils/canvasUtils";
import { createStarTexture } from '../../utils/textureUtils';
import {createLogger} from "../../utils/logger";

export class Stars extends AnimationController {
    constructor(container, options = {}) {
        super(container);

        this.options = {
            count: window.innerWidth < 768 ? 2500 : 5000,
            colors: [0xFFFFFF],
            size: {
                min: 0.5,
                max: 1.5,
                attenuation: true,
                multiplier: window.innerWidth < 768 ? 1.5 : 2
            },
            depth: {
                range: window.innerWidth < 768 ? 500 : 1000,
                z: [-300, -100]
            },
            movement: {
                enabled: true,
                probability: 0.15,
                speed: 0.003,
                amplitude: { x: 0.05, y: 0.05, z: 0.02 }
            },
            flicker: {
                fast: {
                    probability: 0.3,
                    speed: { min: 0.05, max: 0.15 },
                    amplitude: { min: 0.5, max: 1.0 }
                },
                slow: {
                    speed: 0.005,
                    amplitude: 0.2
                }
            },
            camera: {
                rotation: false,
                speed: { x: 0.00002, y: 0.00002 }
            },
            material: {
                opacity: 1,
                transparent: true,
                blending: THREE.NormalBlending
            },
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.stars = null;
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;

        this.name = 'Stars';
        this.logger = createLogger(this.name);

        this.logger.log({
            conditions: ['initializing-controller'],
        });
    }

    initScene() {
        if (this.isInitialized) return;

        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'initScene'
        });

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });


        this.setupScene();
        this.createStars();
        this.isInitialized = true;
    }

    initStarAttributes(positions, colors, sizes) {
        for (let i = 0; i < this.options.count; i++) {
            // Positions with gaussian distribution
            positions[i * 3] = this.gaussianRandom(0, this.options.depth.range / 3);
            positions[i * 3 + 1] = this.gaussianRandom(0, this.options.depth.range / 3);
            positions[i * 3 + 2] = this.options.depth.z[0] + Math.random() * (this.options.depth.z[1] - this.options.depth.z[0]);

            // Colors
            const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
            colors[i * 3] = (color >> 16 & 255) / 255;
            colors[i * 3 + 1] = (color >> 8 & 255) / 255;
            colors[i * 3 + 2] = (color & 255) / 255;

            // Sizes
            sizes[i] = this.randomRange(this.options.size.min, this.options.size.max);

            // Animation parameters
            this.phases[i] = Math.random() * Math.PI * 2;
            this.isMoving[i] = this.options.movement.enabled && Math.random() < this.options.movement.probability ? 1 : 0;
            this.movePhases[i] = Math.random() * Math.PI * 2;

            if (Math.random() < this.options.flicker.fast.probability) {
                this.flickerSpeeds[i] = this.randomRange(
                    this.options.flicker.fast.speed.min,
                    this.options.flicker.fast.speed.max
                );
                this.flickerAmplitudes[i] = this.randomRange(
                    this.options.flicker.fast.amplitude.min,
                    this.options.flicker.fast.amplitude.max
                );
            } else {
                this.flickerSpeeds[i] = this.options.flicker.slow.speed;
                this.flickerAmplitudes[i] = this.options.flicker.slow.amplitude;
            }
        }
    }

    setupGeometry(geometry, positions, colors, sizes) {
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    }

    createStarPoints(geometry) {
        const material = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: this.options.size?.attenuation ?? true,
            size: this.options.size?.multiplier ?? 2,
            transparent: this.options.material?.transparent ?? true,
            opacity: this.options.material?.opacity ?? 1,
            blending: this.options.material?.blending ?? THREE.NormalBlending,
            map: createStarTexture()
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    gaussianRandom(mean = 0, stdev = 1) {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdev + mean;
    }

    setupScene() {
        updateRendererSize(this.renderer, this.container, this.camera);
        this.container.appendChild(this.renderer.domElement);
        createCanvas(this.renderer, { zIndex: '2' });
        
        // Apply all camera settings from options
        if (this.options.camera) {
            // Apply position
            if (this.options.camera.position) {
                Object.entries(this.options.camera.position).forEach(([axis, value]) => {
                    this.camera.position[axis] = value;
                });
            }

            // Apply rotation
            if (this.options.camera.rotation !== undefined) {
                this.options.camera.rotation = this.options.camera.rotation;
            }

            // Apply speed
            if (this.options.camera.speed) {
                this.options.camera.speed = {
                    ...this.options.camera.speed,
                    x: this.options.camera.speed.x || 0.00002,
                    y: this.options.camera.speed.y || 0.00002
                };
            }
        }
    }

    createStars() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.options.count * 3);
        const colors = new Float32Array(this.options.count * 3);
        const sizes = new Float32Array(this.options.count);

        this.phases = new Float32Array(this.options.count);
        this.isMoving = new Float32Array(this.options.count);
        this.movePhases = new Float32Array(this.options.count);
        this.flickerSpeeds = new Float32Array(this.options.count);
        this.flickerAmplitudes = new Float32Array(this.options.count);

        this.initStarAttributes(positions, colors, sizes);
        this.setupGeometry(geometry, positions, colors, sizes);
        this.createStarPoints(geometry);
    }

    update() {
        if (!this.isVisible || !this.stars || !this.phases || !this.flickerSpeeds || !this.flickerAmplitudes) {
            if (this.animationFrameId) {
                this.logger.log('Animation stopped', {
                    conditions: ['paused'],
                    functionName: 'update'
                });
            }
            return;
        }

        if (!this.animationFrameId) {
            this.logger.log('Animation started', {
                conditions: ['running'],
                functionName: 'update'
            });
        }
        
        const positions = this.stars.geometry.attributes.position.array;
        const sizes = this.stars.geometry.attributes.size.array;
        const depthRange = this.options.depth.range;
        
        // Apply camera rotation if enabled
        if (this.options.camera?.rotation) {
            this.camera.rotation.x += this.options.camera.speed.x;
            this.camera.rotation.y += this.options.camera.speed.y;
        }
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            this.phases[index] += this.flickerSpeeds[index];
            const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
            sizes[index] = brightness * this.randomRange(this.options.size.min, this.options.size.max);
            
            if (this.isMoving[index] === 1) {
                this.movePhases[index] += this.options.movement.speed;
                
                // Use default amplitude if not specified
                const amplitude = this.options.movement.amplitude || { x: 0.05, y: 0.05, z: 0.02 };
                
                positions[i] += Math.sin(this.movePhases[index]) * amplitude.x;
                positions[i + 1] += Math.cos(this.movePhases[index]) * amplitude.y;
                positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * amplitude.z;
            }
            
            // Boundary checks
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < this.options.depth.z[0]) positions[i + 2] = this.options.depth.z[1];
            if (positions[i + 2] > this.options.depth.z[1]) positions[i + 2] = this.options.depth.z[0];
        }
        
        this.stars.geometry.attributes.position.needsUpdate = true;
        this.stars.geometry.attributes.size.needsUpdate = true;
        
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        updateRendererSize(this.renderer, this.container, this.camera);
    }

    cleanup() {
        super.cleanup(this.renderer, this.scene);
        
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
            this.stars = null;
            this.logger.log(`Stars disposed`);
        }
        
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
        this.logger.log(`Cleanup completed`);
    }
}