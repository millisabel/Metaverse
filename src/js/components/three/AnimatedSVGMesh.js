import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { ShapeGeometry } from 'three';
import { createNoise2D } from 'simplex-noise';

/**
 * Class for loading and animating SVG contours in Three.js
 */
export class AnimatedSVGMesh extends THREE.Group {
    /**
     * @param {string} svgUrl - Path to SVG file
     * @param {Object} options - Options (color, animation speed, etc.)
     */
    constructor(svgUrl, options = {}) {
        super();
        this.options = options;
        this.meshes = [];
        this.time = 0;
        this._loadSVG(svgUrl);
        this.opacity = 1;
        this.noise2D = createNoise2D();
        
        this.amp = options.amp !== undefined ? options.amp : 5; 
        this.waveSpeed = options.waveSpeed !== undefined ? options.waveSpeed : 0.25; 
        this.smoothRadius = options.smoothRadius !== undefined ? options.smoothRadius : 10; 
        // If the smoothing radius is too large, all displacements are averaged and the contour hardly moves.
        this.freq = options.freq !== undefined ? options.freq : 1; // count of waves
    }

    /**
     * Loads SVG and creates Mesh/Line objects
     * @param {string} url
     * @private
     */
    _loadSVG(url) {
        const loader = new SVGLoader();
        loader.load(
            url,
            data => {
                const paths = data.paths;
                paths.forEach((path, i) => {
                    const shapes = SVGLoader.createShapes(path);
                    shapes.forEach(shape => {
                        const geometry = new ShapeGeometry(shape, 64);
                        let color = this.options.color || path.color || 0xff00ff;
                        if (typeof color === 'string' && color.startsWith('url(')) {
                            color = 0xff00ff;
                        }
                        const material = new THREE.MeshBasicMaterial({
                            color,
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: this.options.opacity || 1,
                        });
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.userData.originalPositions = geometry.attributes.position.array.slice();
                        this.add(mesh);
                        this.meshes.push(mesh);
                    });
                });

                // === Center SVG group only after loading ===
                const box = new THREE.Box3().setFromObject(this);
                const center = box.getCenter(new THREE.Vector3());
                this.position.sub(center); 

                // Recalculate bounding box after centering
                box.setFromObject(this);
                const width = box.max.x - box.min.x;
                const height = box.max.y - box.min.y;

                // Get canvas size
                let canvasWidth = 800;
                let canvasHeight = 600;
                if (this.options && this.options.container) {
                    const canvas = this.options.container.querySelector('canvas');
                    if (canvas) {
                        const rect = canvas.getBoundingClientRect();
                        canvasWidth = rect.width;
                        canvasHeight = rect.height;
                    } else {
                        const rect = this.options.container.getBoundingClientRect();
                        canvasWidth = rect.width;
                        canvasHeight = rect.height;
                    }
                }

                // Aspect ratio
                const canvasAspect = canvasWidth / canvasHeight;
                const svgAspect = width / height;

                // Calculate scale so that SVG fits completely in canvas
                let scale;
                if (svgAspect > canvasAspect) {
                    scale = canvasWidth / width;
                } else {
                    scale = canvasHeight / height;
                }
                scale *= 0.9; 
                this.scale.set(scale, scale, scale);

                // Recalculate bounding box after scaling
                box.setFromObject(this);

                // Calculate shift so that bounding box is centered in canvas
                const dx = (box.max.x + box.min.x) / 2;
                const dy = (box.max.y + box.min.y) / 2;

                // Shift group so that center of bounding box matches (0,0)
                this.position.x -= dx;
                this.position.y -= dy;
            },
            undefined,
            err => {
                console.error('SVG load error:', err);
            }
        );
    }

    /**
     * Animates contours (e.g., pulsation)
     * @param {number} delta - Time between frames
     */
    update(delta = 0.016) {
        this.time += delta;
        this.meshes.forEach(mesh => {
            const pos = mesh.geometry.attributes.position;
            const orig = mesh.userData.originalPositions;
            const count = pos.count;
    
            // "Running wave" along the contour
            const offsets = new Array(count);
            for (let i = 0; i < count; i++) {
                // Shift phase over time to make wave move along the contour
                const phase = (i / count) * Math.PI * 2 * this.freq + this.time * this.waveSpeed;
                // Use noise for smoothness
                const noiseVal = this.noise2D(Math.cos(phase), Math.sin(phase) + this.time * 0.1);
                offsets[i] = noiseVal * this.amp;
            }
    
            // Smooth with radius set in options
            const smoothOffsets = new Array(count);
            for (let i = 0; i < count; i++) {
                let sum = 0, n = 0;
                for (let k = -this.smoothRadius; k <= this.smoothRadius; k++) {
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
