import * as THREE from 'three';

import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from '../../utils/logger';
import { SingleGlow } from './singleGlow';
import { mergeOptions } from '../../utils/utils';
import { getFinalGlowOptions } from '../../utilsThreeD/glowUtils';
import { getAnimatedRotation, getAnimatedPosition, getAnimatedScale } from '../../utilsThreeD/animationUtils';


const DEFAULT_MATERIAL_CONFIG = {
    patch: null,
    options: {
        map: null,
        emissiveIntensity: 2,
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 1,
        emissive: 0xFFFFFF,
        side: THREE.DoubleSide,
    },
    size: {
        width: 6,
        height: 6,
    },
    zPosition: 0,
};

const DEFAULT_OBJECT_3D_CONFIG = {
    material: {
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    },
    zPosition: -0.5,
};

const GLOW_DYNAMIC_DEFAULTS_OPTIONS = {
    enabled: true,
    color: 0xFFFFFF,
    size: {
        min: 2,
        max: 2
    },
    opacity: {
        min: 0,
        max: 0.05
    },
    scale: {
        min: 2,
        max: 8
    },  
    position: {
        x: 0,
        y: 0,
        z: 0
    },
    movement: {
        enabled: false
    },
    positioning: {
        mode: 'fixed',
    },
    shaderOptions: {
        color: 0xFFFFFF,
        opacity: { min: 0.1, max: 0.4 },
        scale: { min: 2, max: 8 },
    }
};

const DEFAULT_ANIMATION_PARAMS = {
    group: {
        rotation: {
            x: { speed: 0.3, amplitude: 0.5, phase: 0 },
            y: { speed: 0.3, amplitude: 0.5, phase: 0 },
            z: { speed: 0.3, amplitude: 0.5, phase: 0 },
        },
    position: {
        x: { speed: 0.1, amplitude: 0.1, phase: 0 },
        y: { speed: 0.1, amplitude: 0.1, phase: 0 },
        z: { speed: 0.1, amplitude: 10, basePosition: 0, phase: 0 }

    },
    scale: { speed: 0.1, amplitude: 0.02 },
    },
    mesh: {
        rotation: {
            x: { speed: 0.1, amplitude: 0.1, phase: 0 },
            y: { speed: 0.1, amplitude: 0.1, phase: 0 },
            z: { speed: 0.5, amplitude: 1, phase: 0 },
        },
    }
};

const DEFAULT_LIGHTS_CONFIG = {
    ambientIntensity: 0.3,
    pointIntensity: 0.6,
    pointPosition: { x: 2, y: 2, z: 2 },
    directionalEnabled: true,
    directionalIntensity: 1.5,
    directionalPosition: { x: 10, y: 10, z: 10 },
    hemiEnabled: true,
    hemiSkyColor: 0xffffff,
    hemiGroundColor: 0x222233,
    hemiIntensity: 0.5
};

export class Dynamics3D extends AnimationController {
    constructor(container, options = {}) {
        super(container, options);
        
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.mesh = null;
        this.decorationMesh = null;
        this.glowEffect = null;
        this.group = null;
        this.currentScale =  {};

        this.animationParams = mergeOptions(DEFAULT_ANIMATION_PARAMS, this.options.animationParams);

        this.logger.log({
            conditions: ['init'],
            functionName: 'constructor',
            customData: {
                options: this.options
            }
        });
    }

    /**
     * @description Sets up the scene for the dynamics3d component
     * @returns {Promise<void>}
     */
    async setupScene() {
        if (!this.scene) {
            this.logger.log('Scene not available for setup', {
                conditions: ['error'],
                functionName: 'setupScene',
                type: 'error',
            });
            return;
        }

        this.logger.log({
            conditions: ['info'],
            functionName: 'setupScene',
            type: 'info',
            styles: {
                headerBackground: '#af274b',
            },
            customData: {
                options: this.options,
            }
        });
        this.group = new THREE.Group();
        this._setRendererSizeToContainer();

        try {
            this._createGlowEffect();
            await this._createAndAddDecorationMesh();
            this._createAndAddMainMesh();
        } catch (error) {
            this.logger.log(`Failed to create scene elements: ${error}`, {
                conditions: ['error'],
                functionName: 'setupScene'
            });
        }
        
        this.scene.add(this.group);
        this.setupLights(DEFAULT_LIGHTS_CONFIG);
    }

