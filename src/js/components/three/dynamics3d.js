import * as THREE from 'three';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { createLogger } from '../../utils/logger';
import { deepMergeOptions } from '../../utils/utils';


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

export class Dynamics3D extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options);
        
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.mesh = null;
        this.decorationMesh = null;
        this.glowEffect = null;
        this.group = null;
        this.currentPosition =  {};

        this.animationParams = deepMergeOptions(DEFAULT_ANIMATION_PARAMS, this.options.animationParams);
    }

    /**
     * @description Sets up the scene for the dynamics3d component
     * @returns {Promise<void>}
     */
    async setupScene() {
        this.group = new THREE.Group();

        this._createMesh();
        await this._createAndAddDecorationMesh();
        
        if (this.scene) {
            this.scene.add(this.group);
        }
        this.setupLights(DEFAULT_LIGHTS_CONFIG);
    }

    /**
     * @description Handles external resize events (calls parent logic and updates renderer size)
     * @returns {void}
     */
    onResize() {
        super.onResize();
    }

    /**
     * @description Updates the group animation
     * @returns {void}
     */
    update() {
        if (!this.group) return;

        const t = performance.now() * 0.001;

        this._meshAnimation(t);
        this._applyGroupAnimation(t);

        super.update();
    }

    /**
     * @description Cleans up the dynamics3d component
     * @returns {void}
     */
    cleanup() {
        this.logMessage += `${this.constructor.name} starting cleanup\n`;

        if (this.decorationMesh) {
            if (this.decorationMesh.material) {
                if (this.decorationMesh.material.map) {
                    this.decorationMesh.material.map.dispose();
                }
                this.decorationMesh.material.dispose();
            }
            if (this.decorationMesh.geometry) {
                this.decorationMesh.geometry.dispose();
            }
        }

        if (this.mesh) {
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
        }

        if (this.group) {
            this.group.clear();
            if (this.scene) {
                this.scene.remove(this.group);
            }
        }

        this.mesh = null;
        this.decorationMesh = null;
        this.group = null;

        super.cleanup();

        this.logMessage += `${this.constructor.name} cleanup completed\n`;
    }
    
    /**
     * @description Creates and adds the main mesh to the group
     * @returns {void}
     */
    _createMesh() {
        const geometry = this._createGeometry();
        const material = this._createGlowMaterial();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.z = DEFAULT_OBJECT_3D_CONFIG.zPosition;
    
        const meshOptions = this.options.mesh || {};
        this._applyMeshTransform(meshOptions);
    
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
                return new THREE.CircleGeometry(1, 16);
        }
    }

    /**
     * @description Creates the glow material
     * @returns {THREE.Material}
     */
    _createGlowMaterial() {
        const object3dConfig = deepMergeOptions(DEFAULT_OBJECT_3D_CONFIG.material, this.options.mesh.material);
        const material = new THREE.MeshStandardMaterial(object3dConfig);

        return material;
    }

    /**
     * @description Applies the mesh transform
     * @param {THREE.Mesh} mesh - The mesh to apply the transform to
     * @param {Object} meshOptions - The mesh options
     * @returns {void}
     */
    _applyMeshTransform(meshOptions = {}) {
        const scale = meshOptions.scale || { x: 1, y: 1, z: 1 };
        this.mesh.scale.set(scale.x, scale.y, scale.z);
 
        const position = meshOptions.position || { x: 0, y: 0, z: 0 };
        this.mesh.position.set(
            position.x ?? 0,
            position.y ?? 0,
            position.z ?? 0
        );
    }

    // DECORATION

    /**
     * @description Creates and adds the decoration mesh to the group
     * @returns {Promise<void>}
     */
    async _createAndAddDecorationMesh() {
        this.decorationMesh = await this._createDecoration();

        if (this.decorationMesh && this.group) {
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
        let materialConfig = deepMergeOptions(DEFAULT_MATERIAL_CONFIG.options, this.options.decoration.options);
        delete materialConfig.texture;
        let materialSize = deepMergeOptions(DEFAULT_MATERIAL_CONFIG.size, this.options.decoration.size);
    
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

    // ANIMATION

    /**
     * @description Applies the mesh animation
     * @param {number} t - The time
     * @param {Object} params - The animation parameters
     * @returns {void}
     */
    _meshAnimation(t) {
        if (!this.mesh) return;

        const params = this.animationParams.mesh;

        const rot = this._getAnimatedRotation(t, params.rotation);
        this.mesh.rotation.set(rot.x, rot.y, rot.z);
    }

    /**
     * @description Applies the group animation
     * @param {number} t - The time
     * @param {Object} params - The animation parameters
     * @returns {void}
     */
    _applyGroupAnimation(t) {
        const params = this.animationParams.group;

        const rot = this._getAnimatedRotation(t, params.rotation);
        this.group.rotation.set(rot.x, rot.y, rot.z);
    
        const pos = this._getAnimatedPosition(t, params.position);
        this.group.position.set(pos.x, pos.y, pos.z);
    
        const scale = this._getAnimatedScale(t, params.scale);
        this.group.scale.set(scale.x, scale.y, scale.z);

        this.currentPosition = {
            rotation: rot,
            position: pos,
            scale: scale
        }
    }

    /**
     * @description Gets the animated rotation
     * @param {number} t - The time
     * @param {Object} rotationParams - The rotation parameters
     * @returns {Object} The animated rotation
     */
    _getAnimatedRotation(t, rotationParams) {
        return {
            x: Math.sin(t * rotationParams.x.speed + (rotationParams.x.phase || 0)) * (rotationParams.x.amplitude || 0),
            y: Math.cos(t * rotationParams.y.speed + (rotationParams.y.phase || 0)) * (rotationParams.y.amplitude || 0),
            z: Math.sin(t * rotationParams.z.speed + (rotationParams.z.phase || 0)) * (rotationParams.z.amplitude || 0),
        };
    }

    /**
     * @description Gets the animated position
     * @param {number} t - The time
     * @param {Object} positionParams - The position parameters
     * @returns {Object} The animated position
     */
    _getAnimatedPosition(t, positionParams) {
        return {
            x: Math.sin(t * positionParams.x.speed + (positionParams.x.phase || 0)) * (positionParams.x.amplitude || 0),
            y: Math.sin(t * positionParams.y.speed + (positionParams.y.phase || 0)) * (positionParams.y.amplitude || 0),
            z: positionParams.z.basePosition - Math.abs(Math.sin(t * positionParams.z.speed + (positionParams.z.phase || 0)) * (positionParams.z.amplitude || 0)),
        };
    }

    /**
     * @description Gets the animated scale
     * @param {number} t - The time
     * @param {Object} scaleParams - The scale parameters
     * @returns {Object} The animated scale
     */
    _getAnimatedScale(t, scaleParams) {
        const scale = 1 + Math.sin(t * scaleParams.speed) * (scaleParams.amplitude || 0);
        return { x: scale, y: scale, z: scale };
    }
}