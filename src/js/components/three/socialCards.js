import * as THREE from 'three';
import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';

const defaultOptions = {
    type: null,
    texture: null,
    color: 0xFFFFFF,
    opacity: 1,
    amplitude: 0.1,
    rotationAmplitude: 0.2,
    amplitudeZ: 0.1,
    size: {
        width: 2,
        height: 3,
    },
};

const defaultLights = {
    ambient: {
        enabled: true,
        color: 0xffffff,
        intensity: 5,
    },
    directional: {
        enabled: false,
        color: 0xffffff,
        intensity: 1,
        direction: { x: 1, y: 1, z: 1 },
        position: { x: 2, y: 4, z: 2 },
    },
    point: {
        enabled: false,
        color: 0xffffff,
        intensity: 3,
        position: { x: 0, y: 0, z: 5 }
    }
};

/**
 * SocialCard - 3D card for social section
 * @class
 * @extends AnimationController
 */
export class SocialCard extends Object_3D_Observer_Controller {
    /**
     * @param {HTMLElement} container - DOM element for rendering card
     * @param {Object} options - card parameters (data, size, etc.)
     * @param {Object} options.data - social network data (id, name, texture, color)
     * @param {number} options.cardWidth - card width
     * @param {number} options.cardHeight - card height
     */
    constructor(container, options = {}) {
        super(container, options, defaultOptions);

        this.isHovered = false;
        this.animationOffset = Math.random() * Math.PI * 2;
        
        this._handleMouseEnter = this._handleMouseEnter.bind(this);
        this._handleMouseLeave = this._handleMouseLeave.bind(this);
    }

    async setupScene() {
        await this._createMeshWithTexture();
        this.setupLights(defaultLights);

        this.container.addEventListener('mouseenter', this._handleMouseEnter);
        this.container.addEventListener('mouseleave', this._handleMouseLeave);
        this.container.addEventListener('click', this._handleClick);
    }

    /**
     * @description Handles the resize event
     * @returns {void}
     */
    onResize() {
        if (!this.mesh || !this.container || !this.cameraController) return;

        const rect = this.container.getBoundingClientRect();
        const canvas = this.renderer.domElement;
        const canvasRect = canvas.getBoundingClientRect();

        if (
            rect.width < 10 || rect.height < 10 ||
            canvasRect.width < 10 || canvasRect.height < 10
        ) {
            return;
        }

        const camera = this.cameraController.camera;
        if (!camera.isPerspectiveCamera) return;

        const cameraZ = camera.position.z;
        const meshZ = this.mesh.position.z;
        const distance = Math.abs(cameraZ - meshZ);

        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
        const visibleWidth = visibleHeight * camera.aspect;

        const widthRatio = rect.width / canvasRect.width;
        const heightRatio = rect.height / canvasRect.height;

        const aspect = this.options.size.width / this.options.size.height || 1;

        let meshWidth = visibleWidth * widthRatio;
        let meshHeight = meshWidth / aspect;

        if (!isFinite(meshHeight) || meshHeight <= 0) {
            meshHeight = visibleHeight * heightRatio;
            meshWidth = meshHeight * aspect;
        }

        const maxWidth = defaultOptions.size.width;
        const maxHeight = defaultOptions.size.height;
        const widthScale = meshWidth > maxWidth ? maxWidth / meshWidth : 1;
        const heightScale = meshHeight > maxHeight ? maxHeight / meshHeight : 1;
        const scale = Math.min(widthScale, heightScale);

        if (scale < 1) {
            meshWidth *= scale;
            meshHeight *= scale;
        }

        if (!isFinite(meshWidth) || !isFinite(meshHeight) || meshWidth <= 0 || meshHeight <= 0) {
            console.warn('Invalid mesh size:', meshWidth, meshHeight);
            return;
        }

        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.PlaneGeometry(meshWidth, meshHeight);

        this.options.size.width = meshWidth;
        this.options.size.height = meshHeight;

        super.onResize();
    }

    /**
     * Main animation cycle
     */
    update() {
        const time = Date.now() * 0.001;
        const amplitude = this.options.amplitude; 
        const rotationAmplitude = this.options.rotationAmplitude;
        const amplitudeZ = this.options.amplitudeZ;

        if (!this.isHovered) {
            this.mesh.rotation.y = Math.sin(time * 0.5 + this.animationOffset) * rotationAmplitude;
            this.mesh.position.y = Math.sin(time + this.animationOffset) * amplitude;
            this.mesh.position.z = Math.sin(time + this.animationOffset) * amplitudeZ;
        } else {
            this.mesh.rotation.y += (0 - this.mesh.rotation.y) * 0.1;
            this.mesh.position.y += (0 - this.mesh.position.y) * 0.1;
            this.mesh.position.z += (0 - this.mesh.position.z) * 0.1;
        }
        super.update();
    }

    /**
     * Cleaning up card resources
     */
    cleanup() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material.map) this.mesh.material.map.dispose();
            this.mesh.material.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        this.container.removeEventListener('mouseenter', this._handleMouseEnter);
        this.container.removeEventListener('mouseleave', this._handleMouseLeave);
        this.container.removeEventListener('click', this._handleClick);
        super.cleanup();
    }

    /**
     * @private
     * @description Loads texture and creates mesh for the social card
     * @returns {void}
     */
    async _createMeshWithTexture() {
        const texture = await this._loadTextureAsync(this.options.texture);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            opacity: this.options.opacity,
            side: THREE.FrontSide,
        });

        const geometry = new THREE.PlaneGeometry(this.options.size.width, this.options.size.height);
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    /**
     * @private
     * @description Loads a texture asynchronously
     * @param {string} url
     * @returns {Promise<THREE.Texture>}
     */
    _loadTextureAsync(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(url, resolve, undefined, reject);
        });
    }


    /**
     * Mouseenter handler
     */
    _handleMouseEnter() {
        this.isHovered = true;
    }

    /**
     * Mouseleave handler
     */
    _handleMouseLeave() {
        this.isHovered = false;
    }
} 
