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

/**
 * Singleton manager for creating, storing, and disposing Three.js renderers.
 * Ensures that each container has only one renderer instance.
 * 
 * @class RendererManager
 */
export class RendererManager {
    constructor() {
        if (RendererManager.instance) {
            throw new Error('Use RendererManager.getInstance() instead of new.');
        }
        this.name = this.constructor.name;
        this.logger = createLogger(this.name);
        this.renderers = new Map();
        RendererManager.instance = this;
    }

    /**
     * Returns the singleton instance of RendererManager.
     * @returns {RendererManager}
     */
    static getInstance() {
        if (!RendererManager.instance) {
            RendererManager.instance = new RendererManager();
        }
        return RendererManager.instance;
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
}
RendererManager.instance = null;