    /**
     * @description Sets the renderer size to the container size
     * @returns {void}
     */
    _setRendererSizeToContainer() {
        const rect = this.container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        this.renderer.setSize(size, size, false);
    }
    
    /**
     * @description Creates and adds the decoration mesh to the group
     * @returns {Promise<void>}
     */
    async _createAndAddDecorationMesh() {
        this.decorationMesh = await this._createDecoration();
        if (this.decorationMesh) {
            this.decorationMesh.position.z = DEFAULT_OBJECT_3D_CONFIG.zPosition;
            if (this.decorationMesh instanceof THREE.Object3D) {
                this.group.add(this.decorationMesh);
            }
        }
    }

    /**
     * @description Creates the decoration mesh
     * @returns {Promise<THREE.Mesh>}
     */
    async _createDecoration() {
        if (!this.options.decoration.patch) {
            return;
        }

        const { material, size } = await this._getDecorationMaterial();

        if (!material || !size) {
            this.logger.log('Failed to get decoration material', {
                type: 'error',
                functionName: 'createDecoration'
            });
            return ;
        }

        const geometry = new THREE.PlaneGeometry(size.width, size.height, 64, 64);
        const decoration = new THREE.Mesh(geometry, material);
        decoration.position.z = 0;
        return decoration; 
    }

