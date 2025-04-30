import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from "../../utils/logger";
import { getRandomValue } from "../../utils/utils";

export class Glow extends AnimationController {
    constructor(container, options = {}) {
        super(container, {
            camera: {
                fov: 45,
                near: 0.1,
                far: 2000,
                position: { x: 0, y: 0, z: 3 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: false,
                speed: { x: 0, y: 0 }
            },
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            }
        });

        this.options = {
            count: options.count || 5,
            colors: options.colors || ['#7A42F4', '#4642F4', '#F00AFE', '#56FFEB'],
            size: {
                min: options.size?.min || 0.2,
                max: options.size?.max || 0.8,
            },
            speed: {
                min: options.speed?.min || 0.05,
                max: options.speed?.max || 0.1,
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
                min: options.pulse?.min || 0.02,
                max: options.pulse?.max || 1.0,
            },
            range: {
                x: options.range?.x || 0.8,
                y: options.range?.y || 0.8,
                z: options.range?.z || 0.5
            },
            zIndex: options.zIndex || '1'
        };

        this.glows = [];
        this.clock = new THREE.Clock();
        this.name = 'Glow';
        this.logger = createLogger(this.name);
        
        this.roadmapQuarters = document.querySelectorAll('.roadmap-quarter');
        this.quarterColors = Array.from(this.roadmapQuarters).map(quarter => {
            const computedStyle = window.getComputedStyle(quarter);
            return computedStyle.getPropertyValue('--roamap-color');
        });
        
        this.logger.log('Controller initialization', {
            conditions: ['initializing-controller'],
            options: this.options
        });
    }

