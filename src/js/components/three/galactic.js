import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from "../../utils/logger";
import { isMobile } from '../../utils/utils';
import { addDefaultLights } from '../../utilsThreeD/utilsThreeD';

export class GalacticCloud extends AnimationController {
    constructor(container) {
        super(container, {
            camera: {
                fov: 60,
                near: 0.1,
                far: 1000,
                position: { x: 0, y: 5, z: 15 },
                lookAt: { x: 0, y: 0, z: 0 },
                rotation: true,
                speed: { x: 0.0002, y: 0.0002 }
            },
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            }
        });

        this.galaxyCore = null;
        this.spiralArms = [];
        this.composer = null;

        this.name = 'GalacticCloud';
        this.logger = createLogger(this.name);
        this.logger.log('Controller initialization', {
            conditions: ['initializing-controller'],
            functionName: 'constructor'
        });
    }

    setupScene() {
        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'setupScene'
        });

        const mobile = isMobile();
        const radius = mobile ? 20 : 15;
        const height = mobile ? -15 : 5;
        const offsetX = mobile ? 0 : -4;
        
        this.cameraController.setPosition({ x: offsetX, y: height, z: radius });
        this.cameraController.setLookAt({ x: offsetX, y: 0, z: 0 });

        // Используем утилиту для добавления света
        addDefaultLights(this.scene, {
            ambientColor: 0x9933ff,
            ambientIntensity: 0.5,
            pointColor: 0xcc66ff,
            pointIntensity: 2,
            pointPosition: { x: offsetX, y: 2, z: 0 }
        });

        this.createGalaxyCore();
        this.createSpiralArms();
        this.setupPostProcessing();
    }

    createGalaxyCore() {
        const coreGeometry = new THREE.PlaneGeometry(2, 2, 128, 128);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;

                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec2 center = vec2(0.5);
                    float dist = length(vUv - center);
                    
                    // Base core glow
                    float core = smoothstep(0.5, 0.0, dist);
                    
                    // Add noise for unevenness
                    float noise1 = noise(vUv * 10.0 + time);
                    float noise2 = noise(vUv * 20.0 - time * 0.5);
                    
                    // Mix colors
                    vec3 color1 = vec3(0.8, 0.4, 1.0); // Light purple
                    vec3 color2 = vec3(0.4, 0.0, 0.8); // Dark purple
                    vec3 finalColor = mix(color2, color1, core + noise1 * 0.2);
                    
                    float alpha = core * (1.0 + noise2 * 0.3);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.galaxyCore = new THREE.Mesh(coreGeometry, coreMaterial);
        this.galaxyCore.rotation.x = -Math.PI / 2;
        this.scene.add(this.galaxyCore);
    }

    createSpiralArms() {
        this.spiralArms = [];
        
        // Create main galaxy texture
        const textureLoader = new THREE.TextureLoader();
        const galaxyTexture = textureLoader.load('./assets/images/galaxy-texture.png');
        
        // Adaptive plane size
        const mobile = isMobile();
        const planeSize = mobile ? 12 : 8; // Increase size on mobile
        
        // Create main galaxy plane
        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: galaxyTexture,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        const galaxyPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        galaxyPlane.rotation.x = Math.PI / 2;
        this.scene.add(galaxyPlane);
        this.spiralArms.push(galaxyPlane);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,    // Intensity of glow
            0.5,    // Glow radius
            0.2     // Glow threshold
        );
        
        // Setup glow colors
        bloomPass.threshold = 0.2;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0.5;
        
        this.composer.addPass(bloomPass);
    }

    update() {
        if (!this.isVisible || !this.scene || !this.camera) return;

        const time = performance.now() * 0.0001;
        const mobile = isMobile();
        const offsetX = mobile ? 0 : -4;
        
        // Complex pulsation with multiple waves
        const primaryWave = Math.sin(time * 0.5) * 0.15;
        const secondaryWave = Math.sin(time * 0.2) * 0.1;
        const microWave = Math.sin(time * 1.5) * 0.05;
        
        const pulseFactor = 2.0 + primaryWave + secondaryWave + microWave;

        // Galaxy core animation
        if (this.galaxyCore) {
            this.galaxyCore.material.uniforms.time.value = time;
        }

        // Smooth galaxy pulsation
        if (this.spiralArms[0]) {
            this.spiralArms[0].scale.set(pulseFactor, pulseFactor, pulseFactor);
        }

        // Update camera position through cameraController
        const baseRadius = mobile ? 20 : 15;
        const zoomPrimary = Math.sin(time * 0.3) * 2;
        const zoomSecondary = Math.sin(time * 0.1) * 1;
        const zoomMicro = Math.sin(time * 0.8) * 0.5;
        
        const currentRadius = baseRadius + zoomPrimary + zoomSecondary + zoomMicro;
        const cameraAngle = -time * (mobile ? 0.15 : 0.2);
        
        this.cameraController.setPosition({
            x: offsetX + Math.sin(cameraAngle) * currentRadius,
            y: (mobile ? -15 : 5) + Math.sin(time * 0.4) * 0.5,
            z: Math.cos(cameraAngle) * currentRadius
        });
        
        this.cameraController.setLookAt({ x: offsetX, y: 0, z: 0 });

        this.composer.render();
    }

    onResize() {
        if (!this.renderer || !this.camera) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const mobile = isMobile();

        // Update renderer sizes
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        // Update camera position through cameraController
        const radius = mobile ? 20 : 15;
        const cameraHeight = mobile ? -15 : 5;
        const offsetX = mobile ? 0 : -4;
        
        this.cameraController.setPosition({ x: offsetX, y: cameraHeight, z: radius });
        this.cameraController.setLookAt({ x: offsetX, y: 0, z: 0 });

        // Update galaxy size if needed
        if (this.spiralArms[0]) {
            const planeSize = mobile ? 12 : 8;
            this.spiralArms[0].scale.set(planeSize/8, planeSize/8, planeSize/8);
        }

        if (this.galaxyCore) {
            this.galaxyCore.material.uniforms.resolution.value.set(width, height);
        }
    }

    cleanup() {
        let message = `starting cleanup in ${this.constructor.name}\n`;
        
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
            message += 'Composer disposed\n';
        }

        super.cleanup(message);
    }
}

