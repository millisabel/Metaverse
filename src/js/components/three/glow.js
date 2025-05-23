import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from "../../utils/logger";
import { SingleGlow } from './singleGlow';

export class Glow extends AnimationController {
    constructor(container, options = {}) {
        super(container, {
            camera: {
                fov: 45,
                near: 0.1,
                far: 2000,
                position: { x: 0, y: 0, z: 3 },
                lookAt: { x: 0, y: 0, z: 0 }
            }
        });

        this.glowConfigs = options.glowConfigs || null;

        this.options = {
            count: options.count || 5,
            colors: options.colors || ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            randomizeColors: options.randomizeColors !== undefined ? options.randomizeColors : true,
            size: {
                min: options.size?.min || 0.2,
                max: options.size?.max || 0.8,
            },
            opacity: {
                min: options.opacity?.min || 0.1,
                max: options.opacity?.max || 0.2,
            },
            scale: {
                min: options.scale?.min || 0.5,
                max: options.scale?.max || 1.2,
            },
            pulse: {
                speed: options.pulse?.speed || 0.5,
                intensity: options.pulse?.intensity || 0.6,
                sync: options.pulse?.sync || false
            },
            movement: {
                enabled: options.movement?.enabled !== undefined ? options.movement.enabled : true,
                speed: options.movement?.speed || 0.05,
                range: options.movement?.range || { x: 0.8, y: 0.8, z: 0.5 }
            },
            position: options.position || { x: 0, y: 0, z: 0 },
            initialPositions: options.initialPositions || null
        };

        this.name = 'Glow';
        this.logger = createLogger(this.name);
        this.glows = [];
        
        this.init();
    }

    setupScene() {
        if (!this.scene) {
            this.logger.log('Scene not available for setup', {
                conditions: ['error'],
                functionName: 'setupScene'
            });
            return;
        }

        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'setupScene'
        });

        this.createGlows();
    }

    createGlows() {
        if (this.glowConfigs && Array.isArray(this.glowConfigs)) {
            this.glowConfigs.forEach((cfg, i) => {
                const glow = new SingleGlow(
                    this.scene,
                    this.renderer,
                    this.container,
                    cfg
                );
                this.glows.push(glow);
                this.logger.log(`Glow ${i + 1} created (custom config)`, {
                    custom: cfg,
                    conditions: ['glow-created-individual']
                });
            });
            return;
        }

        const colors = [...this.options.colors];
        if (this.options.randomizeColors) {
            for (let i = colors.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [colors[i], colors[j]] = [colors[j], colors[i]];
            }
        }

        for (let i = 0; i < this.options.count; i++) {
            const colorIndex = i % colors.length;
            const position = this.options.initialPositions ? 
                this.options.initialPositions[i % this.options.initialPositions.length] :
                this.calculateInitialPosition(i);

            const glow = new SingleGlow(
                this.scene,
                this.renderer,
                this.container,
                {
                    color: colors[colorIndex],
                    size: THREE.MathUtils.randFloat(this.options.size.min, this.options.size.max),
                    opacity: this.options.opacity,
                    scale: this.options.scale,
                    pulse: this.options.pulse,
                    position: position,
                    movement: this.options.movement
                }
            );

            this.glows.push(glow);

            this.logger.log(`Glow ${i + 1} created`, {
                custom: {
                    position: `x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}`,
                    color: colors[colorIndex]
                },
                conditions: ['glow-created']
            });
        }
    }

    calculateInitialPosition(index) {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        
        const xRange = aspect * this.options.movement.range.x;
        const yRange = this.options.movement.range.y;
        const zRange = this.options.movement.range.z;
        
        const sectors = this.options.count;
        const sectorIndex = index % sectors;
        const angleStep = (Math.PI * 2) / sectors;
        
        const centerAngle = sectorIndex * angleStep + angleStep / 2;
        const angleOffset = (Math.random() - 0.5) * angleStep * 0.8;
        const angle = centerAngle + angleOffset;
        
        const minRadius = Math.min(xRange, yRange) * 0.3;
        const maxRadius = Math.min(xRange, yRange) * 0.9;
        const radius = minRadius + (maxRadius - minRadius) * (index % 2 === 0 ? 0.7 : 0.3);
        
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: (Math.random() * 2 - 1) * zRange * 0.5
        };
    }

    update() {
        if (!this.canAnimate()) return;
        
        this.glows.forEach(glow => glow.update(this.camera));
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    updateMultipleObjectPulses(pulseValues) {
        if (!this.glows || !pulseValues) return;
        
        this.glows.forEach((glow, index) => {
            if (pulseValues[index] !== undefined) {
                glow.updateObjectPulse(pulseValues[index]);
            }
        });
    }

    setGlowPositions(positions) {
        if (!this.glows || !positions) return;

        this.glows.forEach((glow, index) => {
            if (positions[index]) {
                glow.setPosition(positions[index]);
            }
        });
    }

    toggleMovement(enabled) {
        this.glows.forEach(glow => glow.toggleMovement(enabled));
    }

    syncWithCard(card, glowIndex = 0) {
        if (!card || !this.glows || !this.glows[glowIndex]) return;

        // Get the specific glow to sync
        const glow = this.glows[glowIndex];
        
        // Get z-position combining group position and mesh position
        const groupZPosition = card.group.position.z;
        const meshZPosition = card.mesh ? card.mesh.position.z : 0;
        const zPosition = groupZPosition + meshZPosition;
        
        const params = card.animationParams;
        
        // Calculate z-position range based on animation parameters
        const zRange = {
            min: params.position.z.basePosition + params.position.z.amplitude, // Maximum distance
            max: params.position.z.basePosition // Maximum proximity
        };

        // Calculate normalized position (0 to 1)
        let normalizedZ = (zPosition - zRange.min) / (zRange.max - zRange.min);
        normalizedZ = Math.max(0, Math.min(1, normalizedZ));

        // Calculate scale and opacity using exponential scaling for more dramatic effect
        const scaleRange = this.options.scale;
        const opacityRange = this.options.opacity;

        // Use exponential scaling for more dramatic effect when object is closer
        const scaleFactor = Math.pow(normalizedZ, 1.5); // Exponential scaling
        const scale = scaleRange.min + (scaleRange.max - scaleRange.min) * scaleFactor;
        
        // Opacity follows a similar curve but with different power
        const opacityFactor = Math.pow(normalizedZ, 2); // More dramatic opacity change
        const opacity = opacityRange.min + (opacityRange.max - opacityRange.min) * opacityFactor;

        // Apply values to the glow mesh
        if (glow.mesh) {
            // Set scale
            glow.mesh.scale.set(scale, scale, 1);
            
            // Update opacity in shader uniforms
            if (glow.mesh.material.uniforms) {
                glow.mesh.material.uniforms.opacity.value = opacity;
            }

            // Log synchronization details for debugging
            this.logger.log('Syncing background glow with card', {
                custom: {
                    cardType: card.options.type,
                    glowIndex,
                    zPosition: zPosition.toFixed(3),
                    normalizedZ: normalizedZ.toFixed(3),
                    scale: scale.toFixed(3),
                    opacity: opacity.toFixed(3)
                },
                conditions: ['glow-sync']
            });
        }
    }

    dispose() {
        this.glows.forEach(glow => glow.dispose());
        this.glows = [];
        super.dispose();
    }
}