    setupScene() {
        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'setupScene'
        });

        this.createGlows();
    }

    createGlows() {
        const segments = 32;
        const geometry = new THREE.CircleGeometry(0.5, segments);

        const colors = [];
        const colorCount = this.options.colors.length;
        for (let i = 0; i < this.options.count; i++) {
            const colorIndex = i % colorCount;
            colors.push(new THREE.Color(this.options.colors[colorIndex]));
        }
        
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        
        for (let i = 0; i < this.options.count; i++) {
            const size = getRandomValue(this.options.size.min, this.options.size.max);
            const color = colors[i];
            const opacity = getRandomValue(this.options.opacity.min, this.options.opacity.max);
            const pulseSpeed = getRandomValue(this.options.pulse.min, this.options.pulse.max);
            const scale = getRandomValue(this.options.scale.min, this.options.scale.max);
            
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
                        
                        float glow = smoothstep(0.5, 0.0, dist);
                        float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
                        float intensity = glow * falloff;
                        
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
            this.scene.add(mesh);
            
            this.glows[i] = {
                mesh,
                speed: getRandomValue(this.options.speed.min, this.options.speed.max),
                size,
                opacity,
                pulseSpeed,
                scale,
                color: color.getHexString(),
                originalColor: color.clone(),
                initialAngle: 0,
                waveFrequency: getRandomValue(0.2, 0.5),
                waveAmplitude: getRandomValue(0.3, 0.6),
                pathChangeInterval: getRandomValue(3, 7),
                lastPathChange: 0,
                currentPath: {
                    x: Math.random() * 2 - 1,
                    y: Math.random() * 2 - 1
                }
            };
            
            this.setRandomPosition(mesh, size, i);

            this.logger.log(`Glow ${i + 1} created`, {
                custom: {
                    position: `x: ${mesh.position.x.toFixed(2)}, y: ${mesh.position.y.toFixed(2)}, z: ${mesh.position.z.toFixed(2)}`,
                    color: color.getHexString(),
                    size: size.toFixed(2),
                    opacity: opacity.toFixed(2),
                    scale: scale.toFixed(2),
                    pulseSpeed: pulseSpeed.toFixed(2)
                },
                conditions: ['glow-created']
            });
        }
    }

    setRandomPosition(mesh, size, index) {
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;
        
        const xRange = aspect * this.options.range.x;
        const yRange = this.options.range.y;
        const zRange = this.options.range.z;
        
        const sectors = this.options.count;
        const sectorIndex = index % sectors;
        const angleStep = (Math.PI * 2) / sectors;
        
        const centerAngle = sectorIndex * angleStep + angleStep / 2;
        
        const angleOffset = (Math.random() - 0.5) * angleStep * 0.8;
        const angle = centerAngle + angleOffset;
        
        const minRadius = Math.min(xRange, yRange) * 0.3;
        const maxRadius = Math.min(xRange, yRange) * 0.9;
        const radius = minRadius + (maxRadius - minRadius) * (index % 2 === 0 ? 0.7 : 0.3);
        
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.y = Math.sin(angle) * radius;
        mesh.position.z = (Math.random() * 2 - 1) * zRange * 0.5;
        
        mesh.scale.set(size, size, 1);
        mesh.rotation.z = 0;
        
        this.glows[index] = {
            mesh,
            speed: getRandomValue(this.options.speed.min, this.options.speed.max),
            size,
            opacity: getRandomValue(this.options.opacity.min, this.options.opacity.max),
            pulseSpeed: getRandomValue(this.options.pulse.min, this.options.pulse.max),
            scale: getRandomValue(this.options.scale.min, this.options.scale.max),
            color: mesh.material.uniforms.color.value.getHexString(),
            originalColor: mesh.material.uniforms.color.value.clone(),
            initialAngle: angle,
            waveFrequency: getRandomValue(0.2, 0.5),
            waveAmplitude: getRandomValue(0.3, 0.6),
            pathChangeInterval: getRandomValue(3, 7),
            lastPathChange: 0,
            currentPath: {
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1
            }
        };
        
        this.logger.log(`Glow ${index + 1} positioned`, {
            custom: {
                sector: sectorIndex,
                angle: angle.toFixed(2),
                radius: radius.toFixed(2),
                position: `x: ${mesh.position.x.toFixed(2)}, y: ${mesh.position.y.toFixed(2)}, z: ${mesh.position.z.toFixed(2)}`
            },
            conditions: ['glow-positioned']
        });
    }

    update() {
        if (!this.canAnimate() || !this.glows.length) return;

        const time = this.clock.getElapsedTime();
        const rect = this.container.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        this.glows.forEach((glow, index) => {
            const mesh = glow.mesh;
            const timeOffset = time * glow.speed;

            if (time - glow.lastPathChange > glow.pathChangeInterval) {
                glow.currentPath = {
                    x: Math.random() * 2 - 1,
                    y: Math.random() * 2 - 1
                };
                glow.lastPathChange = time;
                glow.waveFrequency = getRandomValue(0.2, 0.5);
                glow.waveAmplitude = getRandomValue(0.3, 0.6);
            }

            const waveX = Math.sin(timeOffset * glow.waveFrequency) * glow.waveAmplitude;
            const waveY = Math.cos(timeOffset * glow.waveFrequency * 1.2) * glow.waveAmplitude;
            
            const additionalWaveX = Math.sin(timeOffset * 0.3) * 0.2;
            const additionalWaveY = Math.cos(timeOffset * 0.4) * 0.2;

            mesh.position.x += (waveX + additionalWaveX) * glow.currentPath.x * 0.003;
            mesh.position.y += (waveY + additionalWaveY) * glow.currentPath.y * 0.003;
            
            mesh.position.z = Math.sin(timeOffset * glow.waveFrequency * 0.5) * 0.2;
            
            mesh.rotation.x = 0;
            mesh.rotation.y = 0;
            mesh.rotation.z = 0;

            const xRange = aspect * this.options.range.x;
            const yRange = this.options.range.y;
            
            if (Math.abs(mesh.position.x) > xRange) {
                mesh.position.x = Math.sign(mesh.position.x) * xRange;
                glow.currentPath.x *= -1;
                glow.waveFrequency = getRandomValue(0.2, 0.5);
            }
            
            if (Math.abs(mesh.position.y) > yRange) {
                mesh.position.y = Math.sign(mesh.position.y) * yRange;
                glow.currentPath.y *= -1;
                glow.waveFrequency = getRandomValue(0.2, 0.5);
            }

            const meshScreenPos = this.getScreenPosition(mesh);
            let isIntersecting = false;
            let targetColor = null;
            
            this.roadmapQuarters.forEach((quarter, quarterIndex) => {
                const quarterRect = quarter.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                const x = meshScreenPos.x - containerRect.left;
                const y = meshScreenPos.y - containerRect.top;
                
                if (x >= quarterRect.left - containerRect.left && 
                    x <= quarterRect.right - containerRect.left &&
                    y >= quarterRect.top - containerRect.top && 
                    y <= quarterRect.bottom - containerRect.top) {
                    
                    targetColor = new THREE.Color(this.quarterColors[quarterIndex]);
                    isIntersecting = true;
                }
            });
            
            if (!isIntersecting) {
                targetColor = glow.originalColor;
            }

            if (targetColor) {
                const currentColor = mesh.material.uniforms.color.value;
                const lerpFactor = 0.01;
                currentColor.lerp(targetColor, lerpFactor);
                mesh.material.uniforms.color.value = currentColor;
            }

            mesh.material.uniforms.time.value = time;
        });

        this.renderer.render(this.scene, this.camera);
    }

    getScreenPosition(mesh) {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(mesh.matrixWorld);
        vector.project(this.camera);
        
        const rect = this.container.getBoundingClientRect();
        const x = (vector.x * 0.5 + 0.5) * rect.width;
        const y = -(vector.y * 0.5 - 0.5) * rect.height;
        
        return { x, y };
    }

    cleanup() {
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

        super.cleanup();
    }
}
