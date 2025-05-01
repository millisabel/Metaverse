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
    }

    getAnimationParams() {
        switch(this.options.type) {
            case 'GUARDIANS_CARD':
                return {
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
            // Fallback to basic ring if no decoration provided
            const geometry = new THREE.RingGeometry(1.5, 1.8, 32);
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
        const planeGeometry = new THREE.PlaneGeometry(6, 6);
        
        try {
            const texture = await new Promise((resolve, reject) => {
                loader.load(
                    this.options.decoration,
                    (texture) => resolve(texture),
                    undefined,
                    (error) => reject(error)
                );
            });

            // Настройки материала в зависимости от типа карточки
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

            // Индивидуальные настройки для каждого типа карточки
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
            
            // Fallback to basic ring with increased opacity
            const geometry = new THREE.RingGeometry(1.5, 1.8, 32);
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
                return new THREE.BoxGeometry(1.5, 1.5, 1.5);
            case 'SANKOPA_CARD':
                return new THREE.BoxGeometry(1.8, 1, 1.4);
            default:
                return new THREE.CircleGeometry(1, 64);
        }
    }

    createMaterial() {
        const materialConfig = {
            color: this.options.color,
            emissive: this.options.color,
            emissiveIntensity: 1.0,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        };

        switch(this.options.type) {
            case 'GUARDIANS_CARD':
                materialConfig.emissiveIntensity = 2.0;
                materialConfig.metalness = 0.9;
                materialConfig.roughness = 0;
                break;
            case 'METAVERSE_CARD':
                materialConfig.emissiveIntensity = 3.0;
                materialConfig.metalness = 0.95;
                materialConfig.roughness = 0;
                break;
            case 'SANKOPA_CARD':
                materialConfig.emissiveIntensity = 5.0;
                materialConfig.metalness = 1.0;
                materialConfig.roughness = 0;
                break;
        }

        return new THREE.MeshStandardMaterial(materialConfig);
    }

    createGlowMaterial() {
        return new THREE.MeshStandardMaterial({
            color: this.options.color,
            emissive: this.options.color,
            emissiveIntensity: 2.0,
            metalness: 0.9,
            roughness: 0,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
    }

    setupLights() {
        // Ambient light - увеличили интенсивность
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // Directional light - увеличили интенсивность
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(0, 5, 5);
        this.scene.add(directionalLight);

        // Point light for highlights - увеличили интенсивность
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(0, 0, 5);
        this.scene.add(pointLight);

        // Back light for outline - увеличили интенсивность
        const backLight = new THREE.PointLight(0xffffff, 0.5);
        backLight.position.set(0, 0, -5);
        this.scene.add(backLight);
    }

    update() {
        if (!this.group) return;

        const time = performance.now() * 0.001;
        const params = this.animationParams;

        // Rotation animation with unique parameters
        this.group.rotation.x = Math.sin(time * params.rotation.x.speed) * params.rotation.x.amplitude;
        this.group.rotation.y = Math.cos(time * params.rotation.y.speed) * params.rotation.y.amplitude;
        this.group.rotation.z = Math.sin(time * params.rotation.z.speed) * params.rotation.z.amplitude;

        // Scale animation with unique parameters
        const scale = 1 + Math.sin(time * params.scale.speed) * params.scale.amplitude;
        this.group.scale.set(scale, scale, scale);

        // Position animation with unique parameters
        this.group.position.y = Math.sin(time * params.position.y.speed) * params.position.y.amplitude;
        
        // Z-position animation (отдаление/приближение) с ограничением на приближение
        let zPosition = params.position.z.basePosition + 
            Math.sin(time * params.position.z.speed) * params.position.z.amplitude;
        
        // Ограничиваем приближение до basePosition
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

        // Remove from scene
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        // Call parent dispose
        super.dispose();
    }
}