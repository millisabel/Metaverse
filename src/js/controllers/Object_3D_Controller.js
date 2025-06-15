import * as THREE from 'three';

import { deepMergeOptions,  deepClone } from '../utils/utils';

import { RendererController } from './RendererController';
import { CameraController } from './CameraController';
import { addLightsToScene } from '../utilsThreeD/lightsUtils';


export class Object_3D_Controller {
    constructor(container, customOptions = {}, defaultOptions = {}) {
        this.name = `${this.constructor.name}`;

        this.container = container;
        this.containerZIndex = customOptions.zIndex;

        this.options = deepMergeOptions(defaultOptions, customOptions.objectConfig);
        this.baseOptions = deepClone(this.options);
        this.cameraOptions = customOptions.camera;
        this.lightsOptions = customOptions.lights;

        this.renderer = null;
        this.scene = null;
        this.cameraController = null;
        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.isContextLost = false;
        this._resizeInProgress = false;
        this._currentBreakpoint = null;
    }

    /**
     * @description Initializes the controller
     * @returns {void}
     */
    async init() {
        
        if (this.container && !this._isElementVisible(this.container)) {
            this.cleanup();
            return;
        }
        
        this._applyResponsiveOptions();
        this._initDependencies();
        this._initResizeHandler();
    }

    /**
     * @description Initializes the scene
     * @returns {Promise<void>}
     */
    async initScene() {

        if (!this.renderer) {
            this._initDependencies(); 
        }
        this.scene = new THREE.Scene();
        this.cameraController.init(this.container);

        this._setupRenderer();
        this._initWebGLContextHandlers();
        await this.setupScene();

        this.initialized = true;
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
        if (this.animationFrameId !== null) return;
        if (!this.canAnimate()) return;

        const loop = () => {
            if (!this.canAnimate()) {
                this.stopAnimation();
                return;
            }
            this.update();
            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }

    /**
     * @description Check if animation can proceed
     * @returns {boolean} Whether animation should continue
     */
    canAnimate() {  
        const checks = [
            this.isVisible,
            !this.isResizing,
            !this.isContextLost,
            this.initialized,
            this.scene,
            this.cameraController,
            this.cameraController && this.cameraController.camera,
            this.renderer
        ];
        
        if (!checks.every(Boolean)) {
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
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * @description Handles the resize event
     * @returns {void}
     */
    async onResize() {
        if (this._resizeInProgress) return;
        this._resizeInProgress = true;

        const prevBreakpoint = this._currentBreakpoint;
        const newBreakpoint = this._applyResponsiveOptions();

        if (prevBreakpoint === newBreakpoint) {
            this.stopAnimation();
            if (this.cameraController) {
                this.cameraController.onResize(this.container);
            }
            if (this.renderer && this.container) {
                const rect = this.container.getBoundingClientRect();
                this.renderer.setSize(rect.width, rect.height);
            }
            setTimeout(() => {
                if (this.canAnimate && this.canAnimate()) {
                    this.animate();
                }
                this._resizeInProgress = false;
            }, 100);
            return;
        }

        this._softCleanup();
        await this.initScene(); 

        if (this.cameraController) {
            this.cameraController.onResize(this.container);
        }
        if (this.renderer && this.container) {
            const rect = this.container.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
        }

        if (this.canAnimate && this.canAnimate()) {
            this.animate();
        }

        setTimeout(() => {
            this._resizeInProgress = false;
        }, 100); 
    }

    /**
     * @description Updates the scene
     * @returns {void}
     */
    update() {
        if (this.cameraController) {
            this.cameraController.update();
        }
        this._renderScene();
    }

    /**
     * @description Cleans up the controller
     * @param {string} [message] - Message to log
     * @returns {void}
     */
    cleanup() {
        if (!this.initialized) return;

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
            this.scene = null;
        }

        if (Array.isArray(this.lights)) {
            this.lights.forEach(light => light.dispose());
        } else if (this.lights && typeof this.lights.dispose === 'function') {
            this.lights.dispose();
        }
        this.lights = null;

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
    }
    
    /**
     * @description Sets up lights
     * @param {Object} [options={}] - Options for lights
     * @returns {void}
     */
    setupLights(options = {}) {
        if (!this.scene) return;
        const config = deepMergeOptions(this.lightsOptions, options);
        this.lights = addLightsToScene(this.scene, config);
    }
    
    /**
     * @description Checks if the element is visible
     * @param {Element} element - The element to check
     * @returns {boolean} Whether the element is visible
     */
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
     * @private
     * @description Initializes dependencies
     * @returns {void}
     */
    _initDependencies() {
        this.cameraController = new CameraController(this.cameraOptions);
        this.renderer = RendererController.getInstance().getRenderer(this.container.id, this.options.renderer);

        if (!this.renderer) {
            throw new Error('Renderer not found');
        }

        if (!this.cameraController) {
            throw new Error('Camera controller not found');
        }
    }

    /**
     * @private
     * @description Initializes resize handler
     * @returns {void}
     */
    _initResizeHandler() {
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
    }

    /**
     * @description Renders the scene
     * @returns {void}
     */
    _renderScene() {
        if (this.canAnimate()) {
            this.renderer.render(this.scene, this.cameraController.camera);
        }
    }

    /**
     * @description Applies responsive options to the target object (Mobile First)
     * @returns {number|null} Текущий брейкпоинт или null, если responsive не задан
     */
    _applyResponsiveOptions() {
        Object.assign(this.options, deepClone(this.baseOptions));

        const responsive = this.baseOptions.responsive;
        if (!responsive || typeof responsive !== 'object') {
            this._currentBreakpoint = null;
            return null;
        }

        const breakpoints = Object.keys(responsive)
            .map(Number)
            .filter(n => !isNaN(n) && window.innerWidth >= n)
            .sort((a, b) => a - b);

        let currentBreakpoint = null;
        for (const bp of breakpoints) {
            mergeOptions(this.options, responsive[bp]);
            currentBreakpoint = bp;
        }

        this._currentBreakpoint = currentBreakpoint;
        return currentBreakpoint;
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
        
        console.warn('WebGL context lost! Attempting to recover...');
        
        this.initScene();
        if (this.isVisible && this.canAnimate()) {
            this.animate();
        }
    }

    /**
     * Handles WebGL context restored event.
     * @param {Event} event
     * @private
     */
    _handleWebGLContextRestored() {
        this.isContextLost = false;
        this.initScene();
        if (this.isVisible && this.canAnimate()) {
            this.animate();
        }
    }

    /**
     * @private
     * @description Soft cleans up the controller
     * @returns {void}
     */
    _softCleanup() {
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
    }
}

function mergeOptions(target, source) {
    for (const key in source) {
        if (
            typeof source[key] === 'object' &&
            source[key] !== null &&
            !Array.isArray(source[key])
        ) {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                target[key] = {};
            }
            mergeOptions(target[key], source[key]);
        } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
            for (let i = 0; i < source[key].length; i++) {
                if (
                    typeof source[key][i] === 'object' &&
                    source[key][i] !== null &&
                    typeof target[key][i] === 'object' &&
                    target[key][i] !== null
                ) {
                    mergeOptions(target[key][i], source[key][i]);
                } else {
                    target[key][i] = source[key][i];
                }
            }
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

