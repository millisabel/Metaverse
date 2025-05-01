import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from '../../utils/logger';

export class Dynamics3D extends AnimationController {
    constructor(container, options = {}) {
        super(container, options);

        this.name = 'Dynamics3D';
        this.logger = createLogger(this.name);

        // Default options
        this.options = {
            type: 'guardians',
            color: 0x38DBFF,
            decoration: null,
            textureAnimation: {
                rotation: true,
                pulse: true,
                wave: true
            },
            ...options
        };

        // Initialize properties
        this.mesh = null;
        this.decorationMesh = null;
        this.group = new THREE.Group();
        
        // Animation parameters based on type
        this.animationParams = this.getAnimationParams();
        
        // Initialize scene and other components from parent class
        this.init();

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });
        this.renderer.setClearColor(0x000000, 0);

        // Add resize handler
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        if (this.container) {
            this.resizeObserver.observe(this.container);
        }
    }

    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        // Get container dimensions
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height || width; // Ensure square aspect ratio

        // Update camera
        this.camera.aspect = 1; // Keep aspect ratio 1:1
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(width, height, false);

        // Force a re-render
        if (this.scene) {
            this.renderer.render(this.scene, this.camera);
        }

        // Log resize for debugging
        this.logger.log(`Resizing canvas: ${width}x${height}`, {
            conditions: ['resize'],
            functionName: 'handleResize'
        });
    }

    getAnimationParams() {
        const baseParams = {
            texture: {
                rotation: { speed: 0.2, amplitude: 0.1 },
                pulse: { speed: 0.5, amplitude: 0.05 },
                wave: { 
                    speed: 0.3, 
                    amplitude: 0.1,
                    frequency: 2
                }
            }
        };

        switch(this.options.type) {
            case 'GUARDIANS_CARD':
                return {
                    ...baseParams,
                    texture: {
                        ...baseParams.texture,
                        rotation: { speed: 0.15, amplitude: 0.08 },
                        pulse: { speed: 0.4, amplitude: 0.04 },
                        wave: { 
                            speed: 0.25, 
                            amplitude: 0.08,
                            frequency: 2.5
                        }
                    },
                    rotation: {
                        x: { speed: 0.5, amplitude: 0.2 },
                        y: { speed: 0.7, amplitude: 0.2 },
                        z: { speed: 0.3, amplitude: 0.15 }
                    },
                    scale: { speed: 0.4, amplitude: 0.05 },
                    position: { 
                        y: { speed: 0.3, amplitude: 0.1 },
                        z: { speed: 0.2, amplitude: -4, basePosition: -1 }
                    }
                };
            case 'METAVERSE_CARD':
                return {
                    ...baseParams,
                    texture: {
                        ...baseParams.texture,
                        rotation: { speed: 0.2, amplitude: 0.1 },
                        pulse: { speed: 0.6, amplitude: 0.06 },
                        wave: { 
                            speed: 0.35, 
                            amplitude: 0.12,
                            frequency: 3
                        }
                    },
                    rotation: {
                        x: { speed: 0.7, amplitude: 0.25 },
                        y: { speed: 0.5, amplitude: 0.2 },
                        z: { speed: 0.4, amplitude: 0.15 }
                    },
                    scale: { speed: 0.6, amplitude: 0.05 },
                    position: { 
                        y: { speed: 0.5, amplitude: 0.1 },
                        z: { speed: 0.23, amplitude: -4, basePosition: -1 }
                    }
                };
            case 'SANKOPA_CARD':
                return {
                    ...baseParams,
                    texture: {
                        ...baseParams.texture,
                        rotation: { speed: 0.25, amplitude: 0.12 },
                        pulse: { speed: 0.7, amplitude: 0.08 },
                        wave: { 
                            speed: 0.4, 
                            amplitude: 0.15,
                            frequency: 3.5
                        }
                    },
                    rotation: {
                        x: { speed: 0.4, amplitude: 0.2 },
                        y: { speed: 0.6, amplitude: 0.25 },
                        z: { speed: 0.5, amplitude: 0.15 }
                    },
                    scale: { speed: 0.7, amplitude: 0.05 },
                    position: { 
                        y: { speed: 0.4, amplitude: 0.1 },
                        z: { speed: 0.18, amplitude: -4, basePosition: -1 }
                    }
                };
            default:
                return {
                    ...baseParams,
                    rotation: {
                        x: { speed: 0.5, amplitude: 0.2 },
                        y: { speed: 0.7, amplitude: 0.2 },
                        z: { speed: 0.3, amplitude: 0.15 }
                    },
                    scale: { speed: 0.4, amplitude: 0.05 },
                    position: { 
                        y: { speed: 0.3, amplitude: 0.1 },
                        z: { speed: 0.2, amplitude: -3.5, basePosition: 0 }
                    }
                };
        }
    }

    async createDecoration() {
        if (!this.options.decoration) {
            // Create more detailed ring geometry for wave animation
            const geometry = new THREE.PlaneGeometry(3, 3, 64, 64);
            const material = new THREE.MeshBasicMaterial({
                color: this.options.color,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });
            const decoration = new THREE.Mesh(geometry, material);
            decoration.position.z = -0.2;
            return decoration;
        }

        const loader = new THREE.TextureLoader();
        // Use more segments for smoother wave animation
        const planeGeometry = new THREE.PlaneGeometry(6, 6, 64, 64);
        
        try {
            const texture = await new Promise((resolve, reject) => {
                loader.load(
                    this.options.decoration,
                    (texture) => resolve(texture),
                    undefined,
                    (error) => reject(error)
                );
            });

            // Material settings based on card type
            let materialConfig = {
                map: texture,
                transparent: true,
                opacity: 1,
                emissive: this.options.color,
                emissiveIntensity: 1.2,
                side: THREE.DoubleSide,
                metalness: 0.5,
                roughness: 0.2
            };

            // Individual settings for each card type
            switch(this.options.type) {
                case 'GUARDIANS_CARD':
                    materialConfig.emissiveIntensity = 1.5;
                    materialConfig.metalness = 0.8;
                    materialConfig.roughness = 0.1;
                    break;
                case 'METAVERSE_CARD':
                    materialConfig.emissiveIntensity = 1.8;
                    materialConfig.metalness = 0.7;
                    materialConfig.roughness = 0.15;
                    break;
                case 'SANKOPA_CARD':
                    materialConfig.emissiveIntensity = 5.0;
                    materialConfig.metalness = 0.9;
                    materialConfig.roughness = 0;
                    break;
            }

            const material = new THREE.MeshStandardMaterial(materialConfig);
            
            const decoration = new THREE.Mesh(planeGeometry, material);
            decoration.position.z = 0;
            return decoration;
        } catch (error) {
            this.logger.log(`Failed to load decoration texture: ${error}`, {
                conditions: ['error'],
                functionName: 'createDecoration'
            });
            
            // Fallback to detailed plane geometry for wave animation
            const geometry = new THREE.PlaneGeometry(3, 3, 64, 64);
            const material = new THREE.MeshBasicMaterial({
                color: this.options.color,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const decoration = new THREE.Mesh(geometry, material);
            decoration.position.z = 0;
            return decoration;
        }
    }

    async setupScene() {
        if (!this.scene) {
            this.logger.log('Scene not available for setup', {
                conditions: ['error'],
                functionName: 'setupScene'
            });
            return;
        }

        // Initial size setup
        const rect = this.container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        this.renderer.setSize(size, size, false);

        this.logger.log('Setting up dynamics scene', {
            conditions: ['initializing-scene'],
            functionName: 'setupScene'
        });

        try {
            // Сначала создаем текстуру
            this.decorationMesh = await this.createDecoration();
            if (this.decorationMesh) {
                this.decorationMesh.position.z = 0; // Текстура на нулевой плоскости
                this.group.add(this.decorationMesh);
            }

            // Создаем фигуру
            const geometry = this.createGeometry();
            const material = this.createGlowMaterial();
            this.mesh = new THREE.Mesh(geometry, material);
            
            // Позиционируем фигуры внутри текстуры
            switch(this.options.type) {
                case 'GUARDIANS_CARD':
                    this.mesh.scale.set(0.8, 0.8, 1); // Уменьшаем круг
                    this.mesh.position.z = -0.5; // Утапливаем на половину
                    break;
                case 'METAVERSE_CARD':
                    this.mesh.scale.set(0.7, 0.7, 1); // Уменьшаем куб
                    this.mesh.position.z = -0.5; // Утапливаем на половину
                    break;
                case 'SANKOPA_CARD':
                    this.mesh.scale.set(0.8, 0.5, 1); // Уменьшаем прямоугольник
                    this.mesh.position.y = 0.5; // Поднимаем прямоугольник выше
                    this.mesh.position.z = -0.5; // Утапливаем на половину
                    break;
            }
            
            this.group.add(this.mesh);
        } catch (error) {
            this.logger.log(`Failed to create scene elements: ${error}`, {
                conditions: ['error'],
                functionName: 'setupScene'
            });
        }
        
        // Add group to scene
        this.scene.add(this.group);
        
        // Add lights
        this.setupLights();
    }

    createGeometry() {
        switch(this.options.type) {
            case 'GUARDIANS_CARD':
                const radius = 1;
                const segments = 64;
                return new THREE.CircleGeometry(radius, segments);
            case 'METAVERSE_CARD':
                return new THREE.BoxGeometry(1.5, 1.5, 0.5);
            case 'SANKOPA_CARD':
                return new THREE.BoxGeometry(1.8, 1, 0.4);
            default:
                return new THREE.CircleGeometry(1, 64);
        }
    }

    createGlowMaterial() {
        const baseColor = this.options.color;
        const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: baseColor,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.2,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        // Добавляем wireframe для куба и прямоугольника
        if (this.options.type === 'METAVERSE_CARD' || this.options.type === 'SANKOPA_CARD') {
            const edgesMaterial = new THREE.LineBasicMaterial({ 
                color: baseColor,
                transparent: true,
                opacity: 0.7
            });
            
            // Создаем и добавляем wireframe
            const edges = new THREE.EdgesGeometry(this.mesh?.geometry);
            this.wireframe = new THREE.LineSegments(edges, edgesMaterial);
            this.wireframe.position.z = -0.51; // Чуть позади основной фигуры
            this.group.add(this.wireframe);
        }

        return material;
    }

    setupLights() {
        // Основной свет спереди
        const frontLight = new THREE.DirectionalLight(0xffffff, 1);
        frontLight.position.set(0, 0, 5);
        this.scene.add(frontLight);

        // Верхний свет для бликов
        const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
        topLight.position.set(0, 5, 0);
        this.scene.add(topLight);

        // Боковой свет слева
        const leftLight = new THREE.DirectionalLight(0xffffff, 0.5);
        leftLight.position.set(-5, 0, 2);
        this.scene.add(leftLight);

        // Боковой свет справа
        const rightLight = new THREE.DirectionalLight(0xffffff, 0.5);
        rightLight.position.set(5, 0, 2);
        this.scene.add(rightLight);

        // Мягкий рассеянный свет
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
    }

    update() {
        if (!this.group) return;

        const time = performance.now() * 0.001;
        const params = this.animationParams;

        // Texture animation
        if (this.decorationMesh && this.options.textureAnimation) {
            const textureParams = params.texture;

            // Rotation animation
            if (this.options.textureAnimation.rotation) {
                this.decorationMesh.rotation.z = Math.sin(time * textureParams.rotation.speed) * textureParams.rotation.amplitude;
            }

            // Pulse animation
            if (this.options.textureAnimation.pulse) {
                const pulseScale = 1 + Math.sin(time * textureParams.pulse.speed) * textureParams.pulse.amplitude;
                this.decorationMesh.scale.set(pulseScale, pulseScale, 1);
            }

            // Wave animation
            if (this.options.textureAnimation.wave) {
                const vertices = this.decorationMesh.geometry.attributes.position.array;
                const count = vertices.length / 3;
                
                for (let i = 0; i < count; i++) {
                    const x = vertices[i * 3];
                    const y = vertices[i * 3 + 1];
                    const distance = Math.sqrt(x * x + y * y);
                    
                    vertices[i * 3 + 2] = Math.sin(distance * textureParams.wave.frequency - time * textureParams.wave.speed) 
                        * textureParams.wave.amplitude;
                }
                
                this.decorationMesh.geometry.attributes.position.needsUpdate = true;
            }
        }

        // Update wireframe position with main figure
        if (this.wireframe) {
            this.wireframe.rotation.copy(this.mesh.rotation);
            this.wireframe.position.z = this.mesh.position.z - 0.01;
        }

        // Group animation
        this.group.rotation.x = Math.sin(time * params.rotation.x.speed) * params.rotation.x.amplitude;
        this.group.rotation.y = Math.cos(time * params.rotation.y.speed) * params.rotation.y.amplitude;
        this.group.rotation.z = Math.sin(time * params.rotation.z.speed) * params.rotation.z.amplitude;

        // Scale animation with unique parameters
        const scale = 1 + Math.sin(time * params.scale.speed) * params.scale.amplitude;
        this.group.scale.set(scale, scale, scale);

        // Position animation with unique parameters
        this.group.position.y = Math.sin(time * params.position.y.speed) * params.position.y.amplitude;
        
        // Z-position animation with depth limit
        let zPosition = params.position.z.basePosition + 
            Math.sin(time * params.position.z.speed) * params.position.z.amplitude;
        zPosition = Math.min(params.position.z.basePosition, zPosition);
        this.group.position.z = zPosition;

        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    dispose() {
        // Dispose geometries
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        if (this.decorationMesh) {
            this.decorationMesh.geometry.dispose();
            this.decorationMesh.material.dispose();
        }

        // Remove resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Remove from scene
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        // Call parent dispose
        super.dispose();
    }
}