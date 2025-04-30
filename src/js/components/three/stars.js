import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createStarTexture } from '../../utilsThreeD/textureUtils';
import { createLogger } from "../../utils/logger";
import { gaussianRandom, setupGeometry } from '../../utilsThreeD/utilsThreeD';
import { getRandomValue } from '../../utils/utils';

export class Stars extends AnimationController {
    constructor(container, options = {}) {
        // Initialize base class with camera options
        super(container, {
            camera: {
                fov: 45,
                near: 0.1,
                far: 2000,
                position: { x: 0, y: 0, z: 5 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: false,
                speed: { x: 0.00002, y: 0.00002 }
            },
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            }
        });

        // Initialize Stars specific options
        this.starsOptions = {
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
            material: {
                opacity: 1,
                transparent: true,
                blending: THREE.NormalBlending
            },
            ...options
        };
        
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

    setupScene() {
        this.logger.log('Setting up stars scene', {
            conditions: ['setting-up-scene'],
            functionName: 'setupScene'
        });

        this.createStars();
    }

    initStarAttributes(positions, colors, sizes) {
        for (let i = 0; i < this.starsOptions.count; i++) {
            // Positions with gaussian distribution
            positions[i * 3] = gaussianRandom(0, this.starsOptions.depth.range / 3);
            positions[i * 3 + 1] = gaussianRandom(0, this.starsOptions.depth.range / 3);
            positions[i * 3 + 2] = this.starsOptions.depth.z[0] + Math.random() * (this.starsOptions.depth.z[1] - this.starsOptions.depth.z[0]);

            // Colors
            const color = this.starsOptions.colors[Math.floor(Math.random() * this.starsOptions.colors.length)];
            colors[i * 3] = (color >> 16 & 255) / 255;
            colors[i * 3 + 1] = (color >> 8 & 255) / 255;
            colors[i * 3 + 2] = (color & 255) / 255;

            // Sizes
            sizes[i] = getRandomValue(this.starsOptions.size.min, this.starsOptions.size.max);

            // Animation parameters
            this.phases[i] = Math.random() * Math.PI * 2;
            this.isMoving[i] = this.starsOptions.movement.enabled && Math.random() < this.starsOptions.movement.probability ? 1 : 0;
            this.movePhases[i] = Math.random() * Math.PI * 2;

            if (Math.random() < this.starsOptions.flicker.fast.probability) {
                this.flickerSpeeds[i] = getRandomValue(
                    this.starsOptions.flicker.fast.speed.min,
                    this.starsOptions.flicker.fast.speed.max
                );
                this.flickerAmplitudes[i] = getRandomValue(
                    this.starsOptions.flicker.fast.amplitude.min,
                    this.starsOptions.flicker.fast.amplitude.max
                );
            } else {
                this.flickerSpeeds[i] = this.starsOptions.flicker.slow.speed;
                this.flickerAmplitudes[i] = this.starsOptions.flicker.slow.amplitude;
            }
        }
    }

    createStarPoints(geometry) {
        const material = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: this.starsOptions.size?.attenuation ?? true,
            size: this.starsOptions.size?.multiplier ?? 2,
            transparent: this.starsOptions.material?.transparent ?? true,
            opacity: this.starsOptions.material?.opacity ?? 1,
            blending: this.starsOptions.material?.blending ?? THREE.NormalBlending,
            map: createStarTexture()
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    createStars() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.starsOptions.count * 3);
        const colors = new Float32Array(this.starsOptions.count * 3);
        const sizes = new Float32Array(this.starsOptions.count);

        this.phases = new Float32Array(this.starsOptions.count);
        this.isMoving = new Float32Array(this.starsOptions.count);
        this.movePhases = new Float32Array(this.starsOptions.count);
        this.flickerSpeeds = new Float32Array(this.starsOptions.count);
        this.flickerAmplitudes = new Float32Array(this.starsOptions.count);

        this.initStarAttributes(positions, colors, sizes);
        setupGeometry(geometry, positions, colors, sizes);
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
        const depthRange = this.starsOptions.depth.range;
        
        // Update camera rotation
        this.cameraController.updateRotation();
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            this.phases[index] += this.flickerSpeeds[index];
            const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
            sizes[index] = brightness * getRandomValue(this.starsOptions.size.min, this.starsOptions.size.max);
            
            if (this.isMoving[index] === 1) {
                this.movePhases[index] += this.starsOptions.movement.speed;
                
                // Use default amplitude if not specified
                const amplitude = this.starsOptions.movement.amplitude || { x: 0.05, y: 0.05, z: 0.02 };
                
                positions[i] += Math.sin(this.movePhases[index]) * amplitude.x;
                positions[i + 1] += Math.cos(this.movePhases[index]) * amplitude.y;
                positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * amplitude.z;
            }
            
            // Boundary checks
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < this.starsOptions.depth.z[0]) positions[i + 2] = this.starsOptions.depth.z[1];
            if (positions[i + 2] > this.starsOptions.depth.z[1]) positions[i + 2] = this.starsOptions.depth.z[0];
        }
        
        this.stars.geometry.attributes.position.needsUpdate = true;
        this.stars.geometry.attributes.size.needsUpdate = true;
        
        this.renderer.render(this.scene, this.camera);
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