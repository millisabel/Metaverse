import * as THREE from 'three';
import { ShapeGeometry } from 'three';
import { createNoise2D } from 'simplex-noise';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

/**
 * @class AnimatedSVGMesh
 * @description Class for loading and animating SVG contours in Three.js
 * @extends THREE.Group
 * @param {string} svgUrl - Path to SVG file
 * @param {Object} options - Options (color, animation speed, etc.)
 */
export class AnimatedSVGMesh extends THREE.Group {
    /**
     * @param {string} svgUrl - Path to SVG file
     * @param {Object} options - Options (color, animation speed, etc.)
     * @param {Object} options.opacity - Opacity options: { enabled, base, min, max }
     */
    constructor(svgUrl, options = {}) {
        super();
        this.options = options;
        this.camera = options.camera;
        this.renderer = options.renderer;
        this.container = options.container;
        
        this.meshes = [];
        this.time = 0;

        this._onResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._onResize);
        this._svgLoadedPromise = new Promise(resolve => {
            this._onSVGLoaded = resolve;
        });
        this._loadSVG(svgUrl);
        this.noise2D = createNoise2D();
        // wave параметры
        this.wave = options.wave || {};
        // rotation параметры
        this.rotationOpts = options.rotation || { enabled: false };
        // pulse параметры
        this.pulseOpts = options.pulse || { enabled: false };
        // opacity параметры
        this.opacityOpts = options.opacityPulse || { enabled: false };
        // scaleFactor
        this.baseScale = typeof options.scaleFactor === 'number' ? options.scaleFactor : 1.0;
        // color
        this.color = options.color;
        // position
        this.basePosition = options.position || { x: 0, y: 0, z: 0 };
        this._pulsePhase = 0;
        console.log('this.options:', this.options);
    }

    /**
     * @private
     * @description Handles window resize event
     * @returns {void}
     */
    _handleResize() {
        this.fitToContainer(this.options.mode);
    }

    /**
     * Fits SVG to container, supporting both 3D scene and DOM element modes
     * @param {'scene'|'dom'} mode - Fit mode: 'scene' (3D) or 'dom' (DOM)
     */
    fitToContainer(mode = 'scene') {
        if (!this.meshes.length) return;

        this.position.set(0, 0, 0);
        this.scale.set(1, 1, 1);

        let box = new THREE.Box3().setFromObject(this);
        const width = box.max.x - box.min.x;
        const height = box.max.y - box.min.y;

        if (mode === 'scene') {
            let targetWidth = 800;
            let targetHeight = 600;
            if (this.options && this.options.sceneSize) {
                targetWidth = this.options.sceneSize.width;
                targetHeight = this.options.sceneSize.height;
            } else if (this.options && this.options.container && this.options.container.getBoundingClientRect) {
                const rect = this.options.container.getBoundingClientRect();
                targetWidth = rect.width;
                targetHeight = rect.height;
            }
            const targetAspect = targetWidth / targetHeight;
            const svgAspect = width / height;
            let scale;
            if (svgAspect > targetAspect) {
                scale = targetWidth / width;
            } else {
                scale = targetHeight / height;
            }
            const scaleFactor = (typeof this.options.scaleFactor === 'number') ? this.options.scaleFactor : 1.0;
            scale *= scaleFactor;
            // this.scale.set(scale, scale, scale);
            box = new THREE.Box3().setFromObject(this);
            const dx = (box.max.x + box.min.x) / 2;
            const dy = (box.max.y + box.min.y) / 2;
            const dz = (this.options.position && this.options.position.z) ? this.options.position.z : 0;
            this.position.set(-dx, -dy, dz);

        } else if (mode === 'dom') {
            let domElement = this.options.targetElement;
            if (typeof domElement === 'string') {
                domElement = document.querySelector(domElement);
            }
            if (!this.camera || !this.renderer || !domElement) return;

            // 1. Get DOM element and canvas rects
            const elemRect = domElement.getBoundingClientRect();
            const canvas = this.renderer.domElement;
            const canvasRect = canvas.getBoundingClientRect();

            // 2. Center and size of element relative to canvas
            const elemCenterX = elemRect.left + elemRect.width / 2 - canvasRect.left;
            const elemCenterY = elemRect.top + elemRect.height / 2 - canvasRect.top;
            const elemWidth = elemRect.width;
            const elemHeight = elemRect.height;
            

            // 3. Convert to NDC [-1, 1]
            const ndcX = (elemCenterX / canvasRect.width) * 2 - 1;
            const ndcY = -((elemCenterY / canvasRect.height) * 2 - 1);

            // 4. Ortho camera visible area
            const orthoWidth = this.camera.right - this.camera.left;
            const orthoHeight = this.camera.top - this.camera.bottom;

            // 5. Scene coordinates for center
            const sceneX = this.camera.left + (ndcX + 1) / 2 * orthoWidth;
            const sceneY = this.camera.bottom + (ndcY + 1) / 2 * orthoHeight;

            // 6. Mesh bounding box
            const meshBox = new THREE.Box3().setFromObject(this);
            const meshWidth = meshBox.max.x - meshBox.min.x;
            const meshHeight = meshBox.max.y - meshBox.min.y;

            // 7. Target size in scene units
            const sceneElemWidth = (elemWidth / canvasRect.width) * orthoWidth;
            const sceneElemHeight = (elemHeight / canvasRect.height) * orthoHeight;

            // 8. Scale mesh to fit element (без искажения)
            let scaleFactorX = 1;
            let scaleFactorY = 1;
            if (typeof this.options.scaleFactor === 'object') {
                scaleFactorX = this.options.scaleFactor.x ?? 1;
                scaleFactorY = this.options.scaleFactor.y ?? 1;
            } else if (typeof this.options.scaleFactor === 'number') {
                scaleFactorX = scaleFactorY = this.options.scaleFactor;
            }
            const scaleX = (sceneElemWidth / meshWidth) * scaleFactorX;
            const scaleY = (sceneElemHeight / meshHeight) * scaleFactorY;
            this.scale.set(scaleX, scaleY, 1);

            // 9. Center mesh
            const newBox = new THREE.Box3().setFromObject(this);
            const meshCenterX = (newBox.max.x + newBox.min.x) / 2;
            const meshCenterY = (newBox.max.y + newBox.min.y) / 2;
            const basePos = this.options.position || { x: 0, y: 0, z: 0 };
            this.position.set(
                sceneX - meshCenterX,
                sceneY - meshCenterY,
                basePos.z
            );

            this.baseScaleX = scaleX;
            this.baseScaleY = scaleY;
        }

        // 1. Вычислить bounding box всех мешей (используем ту же переменную)
        box = new THREE.Box3().setFromObject(this);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // 2. Сместить все меши так, чтобы центр оказался в (0,0,0)
        this.meshes.forEach(mesh => {
            mesh.position.sub(center);
        });
    }

    /**
     * Loads SVG and creates Mesh/Line objects
     * @param {string} url
     * @private
     */
    async _loadSVG(url) {
        const loader = new SVGLoader();
        loader.load(
            url,
            data => {
                const paths = data.paths;
                paths.forEach((path, i) => {
                    const shapes = SVGLoader.createShapes(path);
                    shapes.forEach(shape => {
                        const geometry = new ShapeGeometry(shape, 64);
                        let color = this.color || path.color || 0xff00ff;
                        if (typeof color === 'string' && color.startsWith('url(')) {
                            color = 0xff00ff;
                        }
                        const material = new THREE.MeshBasicMaterial({
                            color,
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: this.opacityOpts.enabled ? 1 : this.opacityOpts.base,
                        });
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.userData.originalPositions = geometry.attributes.position.array.slice();
                        this.add(mesh);
                        this.meshes.push(mesh);
                    });
                });

                // === Центрирование SVG по центру группы ===
                const box = new THREE.Box3().setFromObject(this);
                const center = new THREE.Vector3();
                box.getCenter(center);
                this.meshes.forEach(mesh => {
                    mesh.position.sub(center);
                    mesh.renderOrder = this.options.position.z;
                });

                // === Центрирование и масштабирование SVG ===
                this.fitToContainer(this.options.mode);
                this._onSVGLoaded();
            },
            undefined,
            err => {
                console.error('SVG load error:', err);
                this._onSVGLoaded();
            }
        );
    }

    onSVGLoaded() {
        return this._svgLoadedPromise;
    }

    /**
     * Animates contours (e.g., pulsation, opacity)
     * @param {number} delta - Time between frames
     */
    update(delta = 0.016) {
        this.time += delta;
        let pulseScale = 1;
        let pulseOpacity;
        // --- Pulsation (scale) ---
        if (this.pulseOpts.enabled) {
            const min = typeof this.pulseOpts.min === 'number' ? this.pulseOpts.min : 0.9;
            const max = typeof this.pulseOpts.max === 'number' ? this.pulseOpts.max : 1.1;
            const speed = typeof this.pulseOpts.speed === 'number' ? this.pulseOpts.speed : 1.0;
            this._pulsePhase += delta * speed * Math.PI * 2;
            // Сглаженная пульсация
            const rawT = 0.5 * (1 + Math.sin(this._pulsePhase));
            const t = -(Math.cos(Math.PI * rawT) - 1) / 2;
            pulseScale = min + (max - min) * t;
        }
        // --- Opacity ---
        if (this.opacityOpts.enabled) {
            const minO = typeof this.opacityOpts.min === 'number' ? this.opacityOpts.min : 0.5;
            const maxO = typeof this.opacityOpts.max === 'number' ? this.opacityOpts.max : 1.0;
            const t = 0.5 * (1 + Math.sin(this._pulsePhase));
            pulseOpacity = minO + (maxO - minO) * t;
        } else {
            if (typeof this.opacityOpts.base === 'number') {
                pulseOpacity = this.opacityOpts.base;
            } else {
                const minO = typeof this.opacityOpts.min === 'number' ? this.opacityOpts.min : 0.5;
                const maxO = typeof this.opacityOpts.max === 'number' ? this.opacityOpts.max : 1.0;
                pulseOpacity = (minO + maxO) / 2;
            }
        }
        // --- Rotation ---
        if (this.rotationOpts.enabled) {
            let dir = 1;
            if (this.rotationOpts.direction === 'left') dir = -1;
            if (this.rotationOpts.direction === 'right') dir = 1;
            const speed = typeof this.rotationOpts.speed === 'number' ? this.rotationOpts.speed : 0.5;
            this.rotation.z += dir * speed * delta;
        }
        // --- Opacity ---
        this.meshes.forEach(mesh => {
            mesh.material.opacity = pulseOpacity;
        });
        const scaleX = this.baseScaleX * pulseScale;
        const scaleY = this.baseScaleY * pulseScale;
        this.scale.set(scaleX, scaleY, 1);
        // --- Wave (анимация контура) ---
        if (this.wave.enabled) {
        this.meshes.forEach(mesh => {
            const pos = mesh.geometry.attributes.position;
            const orig = mesh.userData.originalPositions;
            const count = pos.count;
            // Wave параметры
            const amp = this.wave.amp !== undefined ? this.wave.amp : 5;
            const waveSpeed = this.wave.waveSpeed !== undefined ? this.wave.waveSpeed : 0.25;
            const smoothRadius = this.wave.smoothRadius !== undefined ? this.wave.smoothRadius : 10;
            const freq = this.wave.freq !== undefined ? this.wave.freq : 1;
            // "Running wave" along the contour
            const offsets = new Array(count);
            for (let i = 0; i < count; i++) {
                const phase = (i / count) * Math.PI * 2 * freq + this.time * waveSpeed;
                const noiseVal = this.noise2D(Math.cos(phase), Math.sin(phase) + this.time * 0.1);
                offsets[i] = noiseVal * amp;
            }
            // Smooth with radius
            const smoothOffsets = new Array(count);
            for (let i = 0; i < count; i++) {
                let sum = 0, n = 0;
                for (let k = -smoothRadius; k <= smoothRadius; k++) {
                    const idx = (i + k + count) % count;
                    sum += offsets[idx];
                    n++;
                }
                smoothOffsets[i] = sum / n;
            }
            // Apply smoothed offsets to the normal
            for (let i = 0; i < count; i++) {
                const x0 = orig[i * 3];
                const y0 = orig[i * 3 + 1];
                const z0 = orig[i * 3 + 2];
                const prev = ((i - 1) + count) % count;
                const next = (i + 1) % count;
                const xPrev = orig[prev * 3];
                const yPrev = orig[prev * 3 + 1];
                const xNext = orig[next * 3];
                const yNext = orig[next * 3 + 1];
                const tx = xNext - xPrev;
                const ty = yNext - yPrev;
                const len = Math.sqrt(tx * tx + ty * ty) || 1;
                const nx = -ty / len;
                const ny = tx / len;
                const offset = smoothOffsets[i];
                pos.setXYZ(i, x0 + nx * offset, y0 + ny * offset, z0);
            }
                pos.needsUpdate = true;
            });
        }
    }
}
