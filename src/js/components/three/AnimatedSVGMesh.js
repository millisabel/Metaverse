import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { ShapeGeometry } from 'three';

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
// this.position.sub(center);

box.setFromObject(this);

const width = box.max.x - box.min.x;
const height = box.max.y - box.min.y;

// Получаем размеры канваса
let canvasWidth = 800;
let canvasHeight = 600;
console.log('this.options', this.options);
console.log('this.options.container', this.options.container);
if (this.options && this.options.container) {
    // Находим canvas внутри контейнера
    const canvas = this.options.container.querySelector('canvas');
    if (canvas) {
        // canvasWidth = canvas.width;
        // canvasHeight = canvas.height;
        // Вместо этого:
        const rect = canvas.getBoundingClientRect();
        canvasWidth = rect.width;
        canvasHeight = rect.height;
    } else {
        // Если canvas не найден, fallback на размеры контейнера
        const rect = this.options.container.getBoundingClientRect();
        canvasWidth = rect.width;
        canvasHeight = rect.height;
    }
}
console.log('[SVG] Canvas size:', canvasWidth, canvasHeight);



// Соотношение сторон
const canvasAspect = canvasWidth / canvasHeight;
const svgAspect = width / height;

// Рассчитываем масштаб так, чтобы SVG вписывался в канвас полностью
let scale;
if (svgAspect > canvasAspect) {
    // SVG шире, вписываем по ширине
    scale = canvasWidth / width;
} else {
    // SVG выше, вписываем по высоте
    scale = canvasHeight / height;
}
this.scale.set(scale, scale, scale);
// this.position.set(-center.x * scale, -center.y * scale, 0);

const boxTest = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
);
this.add(boxTest);
console.log('[SVG] Box test added at', boxTest.position);

// Логируем bounding box и позицию
console.log('[SVG] Bounding box:', box);
console.log('[SVG] Center:', center);
console.log('[SVG] Group position:', this.position);
console.log('[SVG] Group scale:', this.scale);
console.log('[SVG] Normalized scale:', this.scale);
console.log('[SVG] Bounding box min:', box.min);
console.log('[SVG] Bounding box max:', box.max);

console.log('[SVG] Canvas size:', canvasWidth, canvasHeight);
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
            for (let i = 0; i < pos.count; i++) {
                // Пример: пульсация по радиусу
                const x0 = orig[i * 3];
                const y0 = orig[i * 3 + 1];
                const z0 = orig[i * 3 + 2];
                // Радиальное смещение
                const r = Math.sqrt(x0 * x0 + y0 * y0);
                const angle = Math.atan2(y0, x0);
                const pulse = 1 + 0.07 * Math.sin(this.time * 2 + angle * 3 + r * 0.1);
                pos.setXYZ(i, x0 * pulse, y0 * pulse, z0);
            }
            pos.needsUpdate = true;
        });
    }
}
