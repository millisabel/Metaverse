import * as THREE from 'three';

import { createLogger } from '../utils/logger';
import { mergeOptionsWithObjectConfig } from '../utils/utils';

import { RendererController } from './RendererController';
import { CameraController } from './CameraController';
import { addLightsToScene } from '../utilsThreeD/lightsUtils';


export class Object_3D_Controller {
    constructor(container, customOptions = {}, defaultOptions = {}) {
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);
        this.logMessage = '';

        this.container = container;
        this.containerZIndex = customOptions.zIndex;

        this.options = mergeOptionsWithObjectConfig(defaultOptions, customOptions.objectConfig);
        this.cameraOptions = customOptions.camera;
        this.lightsOptions = customOptions.lights;

        this.renderer = null;
        this.scene = null;
        this.cameraController = null;
        this.animationFrameId = null;
        this.resizeTimeout = null;
    }

    _logMessage() {
        const message = 
        `----------------------------------------------------------\n` +
        `STATUS:\n` +
        `----------------------------------------------------------\n` +
        `renderer: ${this.renderer}\n` +
        `Scene: ${this.scene}\n` +  
        `cameraController: ${this.cameraController}\n` +
        `animationFrameId: ${this.animationFrameId}\n` +
        `Resize timeout: ${this.resizeTimeout}\n` +
        `isVisible: ${this.isVisible}\n` +
        `isInitialized: ${this.initialized}\n` +
        `isResizing: ${this.isResizing}\n` +
        `isContextLost: ${this.isContextLost}\n` +
        `success\n` + 
        `----------------------------------------------------------\n`;

        return message;
    }

    /**
     * @description Initializes the controller
     * @returns {void}
     */
    async init() {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): init()\n`;

        if (this.container && !this._isElementVisible(this.container)) {
            this.cleanup();
            return;
        }

        this._initDependencies();
        this._initResizeHandler();

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): init() success\n` + 
        `----------------------------------------------------------\n`;
    }
    
    _isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0
        );
    }

    /**
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async initScene() {
        this.logMessage += 
            `${this.constructor.name} (Object_3D_Controller): initScene()\n` + 
            `----------------------------------------------------------\n`;

        if (!this.renderer) {
            this._initDependencies(); 
        }

        this.scene = new THREE.Scene();
        this.cameraController.init(this.container);
        this._setupRenderer();
        this._initWebGLContextHandlers();
        await this.setupScene();
        this.initialized = true;

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): initScene() success\n` + 
        `----------------------------------------------------------\n`;
    }

    /**
     * @description Sets up the scene with objects, lights, etc.
     * @abstract
     * @returns {Promise<void>}
     */
    async setupScene() {
        throw new Error('setupScene() must be implemented in subclass');
    }

    /**
     * @description Animates the scene
     * @returns {void}
     */
    animate() {
        // if (this.animationFrameId) return;
        if (this.animationFrameId && !this.canAnimate()) {
            this.stopAnimation();
            return;
        }

        this.update();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    /**
     * @description Check if animation can proceed
     * @returns {boolean} Whether animation should continue
     */
    canAnimate() {
        if (!this.isVisible) {
            return false;
        }

        if (this.isResizing) {
            return false;
        }

        if (!this.initialized) {
            return false;
        }

        if (!this.scene) {
            return false;
        }

        if (!this.cameraController) {
            return false;
        }

        if (!this.renderer) {
            return false;
        }

        this.logMessage += `${this.constructor.name} Object_3D_Controller: canAnimate() success\n`;

        return true;
    }

    /**
     * @private
     * @description Stops the animation
     * @returns {void}
     */
    stopAnimation() {
        this.logMessage += `${this.constructor.name} Object_3D_Controller: stopAnimation()\n`;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.logMessage += `${this.constructor.name} Object_3D_Controller: this.animationFrameId: ${this.animationFrameId}\n`;
    }

    /**
     * @description Renders the scene
     * @returns {void}
     */
    renderScene() {
        this.logMessage += `${this.constructor.name} Object_3D_Controller: renderScene()\n`;

        if (this.canAnimate()) {
            this.renderer.render(this.scene, this.cameraController.camera);
        }

        this.logMessage += `${this.constructor.name} Object_3D_Controller: renderScene() success\n`;
    }

    /**
     * @description Handles the resize event
     * @returns {void}
     */
    onResize() {
        if (this.cameraController) {
            this.cameraController.onResize(this.container);
        }
        if (this.renderer && this.container) {
            const rect = this.container.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
        }
    }

    /**
     * @description Updates the scene
     * @returns {void}
     */
    update() {
        if (this.cameraController) {
            this.cameraController.update();
        }
        this.renderScene();
    }

    /**
     * @description Cleans up the controller
     * @param {string} [message] - Message to log
     * @returns {void}
     */
    cleanup() {
        this.logMessage +=
            `----------------------------------------------------------\n` + 
            `starting cleanup in Universal3DController\n` +
            `----------------------------------------------------------\n`;

        this.stopAnimation();

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
            RendererController.getInstance().removeRenderer(this.container.id);
            this.renderer = null;
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
        }     

        if (this.cameraController) {
            this.cameraController.cleanup();
            this.cameraController = null;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        this.logMessage += 
            `this.renderer: ${this.renderer}\n` +
            `Scene: ${this.scene}\n` +
            `Universal3DController: this.cameraController: ${this.cameraController}\n` +
            `Resize timeout: ${this.resizeTimeout}\n` +
            `observer: ${this.observer}\n` +
            `Completed cleanup in Universal3DController\n`;

            this.logger.log({
                message: this.logMessage,
                functionName: '(Object_3D_Controller) cleanup()',
                customData: {
                    this: this,
                },
            });
    }
    
    /**
     * @description Sets up lights
     * @param {Object} [options={}] - Options for lights
     * @returns {void}
     */
    setupLights(options = {}) {
        if (!this.scene) return;
        const config = mergeOptionsWithObjectConfig(this.lightsOptions, options);
        this.lights = addLightsToScene(this.scene, config);
    }

    /**
     * @private
     * @description Initializes dependencies
     * @returns {void}
     */
    _initDependencies() {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _initDependencies()\n`;

        this.cameraController = new CameraController(this.cameraOptions);
        this.renderer = RendererController.getInstance().getRenderer(this.container.id, this.options.renderer);

        if (!this.renderer) {
            throw new Error('Renderer not found');
        }

        if (!this.cameraController) {
            throw new Error('Camera controller not found');
        }

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _initDependencies() success\n`;
    }

    /**
     * @private
     * @description Initializes resize handler
     * @returns {void}
     */
    _initResizeHandler() {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _initResizeHandler()\n`;

        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                if (this.isVisible) {
                    this.onResize();
                    setTimeout(() => {
                        if (this.canAnimate()) {
                            this.animate();
                        }
                    }, 200);
                }
            }, 300);
        });

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _initResizeHandler() success\n`;
    }

    /**
     * @private
     * @description Sets up the renderer
     * @returns {void}
     */
    _setupRenderer() {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _setupRenderer()\n`;

        RendererController.getInstance().updateThreeRendererSize(
            this.renderer,
            this.container,
            this.cameraController.camera,
        );
        this.container.appendChild(this.renderer.domElement);
        RendererController.getInstance().createCanvas(this.renderer, {
            zIndex: this.containerZIndex,
            containerName: this.options.containerName,
            canvasName: this.name,
        });

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _setupRenderer() success\n`;
    }

    /**
     * Initializes WebGL context lost/restored handlers via RendererController.
     * @private
     */
    _initWebGLContextHandlers() {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _initWebGLContextHandlers()\n`;

        if (!this.renderer) return;
        RendererController.getInstance()._initWebGLContextHandlers(this.renderer, {
            onLost: this._handleWebGLContextLost.bind(this),
            onRestored: this._handleWebGLContextRestored.bind(this)
        });

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _initWebGLContextHandlers() success\n`;
    }

    /**
     * Handles WebGL context lost event.
     * @param {Event} event
     * @private
     */
    _handleWebGLContextLost(event) {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _handleWebGLContextLost()\n`;

        event.preventDefault();
        this.isContextLost = true;
        this.stopAnimation();
        throw new Error('WebGL context lost! Attempting to recover...');
    }

    /**
     * Handles WebGL context restored event.
     * @param {Event} event
     * @private
     */
    _handleWebGLContextRestored(event) {
        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _handleWebGLContextRestored()\n`;

        this.isContextLost = false;
        this.initScene();
        if (this.isVisible && this.canAnimate()) {
            this.animate();
        }

        this.logMessage += `${this.constructor.name} (Object_3D_Controller): _handleWebGLContextRestored() success\n`;
    }
}

