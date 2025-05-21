import * as THREE from 'three';
import { createLogger } from '../utils/logger';

/**
 * Default options for Three.js WebGLRenderer.
 * @constant
 */
const DEFAULT_RENDERER_OPTIONS = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
  stencil: false,
};

const DEFAULT_CANVAS_OPTIONS = {
  containerName: 'threejs',
  canvasName: '',
};

const DEFAULT_CANVAS_STYLE = {
  position: 'absolute',
  zIndex: '0',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  willChange: 'transform',
  pointerEvents: 'none',
};

/**
 * Singleton manager for creating, storing, and disposing Three.js renderers.
 * Ensures that each container has only one renderer instance.
 * 
 * @class RendererController
 */
export class RendererController {
    constructor() {
        if (RendererController.instance) {
            throw new Error('Use RendererController.getInstance() instead of new.');
        }
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);
      this.renderers = new Map();
      RendererController.instance = this;
    }

    /**
     * Returns the singleton instance of RendererController.
     * @returns {RendererController}
     */
    static getInstance() {
        if (!RendererController.instance) {
            RendererController.instance = new RendererController();
        }
        return RendererController.instance;
    }
  
    /**
     * Returns a renderer for the given containerId, creating it if necessary.
     * Applies default options, overridden by user options.
     * @param {string} containerId - Unique identifier for the container.
     * @param {Object} [options={}] - Renderer options to override defaults.
     * @returns {THREE.WebGLRenderer} Renderer instance.
     */
    getRenderer(containerId, options = {}) {
      if (this.renderers.has(containerId)) {
        return this.renderers.get(containerId);
      }

      const renderer = new THREE.WebGLRenderer({
        ...DEFAULT_RENDERER_OPTIONS,
        ...options
    });
    
      this.renderers.set(containerId, renderer);

      this.logger.log({
        conditions: ['renderer-created'],
        functionName: 'getRenderer',
        customData: {
          containerId: containerId,
          rendererOptions: { ...DEFAULT_RENDERER_OPTIONS, ...options }
        }
      });  

      return renderer; 
    }
  
    /**
     * Removes and disposes the renderer for the given containerId.
     * @param {string} containerId - Unique identifier for the container.
     */
    removeRenderer(containerId) {
      const renderer = this.renderers.get(containerId);
      if (renderer) {
        renderer.dispose();
        this.renderers.delete(containerId);

        this.logger.log('Renderer removed', {
          conditions: ['renderer-remove'],
          functionName: 'removeRenderer',
          customData: { containerId }
        });
      }
    }

    /**
     * Updates the size of the renderer and the camera.
     * @param {THREE.WebGLRenderer} renderer - The renderer to update.
     * @param {HTMLElement} container - The container to update.
     * @param {THREE.Camera} camera - The camera to update.
     * @param {Object} [options={}] - The options to update.
     */
    updateThreeRendererSize(renderer, container, camera, options = {}) {
      const { clearColor = null, composer = null } = options;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(pixelRatio);
      
      if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
      }
  
      if (clearColor !== null) {
        renderer.setClearColor(clearColor.color, clearColor.alpha);
      } else {
        renderer.setClearColor(0x000000, 0);
      }
  
      if (composer) {
          composer.setSize(width, height);
      }
    }

    /**
     * Creates a canvas element for the given renderer.
     * @param {THREE.WebGLRenderer} renderer - The renderer to create the canvas for.
     * @param {Object} [options={}] - The options to create the canvas with.
     * @returns {HTMLCanvasElement} The created canvas element.
     */
    createCanvas(renderer, options = {}) {
      const { 
        zIndex = '0', 
        containerName = 'threejs',
        canvasName = '',  
        ...restOptions
      } = options;

      const canvas = renderer.domElement;

      Object.assign(canvas.style, DEFAULT_CANVAS_STYLE);

      if (canvasName) {
          canvas.dataset.canvasName = canvasName;
      }
      if (containerName) {
          canvas.dataset.containerName = containerName;
      }
      if (zIndex) {
          canvas.style.zIndex = zIndex;
      }

      Object.entries(restOptions).forEach(([key, value]) => {
        console.log('key', key);
        console.log('value', value);
        if (key.startsWith('data-')) {
          canvas.setAttribute(key, value);
        } else if (key in canvas.style) {
          canvas.style[key] = value;
        }
      });

      canvas.classList.add(DEFAULT_CANVAS_OPTIONS.containerName);
      
      return canvas;
    }

    /**
     * Disposes the renderer and its resources.
     * @param {THREE.WebGLRenderer} renderer - The renderer to dispose.
     * @param {THREE.Scene} scene - The scene to dispose.
     */
    cleanupResources(renderer, scene) {
      if (renderer) {
          renderer.dispose();
          renderer.domElement.remove();
      }
  
      if (scene) {
          scene.traverse((object) => {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                  if (Array.isArray(object.material)) {
                      object.material.forEach(material => material.dispose());
                  } else {
                      object.material.dispose();
                  }
              }
          });
      }
    }

    /**
     * Finds all dead canvas elements in the DOM.
     * @param {string} [selector='.threejs-canvas, canvas[data-container-name]'] - The selector to find dead canvas elements.
     * @returns {HTMLCanvasElement[]} An array of dead canvas elements.
     */
    findDeadCanvas(selector = '.threejs-canvas, canvas[data-container-name]') {
        return Array.from(document.querySelectorAll(selector));
    }

    /**
     * Asserts that no dead canvas elements are found in the DOM.
     * @param {string} [selector='.threejs-canvas, canvas[data-container-name]'] - The selector to find dead canvas elements.
     */
    assertNoDeadCanvas(selector) {
        const deadCanvas = this.findDeadCanvas(selector);
        if (deadCanvas.length > 0) {
            console.warn(`⚠️ Found ${deadCanvas.length} dead canvas in DOM:`, deadCanvas);
        } else {
            console.info('✅ No dead canvas in DOM');
        }
    }
  
    /**
     * Resizes all managed renderers to the given width and height.
     * @param {number} width - New width.
     * @param {number} height - New height.
     */
    resizeAll(width, height) {
      this.renderers.forEach(renderer => {
        renderer.setSize(width, height);
      });

      this.logger.log({
        conditions: ['resize-all'],
        functionName: 'resizeAll',
        customData: { width, height }
      });
    }

    /**
     * Disposes all managed renderers and clears the registry.
     */
    disposeAll() {
      this.renderers.forEach(renderer => renderer.dispose());
      this.renderers.clear();

      this.logger.log({
        conditions: ['dispose-all'],
        functionName: 'disposeAll'
      });
    }

    /**
     * Adds WebGL context lost/restored event handlers to the renderer's canvas.
     * @param {THREE.WebGLRenderer} renderer - The renderer whose canvas to observe.
     * @param {Object} [handlers={}] - Handlers for context lost/restored.
     * @param {Function} [handlers.onLost] - Callback for 'webglcontextlost'.
     * @param {Function} [handlers.onRestored] - Callback for 'webglcontextrestored'.
     */
    _initWebGLContextHandlers(renderer, handlers = {}) {
      if (!renderer || !renderer.domElement) return;
      const canvas = renderer.domElement;
      const { onLost, onRestored } = handlers;

      if (!canvas._webglHandlers) canvas._webglHandlers = {};

      const handleLost = (event) => {
        event.preventDefault();
        if (typeof onLost === 'function') onLost(event);
        this.logger.log({
          conditions: ['webglcontextlost'],
          functionName: '_initWebGLContextHandlers',
          customData: { canvas }
        });
      };

      const handleRestored = (event) => {
        if (typeof onRestored === 'function') onRestored(event);
        this.logger.log({
          conditions: ['webglcontextrestored'],
          functionName: '_initWebGLContextHandlers',
          customData: { canvas }
        });
      };
      canvas.addEventListener('webglcontextlost', handleLost, false);
      canvas.addEventListener('webglcontextrestored', handleRestored, false);
      canvas._webglHandlers.lost = handleLost;
      canvas._webglHandlers.restored = handleRestored;
    }
}
RendererController.instance = null;