import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from '../../utils/logger';
import { lerpVec3, projectToBack } from '../../utilsThreeD/utilsThreeD';

export class ExploreScene extends AnimationController {
    /**
     * @param {HTMLElement} container - DOM-element for rendering
     * @param {Object} options - Options for configuring the grid
     * @param {number} [options.gridWidth=4] - Number of cells in width
     * @param {number} [options.gridHeight=6] - Number of cells in height
     * @param {number} [options.gridDepth=8] - Number of cells in depth
     * @param {number} [options.cellSize=3] - Size of one cell
     * @param {number} [options.lineWidth=1.5] - Thickness of normal lines
     * @param {number} [options.borderLineWidth=3] - Thickness of tunnel borders
     * @param {number} [options.shrinkK=1/3] - Perspective shrink factor (0..1)
     * @param {number} [options.cellSizeBack=1] - Size of cell on the back face
     * @param {number} [options.tunnelRotation=-Math.PI/8] - Tunnel rotation angle
     * @param {Array} [options.tunnelPosition=[-width/2, -height/2, -45]] - Tunnel position
     * @param {number} [options.rightWallColor=0x0B061B] - Color of solid (right) side
     */
    constructor(container, options = {}) {
        super(container, options);
        this.logger = createLogger('ExploreScene');
        this.logger.log('ExploreScene constructor', { options });
        this.gridWidth = options.gridWidth || 4;
        this.gridHeight = options.gridHeight || 6;
        this.gridDepth = options.gridDepth || 8;
        this.cellSize = options.cellSize || 3;
        this.lineWidth = options.lineWidth || 2;
        this.borderLineWidth = options.borderLineWidth || 3;
        this.shrinkK = options.shrinkK || (1 / 3);
        this.cellSizeBack = options.cellSizeBack || 1;
        this.tunnelRotation = options.tunnelRotation !== undefined ? options.tunnelRotation : -Math.PI / 8;
        this.tunnelPosition = options.tunnelPosition || null; 
        this.rightWallColor = options.rightWallColor !== undefined ? options.rightWallColor : 0x000000;
        this.gridGroup = null;
    }

