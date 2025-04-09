import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AnimationController } from '../utils/animationController';

export class GalacticCloud extends AnimationController {
    constructor(container) {
        super(container);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.galaxyCore = null;
        this.spiralArms = [];
        this.composer = null;
        this.name = 'GalacticCloud';
    }

    initScene() {
        if (this.isInitialized) return;
        console.log(`[${this.name}] Initializing scene`);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });

        this.updateRendererSize();
        this.container.appendChild(this.renderer.domElement);

        const canvas = this.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';
        canvas.style.pointerEvents = 'none';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.overflow = 'hidden';
        canvas.style.transform = 'translateZ(0)';
        canvas.style.backfaceVisibility = 'hidden';
        canvas.style.willChange = 'transform';

        // Adaptive camera setup for different devices
        const isMobile = this.container.clientWidth < 768;
        const radius = isMobile ? 20 : 15;
        const height = isMobile ? -15 : 5;
        const offsetX = isMobile ? 0 : -4;
        
        this.camera.position.set(offsetX, height, radius);
        this.camera.lookAt(offsetX, 0, 0);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x9933ff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xcc66ff, 2);
        pointLight.position.set(offsetX, 2, 0);
        this.scene.add(pointLight);

        this.createGalaxyCore();
        this.createSpiralArms();
        this.setupPostProcessing();
        
        this.isInitialized = true;
    }

    updateRendererSize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        if (this.composer) {
            this.composer.setSize(width, height);
        }
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
        const isMobile = this.container.clientWidth < 768;
        const planeSize = isMobile ? 12 : 8; // Increase size on mobile
        
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

    animate() {
        if (!this.isVisible || !this.scene || !this.camera) return;

        super.animate();

        const time = performance.now() * 0.0001;
        const isMobile = this.container.clientWidth < 768;
        const offsetX = isMobile ? 0 : -4;
        
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

        // Slow camera rotation in horizontal plane
        const baseRadius = isMobile ? 20 : 15;
        
        // Complex camera distance change
        const zoomPrimary = Math.sin(time * 0.3) * 2;
        const zoomSecondary = Math.sin(time * 0.1) * 1;
        const zoomMicro = Math.sin(time * 0.8) * 0.5;
        
        const currentRadius = baseRadius + zoomPrimary + zoomSecondary + zoomMicro;
        
        const cameraAngle = -time * (isMobile ? 0.15 : 0.2);
        this.camera.position.x = offsetX + Math.sin(cameraAngle) * currentRadius;
        this.camera.position.z = Math.cos(cameraAngle) * currentRadius;
        
        // Add small vertical movement for more dynamics
        const baseHeight = isMobile ? -15 : 5;
        const heightVariation = Math.sin(time * 0.4) * 0.5;
        this.camera.position.y = baseHeight + heightVariation;
        
        this.camera.lookAt(0, 0, 0);

        this.composer.render();
    }

    onResize() {
        if (!this.renderer || !this.camera) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const isMobile = width < 768;

        // Update renderer sizes
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        // Update camera position
        const radius = isMobile ? 20 : 15;
        const cameraHeight = isMobile ? -15 : 5;
        const offsetX = isMobile ? 0 : -4;
        this.camera.position.set(offsetX, cameraHeight, radius);
        this.camera.lookAt(offsetX, 0, 0);

        // Update galaxy size if needed
        if (this.spiralArms[0]) {
            const planeSize = isMobile ? 12 : 8;
            this.spiralArms[0].scale.set(planeSize/8, planeSize/8, planeSize/8);
        }

        if (this.galaxyCore) {
            this.galaxyCore.material.uniforms.resolution.value.set(width, height);
        }
    }

    cleanup() {
        console.log(`[${this.name}] Starting cleanup`);
        super.cleanup();
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
            console.log(`[${this.name}] Renderer disposed`);
        }
        
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.scene = null;
            console.log(`[${this.name}] Scene disposed`);
        }
        
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
            console.log(`[${this.name}] Composer disposed`);
        }
        
        console.log(`[${this.name}] Cleanup completed`);
    }
}

