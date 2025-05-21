import * as THREE from 'three';

import { createLogger } from '../utils/logger';
import { mergeOptionsWithObjectConfig } from '../utils/utils';

import { RendererController } from './RendererController';
import { CameraController } from './CameraController';
import { addLightsToScene } from '../utilsThreeD/lightsUtils';


export class Universal3DController {
    constructor(container, customOptions = {}, defaultOptions = {}) {
        this.name = `${this.constructor.name}`;
        this.logger = createLogger(this.name);

        this.container = container;
        this.containerZIndex = customOptions.zIndex;

        this.options = mergeOptionsWithObjectConfig(defaultOptions, customOptions.objectConfig);
        this.cameraOptions = customOptions.camera;
        this.lightsOptions = customOptions.lights;

        this.cameraController = null;
        this.renderer = null;
        this.animationFrameId = null;
        this.resizeTimeout = null;
    }

    /**
     * @description Initializes the controller
     * @returns {void}
     */
    async init() {
        this.logger.log({
            conditions: ['init'],
            functionName: '(Universal3DController) constructor',
            customData: {
                container: this.container,
                options: this.options,
            }
        });

        this._initDependencies();
        this._initResizeHandler();
    }

    /**
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async initScene() {
        this.logger.log('Initializing scene', {
            conditions: ['init'],
            functionName: 'initScene'
        });

        if (!this.renderer) {
            this._initDependencies(); 
        }

        this.scene = new THREE.Scene();
        this.cameraController.init(this.container);
        this._setupRenderer();

        this._initWebGLContextHandlers();
        await this.setupScene();
        this.isInitialized = true;

        this.logger.log({
            type: 'success',
            conditions: ['scene-initialized'],
            functionName: 'initScene',
            customData: {
                options: this.options,
                renderer: this.renderer,
                scene: this.scene
            }
        });
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
        if (!this.canAnimate()) {
            if (this.animationFrameId) {
                this.stopAnimation();
            }
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
            this.logger.log('Object is hidden',  {
                conditions: ['hidden'],
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }

        if (this.isResizing) {
            this.logger.log('Object is resizing', {
                functionName: 'AnimationController: canAnimate',
                trackType: ['scroll'],
            });
            return false;
        }

        if (!this.isInitialized) {
            this.logger.log('Object is not initialized', {
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }
        
        if (!this.scene || !this.cameraController || !this.renderer) {
            this.logger.log('Scene, camera, or renderer missing', {
                functionName: 'AnimationController: canAnimate'
            });
            return false;
        }

        return true;
    }

    /**
     * @private
     * @description Stops the animation
     * @returns {void}
     */
    stopAnimation() {
        if (this.animationFrameId) {
            const id = this.animationFrameId;
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;

            this.logger.log(`Animation frame ID ${id} is ${this.animationFrameId}`, {
                conditions: ['animation-frame-cleanup'],
                functionName: 'AnimationController: stopAnimation'
            });
        }
    }

    /**
     * @description Renders the scene
     * @returns {void}
     */
    renderScene() {
        if (this.canAnimate()) {
            this.renderer.render(this.scene, this.cameraController.camera);
        }
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
        if (!this.animationFrameId && this.canAnimate()) {
            this.logger.log({conditions: ['running']});
        }

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
    cleanup(message) {
        let logMessage = message || '';

        if (this.renderer) {
            RendererController.getInstance().removeRenderer(this.container.id);
            this.renderer = null;
        }
        logMessage += `Universal3DController: this.renderer: ${this.renderer}\n`; 

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
        logMessage += `Scene: ${this.scene}\n`;       
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        logMessage += `Animation stopped: animationFrameId: ${this.animationFrameId}\n`;

        if (this.cameraController) {
            this.cameraController.cleanup();
            this.cameraController = null;
        }
        logMessage += `Universal3DController: this.cameraController: ${this.cameraController}\n`;

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        logMessage += `Resize timeout: ${this.resizeTimeout}\n`;

        logMessage += `Completed cleanup in Universal3DController\n`;

        this.logger.log({
            message: logMessage,
            conditions: ['cleanup'],
            functionName: 'Universal3DController: cleanup()'
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
        this.logger.log('Initializing dependencies', {
            conditions: ['init'],
            functionName: '_initDependencies'
        });

        this.cameraController = new CameraController(this.cameraOptions);
        this.renderer = RendererController.getInstance().getRenderer(this.container.id, this.options.renderer);
    }

    /**
     * @private
     * @description Initializes resize handler
     * @returns {void}
     */
    _initResizeHandler() {
        this.logger.log('Initializing resize handler', {
            conditions: ['init'],
            functionName: '_initResizeHandler'
        });

        window.addEventListener('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.logger.log({
                    conditions: ['resize-started'],
                    functionName: '_initResizeHandler'
                });
                this.stopAnimation();
            }

            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.isResizing = false;
                this.logger.log({
                    conditions: ['resize-completed'],
                    functionName: '_initResizeHandler'
                });
                if (this.isVisible) {
                    this.onResize();
                    setTimeout(() => {
                        if (!this.isResizing) {
                            this.animate();
                        }
                    }, 200);
                }
            }, 300);
        });
    }

    /**
     * @private
     * @description Sets up the renderer
     * @returns {void}
     */
    _setupRenderer() {
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
    }

    /**
     * Initializes WebGL context lost/restored handlers via RendererController.
     * @private
     */
    _initWebGLContextHandlers() {
        if (!this.renderer) return;
        RendererController.getInstance()._initWebGLContextHandlers(this.renderer, {
            onLost: this._handleWebGLContextLost.bind(this),
            onRestored: this._handleWebGLContextRestored.bind(this)
        });
    }

    /**
     * Handles WebGL context lost event.
     * @param {Event} event
     * @private
     */
    _handleWebGLContextLost(event) {
        event.preventDefault();
        this.isContextLost = true;
        this.stopAnimation();
        this.logger.log('WebGL context lost! Attempting to recover...');
    }

    /**
     * Handles WebGL context restored event.
     * @param {Event} event
     * @private
     */
    _handleWebGLContextRestored(event) {
        this.isContextLost = false;
        this.initScene();
        this.animate();
    }
}