    /**
     * Генерирует 3D-сетку тоннеля и добавляет в сцену
     */
    setupScene() {
        this.logger.log('setupScene called');
        this.gridGroup = new THREE.Group();

        // Цвета для сетки и рамки
        const GRID_COLOR = 0x8F70FF; // основной фиолетовый для линий
        const BORDER_COLOR = 0x7F5CFF; // насыщенный фиолетовый для рамки
        const RIGHT_WALL_COLOR = this.rightWallColor;

        // Параметры сетки
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;

        // --- Перспективное сжатие ячеек ---
        // projectToBack теперь из утилов

        // Вспомогательная функция для добавления линии с перспективой и цветом
        const addLinePerspective = (start, end, isBorder = false, colorOverride = null) => {
            const s = [...start];
            const e = [...end];
            if (s[2] === -depth) {
                const [x, y] = projectToBack(s[0], s[1], x_c, y_c, shrinkK);
                s[0] = x; s[1] = y;
            }
            if (e[2] === -depth) {
                const [x, y] = projectToBack(e[0], e[1], x_c, y_c, shrinkK);
                e[0] = x; e[1] = y;
            }
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...s),
                new THREE.Vector3(...e)
            ]);
            const material = new THREE.LineBasicMaterial({
                color: colorOverride || (isBorder ? BORDER_COLOR : GRID_COLOR),
                linewidth: isBorder ? this.borderLineWidth : this.lineWidth,
                transparent: false,
                opacity: 1
            });
            const line = new THREE.Line(geometry, material);
            this.gridGroup.add(line);
        };

        // === Генерация линий сетки ===
        // Углы пола
        const frontLeft = [0, 0, 0];
        const frontRight = [width, 0, 0];
        const backLeft = [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth];
        const backRight = [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth];

        // Горизонтальные линии
        for (let x = 0; x <= this.gridWidth; x++) {
            let t = x / this.gridWidth;
            let start = lerpVec3(frontLeft, frontRight, t);
            let end = lerpVec3(backLeft, backRight, t);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: GRID_COLOR,
                    transparent: false,
                    opacity: 1
                });
                const s = lerpVec3(start, end, z / this.gridDepth);
                const e = lerpVec3(start, end, (z + 1) / this.gridDepth);
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...s),
                    new THREE.Vector3(...e)
                ]);
                const line = new THREE.Line(geometry, material);
                this.gridGroup.add(line);
            }
        }

        // Вертикальные линии пола (по z)
        for (let z = 0; z <= this.gridDepth; z++) {
            let t = z / this.gridDepth;
            let left = lerpVec3([0, 0, 0], [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth], t);
            let right = lerpVec3([width, 0, 0], [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth], t);
            const material = new THREE.LineBasicMaterial({
                color: GRID_COLOR,
                transparent: false,
                opacity: 1
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...left),
                new THREE.Vector3(...right)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridGroup.add(line);
        }

        // Потолок
        const ceilFrontLeft = [0, height, 0];
        const ceilFrontRight = [width, height, 0];
        const ceilBackLeft = [...projectToBack(0, height, x_c, y_c, shrinkK), -depth];
        const ceilBackRight = [...projectToBack(width, height, x_c, y_c, shrinkK), -depth];

        // Горизонтальные линии потолка
        for (let x = 0; x <= this.gridWidth; x++) {
            let t = x / this.gridWidth;
            let start = lerpVec3(ceilFrontLeft, ceilFrontRight, t);
            let end = lerpVec3(ceilBackLeft, ceilBackRight, t);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: GRID_COLOR,
                    transparent: false,
                    opacity: 1
                });
                const s = lerpVec3(start, end, z / this.gridDepth);
                const e = lerpVec3(start, end, (z + 1) / this.gridDepth);
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...s),
                    new THREE.Vector3(...e)
                ]);
                const line = new THREE.Line(geometry, material);
                this.gridGroup.add(line);
            }
        }
        // Вертикальные линии потолка (по z)
        for (let z = 0; z <= this.gridDepth; z++) {
            let t = z / this.gridDepth;
            let left = lerpVec3([0, height, 0], [...projectToBack(0, height, x_c, y_c, shrinkK), -depth], t);
            let right = lerpVec3([width, height, 0], [...projectToBack(width, height, x_c, y_c, shrinkK), -depth], t);
            const material = new THREE.LineBasicMaterial({
                color: GRID_COLOR,
                transparent: false,
                opacity: 1
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...left),
                new THREE.Vector3(...right)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridGroup.add(line);
        }

        // Левая стена
        const leftFrontBottom = [0, 0, 0];
        const leftFrontTop = [0, height, 0];
        const leftBackBottom = [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth];
        const leftBackTop = [...projectToBack(0, height, x_c, y_c, shrinkK), -depth];

        // Горизонтальные линии левой стены
        for (let y = 0; y <= this.gridHeight; y++) {
            let t = y / this.gridHeight;
            let start = lerpVec3(leftFrontBottom, leftFrontTop, t);
            let end = lerpVec3(leftBackBottom, leftBackTop, t);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: GRID_COLOR,
                    transparent: false,
                    opacity: 1
                });
                const s = lerpVec3(start, end, z / this.gridDepth);
                const e = lerpVec3(start, end, (z + 1) / this.gridDepth);
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...s),
                    new THREE.Vector3(...e)
                ]);
                const line = new THREE.Line(geometry, material);
                this.gridGroup.add(line);
            }
        }
        // Вертикальные линии левой стены
        for (let z = 0; z <= this.gridDepth; z++) {
            let t = z / this.gridDepth;
            let start = lerpVec3(leftFrontBottom, leftBackBottom, t);
            let end = lerpVec3(leftFrontTop, leftBackTop, t);
            const material = new THREE.LineBasicMaterial({
                color: GRID_COLOR,
                transparent: false,
                opacity: 1
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...start),
                new THREE.Vector3(...end)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridGroup.add(line);
        }

        // Правая стена (x = width) — только рамка, теперь с перспективой
        const rightFrontBottom = [width, 0, 0];
        const rightFrontTop = [width, height, 0];
        const rightBackBottom = [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth];
        const rightBackTop = [...projectToBack(width, height, x_c, y_c, shrinkK), -depth];
        addLinePerspective(rightFrontBottom, rightFrontTop, true, BORDER_COLOR);
        addLinePerspective(rightFrontTop, rightBackTop, true, BORDER_COLOR);
        addLinePerspective(rightBackTop, rightBackBottom, true, BORDER_COLOR);
        addLinePerspective(rightBackBottom, rightFrontBottom, true, BORDER_COLOR);

        // Задняя грань (z = -depth)
        for (let x = 0; x <= this.gridWidth; x++) {
            let x0 = x * this.cellSize;
            let [x1, y1] = projectToBack(x0, 0, x_c, y_c, shrinkK);
            let [x2, y2] = projectToBack(x0, height, x_c, y_c, shrinkK);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: GRID_COLOR,
                    transparent: false,
                    opacity: 1
                });
                const s = lerpVec3([x1, y1, -depth], [x2, y2, -depth], z / this.gridDepth);
                const e = lerpVec3([x1, y1, -depth], [x2, y2, -depth], (z + 1) / this.gridDepth);
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...s),
                    new THREE.Vector3(...e)
                ]);
                const line = new THREE.Line(geometry, material);
                this.gridGroup.add(line);
            }
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            let y0 = y * this.cellSize;
            let [x1, y1] = projectToBack(0, y0, x_c, y_c, shrinkK);
            let [x2, y2] = projectToBack(width, y0, x_c, y_c, shrinkK);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: GRID_COLOR,
                    transparent: false,
                    opacity: 1
                });
                const s = lerpVec3([x1, y1, -depth], [x2, y2, -depth], z / this.gridDepth);
                const e = lerpVec3([x1, y1, -depth], [x2, y2, -depth], (z + 1) / this.gridDepth);
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...s),
                    new THREE.Vector3(...e)
                ]);
                const line = new THREE.Line(geometry, material);
                this.gridGroup.add(line);
            }
        }

        // === Границы тоннеля (рамка) ---
        // Передняя грань (рамка)
        addLinePerspective([0, 0, 0], [width, 0, 0], true, BORDER_COLOR);      // нижняя
        addLinePerspective([width, 0, 0], [width, height, 0], true, BORDER_COLOR); // правая
        addLinePerspective([width, height, 0], [0, height, 0], true, BORDER_COLOR); // верхняя
        addLinePerspective([0, height, 0], [0, 0, 0], true, BORDER_COLOR);      // левая
        // Задняя грань (рамка)
        let [x0b, y0b] = projectToBack(0, 0, x_c, y_c, shrinkK);
        let [x1b, y1b] = projectToBack(width, 0, x_c, y_c, shrinkK);
        let [x2b, y2b] = projectToBack(width, height, x_c, y_c, shrinkK);
        let [x3b, y3b] = projectToBack(0, height, x_c, y_c, shrinkK);
        addLinePerspective([x0b, y0b, -depth], [x1b, y1b, -depth], true, BORDER_COLOR);
        addLinePerspective([x1b, y1b, -depth], [x2b, y2b, -depth], true, BORDER_COLOR);
        addLinePerspective([x2b, y2b, -depth], [x3b, y3b, -depth], true, BORDER_COLOR);
        addLinePerspective([x3b, y3b, -depth], [x0b, y0b, -depth], true, BORDER_COLOR);

        // === Корректировка нижней линии пола и задней грани ===
        // Нижняя линия пола (y = 0)
        let [x1f, y1f] = projectToBack(0, 0, x_c, y_c, shrinkK);
        let [x2f, y2f] = projectToBack(width, 0, x_c, y_c, shrinkK);
        // Нижняя линия задней грани (y = 0)
        addLinePerspective([x1f, y1f, -depth], [x2f, y2f, -depth], true, 0xffffff);

        // === Заглушка за синей стороной (right wall fill) ===
        const rightWallGeometry = new THREE.PlaneGeometry(depth, height);
        const rightWallMaterial = new THREE.MeshBasicMaterial({
            color: RIGHT_WALL_COLOR,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });
        const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        // x = width + 0.1, центр по y и z
        rightWall.position.set(width + 0.1, height / 2, -depth / 2);
        // Поворот по оси Y
        rightWall.rotation.y = -Math.PI / 2;
        this.gridGroup.add(rightWall);

        // --- Поворот и позиционирование ---
        this.gridGroup.rotation.y = this.tunnelRotation;
        if (this.tunnelPosition) {
            this.gridGroup.position.set(...this.tunnelPosition);
        } else {
            this.gridGroup.position.set(-width / 2, -height / 2, -45);
        }

        // Добавляем сетку в сцену
        this.scene.add(this.gridGroup);
        this.logger.log('Grid group added to scene');
    }

    /**
     * Обновление анимации (пока не требуется)
     */
    update() {
        // this.logger.log('update called');
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
} 