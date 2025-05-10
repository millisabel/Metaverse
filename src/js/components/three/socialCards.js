import * as THREE from 'three';
import { createLogger } from '../../utils/logger';
import { AnimationController } from '../../utilsThreeD/animationController_3D';

/**
 * SocialCard - 3D card for social section
 * @class
 * @extends AnimationController
 */
export class SocialCard extends AnimationController {
    /**
     * @param {HTMLElement} container - DOM element for rendering card
     * @param {Object} options - card parameters (data, size, etc.)
     * @param {Object} options.data - social network data (id, name, texture, color)
     * @param {number} options.cardWidth - card width
     * @param {number} options.cardHeight - card height
     */
    constructor(container, options = {}) {
        super(container, options);
        this.container = container;
        this.options = options;
        this.data = options.data;
        this.isHovered = false;
        this.animationOffset = Math.random() * Math.PI * 2;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.animationFrameId = null;
        this.initialized = false;

        this.logger = createLogger('SocialCard');
        this.name = this.data.name;
        
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.animate = this.animate.bind(this);

        this.amplitude = 0.2;
        this.rotationAmplitude = 0.1;
        this.amplitudeZ = 0.2;
    }

    setupScene() {
      const loader = new THREE.TextureLoader();
      loader.load(this.data.texture, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
  
          const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              opacity: 1,
              side: THREE.FrontSide,
          });

          const geometry = new THREE.PlaneGeometry(2, 3);
          this.mesh = new THREE.Mesh(geometry, material);
          this.scene.add(this.mesh);
          this.setupLight();
  
          this.container.addEventListener('mouseenter', this.handleMouseEnter);
          this.container.addEventListener('mouseleave', this.handleMouseLeave);
          this.container.addEventListener('click', this.handleClick);
  
          this.initialized = true;
          this.name = this.data.name;
          this.logger.log({ conditions: ['init'], message: `SocialCard ${this.data.name} initialized` });
          this.startAnimation();
      });
  }

    setupLight() {
      const ambientLight = new THREE.AmbientLight(0xffffff, 2);
      this.scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
      directionalLight.position.set(1, 1, 1);
      this.scene.add(directionalLight);
      const pointLight = new THREE.PointLight(this.data.color, 10, 300);
      pointLight.position.set(0, 0, 50);
      this.scene.add(pointLight);
    }

    /**
     * Loading texture as Promise
     * @param {string} url
     * @returns {Promise<THREE.Texture>}
     */
    loadTexture(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(url, resolve, undefined, reject);
        });
    }

    /**
     * Start card animation
     */
    startAnimation() {
        if (!this.animationFrameId) {
            this.animate();
        }
    }

    /**
     * Stop card animation
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main animation cycle
     */
    animate() {
      if (!this.container.isConnected || !this.mesh) {
          this.stopAnimation();
          return;
      }
        const time = Date.now() * 0.001;
        const amplitude = this.amplitude; 
        const rotationAmplitude = this.rotationAmplitude;
        const amplitudeZ = this.amplitudeZ;

        if (!this.isHovered) {
            this.mesh.rotation.y = Math.sin(time * 0.5 + this.animationOffset) * rotationAmplitude;
            this.mesh.position.y = Math.sin(time + this.animationOffset) * amplitude;
            this.mesh.position.z = Math.sin(time + this.animationOffset) * amplitudeZ;
        } else {
            this.mesh.rotation.y += (0 - this.mesh.rotation.y) * 0.1;
            this.mesh.position.y += (0 - this.mesh.position.y) * 0.1;
            this.mesh.position.z += (0 - this.mesh.position.z) * 0.1;
        }
        this.renderer.render(this.scene, this.camera);
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    handleResize() {
      if (!this.renderer || !this.camera || !this.mesh) return;
  
      // Get new container sizes
      const rect = this.container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
  
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
  
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
  
      // (Optional) Recreate geometry if needed
      // this.mesh.geometry.dispose();
      // this.mesh.geometry = new THREE.PlaneGeometry(2, 3); // or other sizes
  }

    /**
     * Cleaning up card resources
     */
    dispose() {
        this.stopAnimation();
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material.map) this.mesh.material.map.dispose();
            this.mesh.material.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        // Remove canvas from DOM
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        // Remove event handlers
        this.container.removeEventListener('mouseenter', this.handleMouseEnter);
        this.container.removeEventListener('mouseleave', this.handleMouseLeave);
        this.container.removeEventListener('click', this.handleClick);
        this.logger.log({ conditions: ['dispose'], message: `SocialCard ${this.data.name} disposed` });
    }

    /**
     * Mouseenter handler
     */
    handleMouseEnter() {
        this.isHovered = true;
    }

    /**
     * Mouseleave handler
     */
    handleMouseLeave() {
        this.isHovered = false;
    }

    /**
     * Click handler
     */
    handleClick() {
        // You can add a link transition or other logic
        this.logger.log({ conditions: ['click'], message: `Clicked ${this.data.name}` });
    }
} 