    /**
     * @description Gets the decoration material
     * @returns {Promise<{material: THREE.MeshStandardMaterial, size: {width: number, height: number}}>}
     */ 
    async _getDecorationMaterial() {
        let materialConfig = mergeOptions(DEFAULT_MATERIAL_CONFIG.options, this.options.decoration.options);
        delete materialConfig.texture;
        let materialSize = mergeOptions(DEFAULT_MATERIAL_CONFIG.size, this.options.decoration.size);
    
        const loader = new THREE.TextureLoader();
        const texturePath = this.options.decoration.patch;
    
        const texture = await new Promise((resolve, reject) => {
            loader.load(
                texturePath,
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    
        materialConfig.map = texture;
    
        return {
            material: new THREE.MeshStandardMaterial(materialConfig),
            size: materialSize
        };
    }
    
    /**
     * @description Creates and adds the main mesh to the group
     * @returns {void}
     */
    _createAndAddMainMesh() {
        const geometry = this._createGeometry();
        const material = this._createGlowMaterial();

        if (!geometry || !material) {
            this.logger.log('Failed to create main mesh', {
                conditions: ['error'],
                functionName: 'createAndAddMainMesh'
            });
            return ;
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.z = DEFAULT_OBJECT_3D_CONFIG.zPosition;
    
        const meshOptions = this.options.mesh || {};
        this._applyMeshTransform(this.mesh, meshOptions);
    
        if (this.mesh instanceof THREE.Object3D) {
            this.group.add(this.mesh);
        }
    }

    /**
     * @description Creates the main mesh geometry
     * @returns {THREE.Geometry}
     */
    _createGeometry() {
        switch (this.options.mesh.shape) {
            case 'circle':
                return new THREE.CircleGeometry(...this.options.mesh.geometry);
            case 'box':
                return new THREE.BoxGeometry(...this.options.mesh.geometry);
            default:
                return new THREE.CircleGeometry(1, 64);
        }
    }

    _createGlowMaterial() {
        const object3dConfig = mergeOptions(DEFAULT_OBJECT_3D_CONFIG.material, this.options.mesh.material);
        const material = new THREE.MeshStandardMaterial(object3dConfig);

        return material;
    }

    /**
     * @description Applies the mesh transform
     * @param {THREE.Mesh} mesh - The mesh to apply the transform to
     * @param {Object} meshOptions - The mesh options
     * @returns {void}
     */
    _applyMeshTransform(mesh, meshOptions = {}) {
        const scale = meshOptions.scale || { x: 1, y: 1, z: 1 };
        mesh.scale.set(scale.x, scale.y, scale.z);
 
        const position = meshOptions.position || { x: 0, y: 0, z: 0 };
        mesh.position.set(
            position.x ?? 0,
            position.y ?? 0,
            position.z ?? 0
        );
    }

    /**
     * @description Creates the glow effect
     * @returns {void}
     */
    _createGlowEffect() {
        this.logger.log({
            functionName: 'createGlowEffect',
            customData: {
                options: this.options
            }
        });

        if (!this.options.glow && !this.options.glow.enabled) {
            return;
        }
        
        const options = getFinalGlowOptions(
            {}, 
            GLOW_DYNAMIC_DEFAULTS_OPTIONS, 
            this.options.glow.options      
        );

        this.glowEffect = new SingleGlow(
            this.scene,
            this.renderer,
            this.container,
            this.camera,
            options,
        );
        this.glowEffect.setup();

        if (this.glowEffect.mesh) {
            if (this.glowEffect.mesh instanceof THREE.Object3D) {
                this.group.add(this.glowEffect.mesh);
            }
        }
    }

    /**
     * @description Applies the group animation
     * @param {number} t - The time
     * @param {Object} params - The animation parameters
     * @returns {void}
     */
    _applyGroupAnimation(t, params) {
        const rot = getAnimatedRotation(t, params.rotation);
        this.group.rotation.set(rot.x, rot.y, rot.z);
    
        const pos = getAnimatedPosition(t, params.position);
        this.group.position.set(pos.x, pos.y, pos.z);
    
        const scale = getAnimatedScale(t, params.scale);
        this.group.scale.set(scale.x, scale.y, scale.z);

        this.currentScale = {
            rotation: rot,
            position: pos,
            scale: scale
        }
    }

    /**
     * @description Applies the mesh animation
     * @param {number} t - The time
     * @param {Object} params - The animation parameters
     * @returns {void}
     */
    _applyMeshAnimation(t, params) {
        if (!this.mesh || !params || !params.rotation) return;
        const rot = getAnimatedRotation(t, params.rotation);
        this.mesh.rotation.set(rot.x, rot.y, rot.z);
    }

    /**
     * @description Animates the glow effect based on the object's position
     * @param {number} t - The time
     * @returns {void}
     */
    _animateGlowEffect(t) {
        if (this.glowEffect && this.glowEffect.mesh) {
            const z = this.group.position.z;
            const minScale = 1;
            const maxScale = 2;
            const minZ = -10;
            const maxZ = 0;
            const k = (z - minZ) / (maxZ - minZ);
            const scale = minScale + (maxScale - minScale) * k;
                this.glowEffect.mesh.scale.set(scale, scale, scale);
            
            if (this.sectionController && typeof this.sectionController.setGlowScaleForCard === 'function') {
                this.sectionController.setGlowScaleForCard(this.cardIndex, scale);
            }
        }
    }

    /**
     * @description Handles external resize events (calls parent logic and updates renderer size)
     * @returns {void}
     */
    onResize() {
        this.logger.log({ functionName: 'onResize' });
        if (super.onResize) super.onResize();
    }

    /**
     * @description Updates the group animation
     * @returns {void}
     */
    update() {
        if (!this.group) return;

        const t = performance.now() * 0.001;

        this._applyMeshAnimation(t, this.animationParams.mesh);
        this._applyGroupAnimation(t, this.animationParams.group);
        this._animateGlowEffect(t);
        this.renderScene();
    }

    /**
     * @description Cleans up the dynamics3d component
     * @returns {void}
     */
    cleanup() {
        let logMessage = `starting cleanup in ${this.constructor.name}\n`;

        if (this.glowEffect) {
            if (typeof this.glowEffect.dispose === 'function') {
                this.glowEffect.dispose();
            }
            this.glowEffect = null;
            logMessage += `Glow effect disposed\n`;
        }

        if (this.group) {
            this.group.clear();
            if (this.scene) {
                this.scene.remove(this.group);
            }
            this.group = null;
                logMessage += `Group removed from scene\n`;
        }

        this.mesh = null;
        logMessage += `Mesh removed from scene\n`;
        this.decorationMesh = null;
        logMessage += `Decoration mesh removed from scene\n`;

        super.cleanup(logMessage);
    }
}