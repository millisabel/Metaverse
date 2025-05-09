import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { ShapeGeometry } from 'three';
import { createNoise2D } from 'simplex-noise';

/**
 * Класс для загрузки и анимации SVG-контуров в Three.js
 */
export class AnimatedSVGMesh extends THREE.Group {
    /**
     * @param {string} svgUrl - Путь к SVG-файлу
     * @param {Object} options - Опции (цвет, скорость анимации и т.д.)
     */
    constructor(svgUrl, options = {}) {
        super();
        this.options = options;
        this.meshes = [];
        this.time = 0;
        this._loadSVG(svgUrl);
        this.opacity = 1;
        this.noise2D = createNoise2D();
    }

    /**
     * Загружает SVG и создает Mesh/Line объекты
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
                console.log('meshes after load:', this.meshes);

                // === Центрируем SVG-группу только после загрузки ===
                const box = new THREE.Box3().setFromObject(this);
                const center = box.getCenter(new THREE.Vector3());
                this.position.sub(center); // Центрируем SVG в (0,0,0)

                // Пересчитываем bounding box после центрирования
                box.setFromObject(this);
                const width = box.max.x - box.min.x;
                const height = box.max.y - box.min.y;

                // Получаем размеры канваса
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
                console.log('[SVG] Canvas size:', canvasWidth, canvasHeight);

                // Соотношение сторон
                const canvasAspect = canvasWidth / canvasHeight;
                const svgAspect = width / height;

                // Рассчитываем масштаб так, чтобы SVG вписывался в canvas полностью
                let scale;
                if (svgAspect > canvasAspect) {
                    // SVG шире, вписываем по ширине
                    scale = canvasWidth / width;
                } else {
                    // SVG выше, вписываем по высоте
                    scale = canvasHeight / height;
                }
                scale *= 0.9; // Уменьшаем SVG на 10%
                this.scale.set(scale, scale, scale);

                // Пересчитываем bounding box после масштабирования
                box.setFromObject(this);

                // Вычисляем сдвиг, чтобы bounding box был по центру canvas
                const dx = (box.max.x + box.min.x) / 2;
                const dy = (box.max.y + box.min.y) / 2;

                // Сдвигаем группу так, чтобы центр bounding box совпал с (0,0)
                this.position.x -= dx;
                this.position.y -= dy;

                // Логируем bounding box и позицию
                console.log('[SVG] Bounding box:', box);
                console.log('[SVG] Center:', center);
                console.log('[SVG] Group position:', this.position);
                console.log('[SVG] Group scale:', this.scale);
                console.log('[SVG] SVG size:', width, height);
                console.log('[SVG] Final scale:', this.scale);
            },
            undefined,
            err => {
                console.error('SVG load error:', err);
            }
        );
    }

    /**
     * Анимирует контуры (например, пульсация)
     * @param {number} delta - Время между кадрами
     */
    update(delta = 0.016) {
        this.time += delta;
        this.meshes.forEach(mesh => {
            const pos = mesh.geometry.attributes.position;
            const orig = mesh.userData.originalPositions;
            const count = pos.count;
    
            // "Бегущая волна" по всему контуру
            const offsets = new Array(count);
            const waveSpeed = 0.25; // скорость движения волны
            const amp = 5; // амплитуда
            for (let i = 0; i < count; i++) {
                // Смещаем фазу по времени, чтобы волна бежала по контуру
                const phase = (i / count) * Math.PI * 2 + this.time * waveSpeed;
                // Используем шум для плавности
                const noiseVal = this.noise2D(Math.cos(phase), Math.sin(phase) + this.time * 0.1);
                offsets[i] = noiseVal * amp;
            }
    
            // Сглаживаем с большим радиусом (например, 8 соседей)
            const smoothOffsets = new Array(count);
            const smoothRadius = 8;
            for (let i = 0; i < count; i++) {
                let sum = 0, n = 0;
                for (let k = -smoothRadius; k <= smoothRadius; k++) {
                    const idx = (i + k + count) % count;
                    sum += offsets[idx];
                    n++;
                }
                smoothOffsets[i] = sum / n;
            }
    
            // Применяем сглаженные смещения по нормали
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
