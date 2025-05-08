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

        this.borderColor = options.borderColor !== undefined ? options.borderColor : 0xFFFFFF;
        this.rightWallColor = options.rightWallColor !== undefined ? options.rightWallColor : 0x000000;
        // Set front border color for the front frame of the tunnel
        this.frontBorderColor = options.frontBorderColor !== undefined ? options.frontBorderColor : 0xA18FFF;
        
        this.gridGroup = null;
    }

    /**
     * Generates the 3D tunnel grid, positions it, and adds it to the scene.
     * Includes: grid, walls, floor, ceiling, back and right faces, transparent cells.
     * @private
     */
    _createTunnel() {
        // Colors for grid and borders
        const GRID_COLOR = this.borderColor;
        const RIGHT_WALL_COLOR = this.rightWallColor;
        const FRONT_BORDER_COLOR = this.frontBorderColor;

        // Grid parameters
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;

        // Helper to add a line with perspective and color
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
                color: colorOverride || (isBorder ? 0x7F5CFF : GRID_COLOR),
                linewidth: isBorder ? this.borderLineWidth : this.lineWidth,
                transparent: false,
                opacity: 1
            });
            const line = new THREE.Line(geometry, material);
            this.gridGroup.add(line);
        };
        // --- Grid lines generation ---
        // Floor corners
        const frontLeft = [0, 0, 0];
        const frontRight = [width, 0, 0];
        const backLeft = [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth];
        const backRight = [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth];

        // Horizontal floor lines
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
        // Vertical floor lines (z direction)
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
        // Ceiling
        const ceilFrontLeft = [0, height, 0];
        const ceilFrontRight = [width, height, 0];
        const ceilBackLeft = [...projectToBack(0, height, x_c, y_c, shrinkK), -depth];
        const ceilBackRight = [...projectToBack(width, height, x_c, y_c, shrinkK), -depth];
        // Horizontal ceiling lines
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
        // Vertical ceiling lines (z direction)
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
        // Left wall
        const leftFrontBottom = [0, 0, 0];
        const leftFrontTop = [0, height, 0];
        const leftBackBottom = [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth];
        const leftBackTop = [...projectToBack(0, height, x_c, y_c, shrinkK), -depth];
        // Horizontal left wall lines
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
        // Vertical left wall lines
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
        // Right wall (x = width) — only border, with perspective
        const rightFrontBottom = [width, 0, 0];
        const rightFrontTop = [width, height, 0];
        const rightBackBottom = [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth];
        const rightBackTop = [...projectToBack(width, height, x_c, y_c, shrinkK), -depth];
        addLinePerspective(rightFrontBottom, rightFrontTop, true, 0x7F5CFF);
        addLinePerspective(rightFrontTop, rightBackTop, true, 0x7F5CFF);
        addLinePerspective(rightBackTop, rightBackBottom, true, 0x7F5CFF);
        addLinePerspective(rightBackBottom, rightFrontBottom, true, 0x7F5CFF);
        // Back face (z = -depth)
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
        // --- Tunnel borders (frame) ---
        // Front face (frame) - use FRONT_BORDER_COLOR
        addLinePerspective([0, 0, 0], [width, 0, 0], true, FRONT_BORDER_COLOR);      // bottom
        addLinePerspective([width, 0, 0], [width, height, 0], true, FRONT_BORDER_COLOR); // right
        addLinePerspective([width, height, 0], [0, height, 0], true, FRONT_BORDER_COLOR); // top
        addLinePerspective([0, height, 0], [0, 0, 0], true, FRONT_BORDER_COLOR);      // left

        // --- Glow effect for front frame: add a second layer of lines with lighter color and more thickness ---
        const GLOW_COLOR = 0xE0D7FF; // light glow color
        const GLOW_OPACITY = 0.5;
        const GLOW_LINE_WIDTH = (this.borderLineWidth || 3) * 2.2;
        const addGlowLine = (start, end) => {
            const s = [...start];
            const e = [...end];
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...s),
                new THREE.Vector3(...e)
            ]);
            const material = new THREE.LineBasicMaterial({
                color: GLOW_COLOR,
                linewidth: GLOW_LINE_WIDTH,
                transparent: true,
                opacity: GLOW_OPACITY
            });
            const line = new THREE.Line(geometry, material);
            this.gridGroup.add(line);
        };
        // Add glow lines for each front frame edge
        addGlowLine([0, 0, 0], [width, 0, 0]);      // bottom
        addGlowLine([width, 0, 0], [width, height, 0]); // right
        addGlowLine([width, height, 0], [0, height, 0]); // top
        addGlowLine([0, height, 0], [0, 0, 0]);      // left
        // Back face (frame) - use borderColor
        let [x0b, y0b] = projectToBack(0, 0, x_c, y_c, shrinkK);
        let [x1b, y1b] = projectToBack(width, 0, x_c, y_c, shrinkK);
        let [x2b, y2b] = projectToBack(width, height, x_c, y_c, shrinkK);
        let [x3b, y3b] = projectToBack(0, height, x_c, y_c, shrinkK);
        addLinePerspective([x0b, y0b, -depth], [x1b, y1b, -depth], true, this.borderColor);
        addLinePerspective([x1b, y1b, -depth], [x2b, y2b, -depth], true, this.borderColor);
        addLinePerspective([x2b, y2b, -depth], [x3b, y3b, -depth], true, this.borderColor);
        addLinePerspective([x3b, y3b, -depth], [x0b, y0b, -depth], true, this.borderColor);
        // --- Floor and back face correction ---
        // Bottom floor line (y = 0)
        let [x1f, y1f] = projectToBack(0, 0, x_c, y_c, shrinkK);
        let [x2f, y2f] = projectToBack(width, 0, x_c, y_c, shrinkK);
        // Bottom back face line (y = 0)
        addLinePerspective([x1f, y1f, -depth], [x2f, y2f, -depth], true, 0xffffff);
        // --- Right wall fill (solid wall) ---
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
        // x = width + 0.1, center by y and z
        rightWall.position.set(width + 0.1, height / 2, -depth / 2);
        // Rotate by Y axis
        rightWall.rotation.y = -Math.PI / 2;
        this.gridGroup.add(rightWall);
        // --- Matte-glossy transparent cells for all sides except solid wall ---
        const cellMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x6a4fd4, // slightly darker
            transparent: true,
            opacity: 0.28,
            roughness: 0.6,
            metalness: 0.2,
            clearcoat: 0.4,
            clearcoatRoughness: 0.2,
            reflectivity: 0.12,
            side: THREE.DoubleSide
        });
        // Floor cells
        for (let x = 0; x < this.gridWidth; x++) {
            for (let z = 0; z < this.gridDepth; z++) {
                const corners = [
                    [x * this.cellSize, 0, z * this.cellSize],
                    [(x + 1) * this.cellSize, 0, z * this.cellSize],
                    [(x + 1) * this.cellSize, 0, (z + 1) * this.cellSize],
                    [x * this.cellSize, 0, (z + 1) * this.cellSize]
                ].map(([cx, cy, cz]) => {
                    if (cz === this.gridDepth * this.cellSize) {
                        return [...projectToBack(cx, cy, x_c, y_c, shrinkK), -cz];
                    }
                    return [cx, cy, -cz];
                });
                const vertices = new Float32Array([
                    ...corners[0], ...corners[1], ...corners[2], ...corners[3]
                ]);
                const indices = [0, 1, 2, 2, 3, 0];
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(indices);
                geometry.computeVertexNormals();
                const mesh = new THREE.Mesh(geometry, cellMaterial);
                this.gridGroup.add(mesh);
            }
        }
        // Ceiling cells
        for (let x = 0; x < this.gridWidth; x++) {
            for (let z = 0; z < this.gridDepth; z++) {
                const corners = [
                    [x * this.cellSize, height, z * this.cellSize],
                    [(x + 1) * this.cellSize, height, z * this.cellSize],
                    [(x + 1) * this.cellSize, height, (z + 1) * this.cellSize],
                    [x * this.cellSize, height, (z + 1) * this.cellSize]
                ].map(([cx, cy, cz]) => {
                    if (cz === this.gridDepth * this.cellSize) {
                        return [...projectToBack(cx, cy, x_c, y_c, shrinkK), -cz];
                    }
                    return [cx, cy, -cz];
                });
                const vertices = new Float32Array([
                    ...corners[0], ...corners[1], ...corners[2], ...corners[3]
                ]);
                const indices = [0, 1, 2, 2, 3, 0];
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(indices);
                geometry.computeVertexNormals();
                const mesh = new THREE.Mesh(geometry, cellMaterial);
                this.gridGroup.add(mesh);
            }
        }
        // Left wall cells
        for (let y = 0; y < this.gridHeight; y++) {
            for (let z = 0; z < this.gridDepth; z++) {
                const corners = [
                    [0, y * this.cellSize, z * this.cellSize],
                    [0, (y + 1) * this.cellSize, z * this.cellSize],
                    [0, (y + 1) * this.cellSize, (z + 1) * this.cellSize],
                    [0, y * this.cellSize, (z + 1) * this.cellSize]
                ].map(([cx, cy, cz]) => {
                    if (cz === this.gridDepth * this.cellSize) {
                        return [...projectToBack(cx, cy, x_c, y_c, shrinkK), -cz];
                    }
                    return [cx, cy, -cz];
                });
                const vertices = new Float32Array([
                    ...corners[0], ...corners[1], ...corners[2], ...corners[3]
                ]);
                const indices = [0, 1, 2, 2, 3, 0];
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(indices);
                geometry.computeVertexNormals();
                const mesh = new THREE.Mesh(geometry, cellMaterial);
                this.gridGroup.add(mesh);
            }
        }
        // Back face cells
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const [p1x, p1y] = projectToBack(x * this.cellSize, y * this.cellSize, x_c, y_c, shrinkK);
                const [p2x, p2y] = projectToBack((x + 1) * this.cellSize, y * this.cellSize, x_c, y_c, shrinkK);
                const [p3x, p3y] = projectToBack((x + 1) * this.cellSize, (y + 1) * this.cellSize, x_c, y_c, shrinkK);
                const [p4x, p4y] = projectToBack(x * this.cellSize, (y + 1) * this.cellSize, x_c, y_c, shrinkK);
                const z = -depth;
                const vertices = new Float32Array([
                    p1x, p1y, z,
                    p2x, p2y, z,
                    p3x, p3y, z,
                    p4x, p4y, z
                ]);
                const indices = [0, 1, 2, 2, 3, 0];
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(indices);
                geometry.computeVertexNormals();
                const mesh = new THREE.Mesh(geometry, cellMaterial);
                this.gridGroup.add(mesh);
            }
        }
        this.logger.log('Matte-glossy cells for all sides (except solid wall) added');

        // Set rotation and position for the tunnel group
        this.gridGroup.rotation.y = this.tunnelRotation;
        if (this.tunnelPosition) {
            this.gridGroup.position.set(...this.tunnelPosition);
        } else {
            this.gridGroup.position.set(-width / 2, -height / 2, -45);
        }
        // Add tunnel group to the scene
        this.scene.add(this.gridGroup);
    }

    /**
     * Adds all lights to the scene: ambient, directional, point, and tunnel light.
     * @private
     */
    _addLights() {
        // Ambient light for soft global illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.22);
        this.scene.add(ambient);
        // Directional light for main highlights
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 30);
        this.scene.add(dirLight);
        // Point light for additional local lighting
        const pointLight = new THREE.PointLight(0xffffff, 0.4, 100);
        pointLight.position.set(-5, 10, 20);
        this.scene.add(pointLight);
        // Tunnel directional light for depth effect
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const tunnelLight = new THREE.DirectionalLight(0xffffff, 1.1);
        tunnelLight.position.set(-10, height / 2, 40);
        tunnelLight.target.position.set(width / 2, height / 2, -depth / 2);
        this.scene.add(tunnelLight);
        this.scene.add(tunnelLight.target);
    }

    /**
     * Generates the 3D tunnel scene, adds tunnel, lights, and objects.
     */
    setupScene() {
        this.logger.log('setupScene called');
        this.gridGroup = new THREE.Group();
        this._createTunnel();
        this._addLights();
        this.addTunnelObjects();
    }

    /**
     * Добавляет объекты (PlaneGeometry с текстурой) в тоннель
     */
    addTunnelObjects() {
        const loader = new THREE.TextureLoader();
        const gridWidth = this.gridWidth * this.cellSize;
        const gridHeight = this.gridHeight * this.cellSize;
        const gridDepth = this.gridDepth * this.cellSize;
        this.tunnelObjects = [];
        const objectsData = [
            {
                name: 'object_card1',
                file: 'object_card1.png',
                position: { x: gridWidth * -0.1, y: gridHeight * -0.08, z: -gridDepth * 0.1 },
                size: { w: 1, h: 1 }
            },
            {
                name: 'object_card2',
                file: 'object_card2.png',
                position: { x: gridWidth * -0.1, y: gridHeight * 0, z: -gridDepth * 0.1 },
                size: { w: 1, h: 1 }
            },
            {
                name: 'object_money',
                file: 'object_money.png',
                position: { x: gridWidth * -0.1, y: gridHeight * -0.02, z: -gridDepth * 0.1 },
                size: { w: 1, h: 1 }
            },
            {
                name: 'object_link',
                file: 'object_link.png',
                position: { x: gridWidth * -0.1, y: gridHeight * 0.04, z: -gridDepth * 0.1 },
                size: { w: 1, h: 1 }
            },
            {
                name: 'object_picture',
                file: 'object_picture.png',
                position: { x: gridWidth * -0.1, y: gridHeight * -0.06, z: -gridDepth * 0.1 },
                size: { w: 1, h: 1 }
            }
        ];
        // Центр тоннеля в мировых координатах
        const localCenter = new THREE.Vector3(gridWidth / 1.4, gridHeight / 2, -gridDepth / 2);
        this.gridGroup.updateMatrixWorld(true);
        const worldCenter = localCenter.clone().applyMatrix4(this.gridGroup.matrixWorld);
        objectsData.forEach((obj, idx) => {
            loader.load(
                './assets/images/explore_3D/objects/' + obj.file,
                texture => {
                    const geometry = new THREE.PlaneGeometry(obj.size.w, obj.size.h);
                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 0 // стартовая прозрачность
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
                    mesh.name = obj.name;
                    mesh.scale.set(0, 0, 1); // стартовый scale 0
                    this.scene.add(mesh);
                    // --- Добавляем 3D-прямоугольник ---
                    const boxGeometry = new THREE.BoxGeometry(obj.size.w * 1.1, 0.12, obj.size.h * 0.7, 8, 2, 8);
                    const boxMaterial = new THREE.MeshPhysicalMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.6,
                        roughness: 0.3,
                        metalness: 0.2,
                        clearcoat: 0.5,
                        clearcoatRoughness: 0.2
                    });
                    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
                    boxMesh.position.set(obj.position.x, obj.position.y - 0.01 * (idx + 1), obj.position.z);
                    boxMesh.rotation.x = 0;
                    boxMesh.scale.set(0, 0, 1);
                    this.scene.add(boxMesh);
                    // ---
                    this.tunnelObjects.push({
                        mesh,
                        box: boxMesh,
                        state: 'waiting',
                        timer: 0,
                        delay: idx === 0 ? 0 : Math.random() * 30, // первый объект появляется сразу
                        start: { ...obj.position },
                        boxStart: { x: obj.position.x, y: obj.position.y - 0.01 * (idx + 1), z: obj.position.z },
                        end: { x: worldCenter.x, y: worldCenter.y, z: worldCenter.z },
                        durationFadeIn: 1.3 + Math.random() * 0.9,
                        durationMove: 8 + Math.random() * 60, 
                        durationFadeOut: 1.3 + Math.random() * 0.3,
                        pauseAfter: 0.7 + Math.random() * 10,
                        floatA: 0.35 + Math.random() * 0.15,
                        floatB: 0.35 + Math.random() * 0.15,
                        freqA: 0.7 + Math.random() * 0.3 + idx * 0.07,
                        freqB: 0.8 + Math.random() * 0.3 + idx * 0.09,
                        moveStart: null,
                        boxMoveStart: null
                    });
                },
                undefined,
                err => {
                    console.error(`Failed to load texture for ${obj.name}: ${obj.file}`);
                }
            );
        });

        // --- Прямоугольники как отдельные анимируемые объекты ---
        this.tunnelBoxes = [];
        const boxColors = ['#7A42F4', '#F00AFE', '#C06829', '#C94BFF', '#7A42F4', '#F00AFE', '#C06829', '#c06829',];
        for (let i = 0; i < 6; i++) {
            const baseIdx = i % objectsData.length;
            const baseObj = objectsData[baseIdx];
            const color = boxColors[i % boxColors.length];
            const boxGeometry = new THREE.BoxGeometry(1, 0.3, 4, 8, 2, 8);
            const boxMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.95,
                roughness: 0.35,
                metalness: 0.2
            });
            // Начальная позиция — как у картинки, но y -= 0.02 * (i+1)
            const startPos = {
                x: baseObj.position.x,
                y: baseObj.position.y - 0.02 * (i + 1),
                z: baseObj.position.z
            };
            const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
            boxMesh.position.set(startPos.x, startPos.y, startPos.z);
            boxMesh.rotation.x = 0;
            boxMesh.scale.set(0, 0, 1);
            this.scene.add(boxMesh);
            this.tunnelBoxes.push({
                mesh: boxMesh,
                state: 'waiting',
                timer: 0,
                delay: i === 0 ? 0 : 15 + Math.random() * 40, // увеличил рассинхронизацию
                start: { ...startPos },
                end: { x: worldCenter.x, y: worldCenter.y, z: worldCenter.z },
                durationFadeIn: 1.3 + Math.random() * 0.9,
                durationMove: 40 + Math.random() * 30, // 40-70 сек
                durationFadeOut: 1.3 + Math.random() * 0.3,
                pauseAfter: 15 + Math.random() * 15, // увеличил паузы
                floatA: 0.35 + Math.random() * 0.15,
                floatB: 0.35 + Math.random() * 0.15,
                freqA: 0.7 + Math.random() * 0.3 + i * 0.07,
                freqB: 0.8 + Math.random() * 0.3 + i * 0.09,
                moveStart: null,
                fadeStart: null
            });
        }
    }

    updateTunnelObjects(delta) {
        if (!this.tunnelObjects) return;
        const now = Date.now() * 0.001;
        // --- Анимация картинок ---
        for (let i = 0; i < this.tunnelObjects.length; i++) {
            const obj = this.tunnelObjects[i];
            obj.timer += delta;
            if (obj.state === 'waiting') {
                obj.mesh.position.set(obj.start.x, obj.start.y, obj.start.z);
                obj.mesh.material.opacity = 0;
                obj.mesh.scale.set(0, 0, 1);
                if (obj.timer >= obj.delay) {
                    obj.state = 'fading-in';
                    obj.timer = 0;
                }
            } else if (obj.state === 'fading-in') {
                const t = Math.min(obj.timer / obj.durationFadeIn, 1);
                obj.mesh.material.opacity = t;
                obj.mesh.scale.set(t, t, 1);
                if (t >= 1) {
                    obj.state = 'moving';
                    obj.timer = 0;
                    obj.moveStart = {
                        x: obj.mesh.position.x,
                        y: obj.mesh.position.y,
                        z: obj.mesh.position.z
                    };
                }
            } else if (obj.state === 'moving') {
                const t = Math.min(obj.timer / obj.durationMove, 1);
                const baseX = THREE.MathUtils.lerp(obj.moveStart.x, obj.end.x, t);
                const baseY = THREE.MathUtils.lerp(obj.moveStart.y, obj.end.y, t);
                const baseZ = THREE.MathUtils.lerp(obj.moveStart.z, obj.end.z, t);
                obj.mesh.position.x = baseX + Math.sin(now * obj.freqA + i) * obj.floatA;
                obj.mesh.position.y = baseY + Math.cos(now * obj.freqB + i * 0.5) * obj.floatB;
                obj.mesh.position.z = baseZ;
                const scale = 1 - t;
                obj.mesh.scale.set(scale, scale, 1);
                obj.mesh.material.opacity = 1 - t * 0.2;
                // --- плавное векторное отталкивание ---
                for (let j = 0; j < this.tunnelObjects.length; j++) {
                    if (i === j) continue;
                    const other = this.tunnelObjects[j];
                    if (other.state !== 'moving') continue;
                    const dist = obj.mesh.position.distanceTo(other.mesh.position);
                    const threshold = 0.7;
                    if (dist < threshold && dist > 0.001) {
                        const dir = obj.mesh.position.clone().sub(other.mesh.position).normalize();
                        obj.mesh.position.add(dir.multiplyScalar(0.04 * (1 - dist / threshold)));
                    }
                }
                if (t >= 1) {
                    obj.mesh.material.opacity = 0;
                    obj.mesh.scale.set(0, 0, 1);
                    obj.state = 'pause';
                    obj.timer = 0;
                }
            } else if (obj.state === 'pause') {
                if (obj.timer >= obj.pauseAfter) {
                    obj.state = 'waiting';
                    obj.timer = 0;
                    obj.delay = Math.random() * 2.0;
                }
            }
        }
        // --- Анимация прямоугольников ---
        if (!this.tunnelBoxes) return;
        for (let i = 0; i < this.tunnelBoxes.length; i++) {
            const obj = this.tunnelBoxes[i];
            obj.timer += delta;
            if (obj.state === 'waiting') {
                obj.mesh.position.set(obj.start.x, obj.start.y, obj.start.z);
                obj.mesh.material.opacity = 0;
                obj.mesh.scale.set(0, 0, 1);
                if (obj.timer >= obj.delay) {
                    obj.state = 'fading-in';
                    obj.timer = 0;
                }
            } else if (obj.state === 'fading-in') {
                const t = Math.min(obj.timer / obj.durationFadeIn, 1);
                obj.mesh.material.opacity = t * 0.98;
                obj.mesh.scale.set(t, t, 1);
                if (t >= 1) {
                    obj.state = 'moving';
                    obj.timer = 0;
                    obj.moveStart = {
                        x: obj.mesh.position.x,
                        y: obj.mesh.position.y,
                        z: obj.mesh.position.z
                    };
                }
            } else if (obj.state === 'moving') {
                const t = Math.min(obj.timer / obj.durationMove, 1);
                const baseX = THREE.MathUtils.lerp(obj.moveStart.x, obj.end.x, t);
                const baseY = THREE.MathUtils.lerp(obj.moveStart.y, obj.end.y, t);
                const baseZ = THREE.MathUtils.lerp(obj.moveStart.z, obj.end.z, t);
                obj.mesh.position.x = baseX + Math.sin(now * obj.freqA + i) * obj.floatA;
                obj.mesh.position.y = baseY + Math.cos(now * obj.freqB + i * 0.5) * obj.floatB;
                obj.mesh.position.z = baseZ;
                const scale = 1 - t;
                obj.mesh.scale.set(scale, scale, 1);
                obj.mesh.material.opacity = 0.98 * (1 - t * 0.2);
                // --- плавное векторное отталкивание ---
                for (let j = 0; j < this.tunnelBoxes.length; j++) {
                    if (i === j) continue;
                    const other = this.tunnelBoxes[j];
                    if (other.state !== 'moving') continue;
                    const dist = obj.mesh.position.distanceTo(other.mesh.position);
                    const threshold = 0.7;
                    if (dist < threshold && dist > 0.001) {
                        const dir = obj.mesh.position.clone().sub(other.mesh.position).normalize();
                        obj.mesh.position.add(dir.multiplyScalar(0.04 * (1 - dist / threshold)));
                    }
                }
                if (t >= 1) {
                    obj.mesh.material.opacity = 0;
                    obj.mesh.scale.set(0, 0, 1);
                    obj.state = 'pause';
                    obj.timer = 0;
                }
            } else if (obj.state === 'pause') {
                if (obj.timer >= obj.pauseAfter) {
                    obj.state = 'waiting';
                    obj.timer = 0;
                    obj.delay = 10 + Math.random() * 10;
                }
            }
        }
    }

    update(delta) {
        // this.logger.log('update called');
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        // Обновляем анимацию объектов тоннеля
        if (this.tunnelObjects && this.tunnelObjects.length) {
            // delta — время между кадрами (секунды)
            this.updateTunnelObjects(delta || 0.016); // если нет delta, берём ~60fps
        }
    }
} 