import * as THREE from 'three';
import { projectToBack, lerpVec3 } from '../../utilsThreeD/utilsThreeD';

/**
 * @class Grid
 * @description Grid class for creating a 3D grid
 * @param {Object} options - Grid options
 * @param {number} options.gridWidth - Grid width
 * @param {number} options.gridHeight - Grid height
 * @param {number} options.gridDepth - Grid depth
 * @param {number} options.cellSize - Cell size
 * @param {number} options.lineWidth - Line width
 * @param {number} options.borderLineWidth - Border line width
 * @param {number} options.shrinkK - Shrink factor
 * @param {number} options.cellSizeBack - Cell size back
 * @param {number} options.tunnelRotation - Tunnel rotation
 * @param {number} options.tunnelPosition - Tunnel position
 * @param {number} options.gridColor - Grid color
 * @param {number} options.rightWallColor - Right wall color
 * @param {number} options.frontBorderColor - Front border color
 */
export class Grid {
    constructor(options) {
        this.gridWidth = options.gridWidth;
        this.gridHeight = options.gridHeight;
        this.gridDepth = options.gridDepth;
        this.cellSize = options.cellSize;
        this.lineWidth = options.lineWidth;
        this.borderLineWidth = options.borderLineWidth;
        this.shrinkK = options.shrinkK;
        this.cellSizeBack = options.cellSizeBack;
        this.tunnelRotation = options.tunnelRotation;
        this.tunnelPosition = options.tunnelPosition;
        this.gridColor = options.gridColor;
        this.rightWallColor = options.rightWallColor;
        this.frontBorderColor = options.frontBorderColor;
        this.borderColor = options.borderColor || options.frontBorderColor;
    }

    /**
     * @description Create floor lines
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createFloorLines(group) {
        const width = this.gridWidth * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = this.gridHeight * this.cellSize / 2;
        const shrinkK = this.shrinkK;
        const frontLeft = [0, 0, 0];
        const frontRight = [width, 0, 0];
        const backLeft = [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth];
        const backRight = [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth];
        for (let x = 0; x <= this.gridWidth; x++) {
            let t = x / this.gridWidth;
            let start = lerpVec3(frontLeft, frontRight, t);
            let end = lerpVec3(backLeft, backRight, t);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: this.gridColor,
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
                group.add(line);
            }
        }
        for (let z = 0; z <= this.gridDepth; z++) {
            let t = z / this.gridDepth;
            let left = lerpVec3([0, 0, 0], [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth], t);
            let right = lerpVec3([width, 0, 0], [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth], t);
            const material = new THREE.LineBasicMaterial({
                color: this.gridColor,
                transparent: false,
                opacity: 1
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...left),
                new THREE.Vector3(...right)
            ]);
            const line = new THREE.Line(geometry, material);
            group.add(line);
        }
    }

    /**
     * @description Create ceiling lines
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createCeilingLines(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;
        const ceilFrontLeft = [0, height, 0];
        const ceilFrontRight = [width, height, 0];
        const ceilBackLeft = [...projectToBack(0, height, x_c, y_c, shrinkK), -depth];
        const ceilBackRight = [...projectToBack(width, height, x_c, y_c, shrinkK), -depth];
        for (let x = 0; x <= this.gridWidth; x++) {
            let t = x / this.gridWidth;
            let start = lerpVec3(ceilFrontLeft, ceilFrontRight, t);
            let end = lerpVec3(ceilBackLeft, ceilBackRight, t);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: this.gridColor,
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
                group.add(line);
            }
        }
        for (let z = 0; z <= this.gridDepth; z++) {
            let t = z / this.gridDepth;
            let left = lerpVec3([0, height, 0], [...projectToBack(0, height, x_c, y_c, shrinkK), -depth], t);
            let right = lerpVec3([width, height, 0], [...projectToBack(width, height, x_c, y_c, shrinkK), -depth], t);
            const material = new THREE.LineBasicMaterial({
                color: this.gridColor,
                transparent: false,
                opacity: 1
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...left),
                new THREE.Vector3(...right)
            ]);
            const line = new THREE.Line(geometry, material);
            group.add(line);
        }
    }

    /**
     * @description Create left wall lines
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createLeftWallLines(group) {
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = this.gridWidth * this.cellSize / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;
        const leftFrontBottom = [0, 0, 0];
        const leftFrontTop = [0, height, 0];
        const leftBackBottom = [...projectToBack(0, 0, x_c, y_c, shrinkK), -depth];
        const leftBackTop = [...projectToBack(0, height, x_c, y_c, shrinkK), -depth];
        for (let y = 0; y <= this.gridHeight; y++) {
            let t = y / this.gridHeight;
            let start = lerpVec3(leftFrontBottom, leftFrontTop, t);
            let end = lerpVec3(leftBackBottom, leftBackTop, t);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: this.gridColor,
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
                group.add(line);
            }
        }
        for (let z = 0; z <= this.gridDepth; z++) {
            let t = z / this.gridDepth;
            let start = lerpVec3(leftFrontBottom, leftBackBottom, t);
            let end = lerpVec3(leftFrontTop, leftBackTop, t);
            const material = new THREE.LineBasicMaterial({
                color: this.gridColor,
                transparent: false,
                opacity: 1
            });
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...start),
                new THREE.Vector3(...end)
            ]);
            const line = new THREE.Line(geometry, material);
            group.add(line);
        }
    }

    /**
     * @description Create right wall frame
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createRightWallFrame(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;
        const rightFrontBottom = [width, 0, 0];
        const rightFrontTop = [width, height, 0];
        const rightBackBottom = [...projectToBack(width, 0, x_c, y_c, shrinkK), -depth];
        const rightBackTop = [...projectToBack(width, height, x_c, y_c, shrinkK), -depth];
        const addLine = (start, end) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...start),
                new THREE.Vector3(...end)
            ]);
            const material = new THREE.LineBasicMaterial({
                color: this.gridColor,
                linewidth: this.borderLineWidth,
                transparent: false,
                opacity: 1
            });
            const line = new THREE.Line(geometry, material);
            group.add(line);
        };
        addLine(rightFrontBottom, rightFrontTop);
        addLine(rightFrontTop, rightBackTop);
        addLine(rightBackTop, rightBackBottom);
        addLine(rightBackBottom, rightFrontBottom);
    }

    /**
     * @description Create back face lines
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createBackFaceLines(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;
        for (let x = 0; x <= this.gridWidth; x++) {
            let x0 = x * this.cellSize;
            let [x1, y1] = projectToBack(x0, 0, x_c, y_c, shrinkK);
            let [x2, y2] = projectToBack(x0, height, x_c, y_c, shrinkK);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: this.gridColor,
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
                group.add(line);
            }
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            let y0 = y * this.cellSize;
            let [x1, y1] = projectToBack(0, y0, x_c, y_c, shrinkK);
            let [x2, y2] = projectToBack(width, y0, x_c, y_c, shrinkK);
            for (let z = 0; z < this.gridDepth; z++) {
                const material = new THREE.LineBasicMaterial({
                    color: this.gridColor,
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
                group.add(line);
            }
        }
    }

    /**
     * @description Create tunnel borders
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createTunnelBorders(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;
        const addLine = (start, end, color) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...start),
                new THREE.Vector3(...end)
            ]);
            const material = new THREE.LineBasicMaterial({
                color: color,
                linewidth: this.borderLineWidth,
                transparent: false,
                opacity: 1
            });
            const line = new THREE.Line(geometry, material);
            group.add(line);
        };
        // Front face
        addLine([0, 0, 0], [width, 0, 0], this.frontBorderColor);
        addLine([width, 0, 0], [width, height, 0], this.frontBorderColor);
        addLine([width, height, 0], [0, height, 0], this.frontBorderColor);
        addLine([0, height, 0], [0, 0, 0], this.frontBorderColor);
        // Back face
        let [x0b, y0b] = projectToBack(0, 0, x_c, y_c, shrinkK);
        let [x1b, y1b] = projectToBack(width, 0, x_c, y_c, shrinkK);
        let [x2b, y2b] = projectToBack(width, height, x_c, y_c, shrinkK);
        let [x3b, y3b] = projectToBack(0, height, x_c, y_c, shrinkK);
        addLine([x0b, y0b, -depth], [x1b, y1b, -depth], this.borderColor);
        addLine([x1b, y1b, -depth], [x2b, y2b, -depth], this.borderColor);
        addLine([x2b, y2b, -depth], [x3b, y3b, -depth], this.borderColor);
        addLine([x3b, y3b, -depth], [x0b, y0b, -depth], this.borderColor);
        // Bottom back face line (y = 0)
        let [x1f, y1f] = projectToBack(0, 0, x_c, y_c, shrinkK);
        let [x2f, y2f] = projectToBack(width, 0, x_c, y_c, shrinkK);
        addLine([x1f, y1f, -depth], [x2f, y2f, -depth], 0xffffff);
    }

    /**
     * @description Create glow borders
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createGlowBorders(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const GLOW_COLOR = 0xE0D7FF;
        const GLOW_OPACITY = 0.5;
        const GLOW_LINE_WIDTH = (this.borderLineWidth || 3) * 2.2;
        const addGlowLine = (start, end) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...start),
                new THREE.Vector3(...end)
            ]);
            const material = new THREE.LineBasicMaterial({
                color: GLOW_COLOR,
                linewidth: GLOW_LINE_WIDTH,
                transparent: true,
                opacity: GLOW_OPACITY
            });
            const line = new THREE.Line(geometry, material);
            group.add(line);
        };
        addGlowLine([0, 0, 0], [width, 0, 0]);
        addGlowLine([width, 0, 0], [width, height, 0]);
        addGlowLine([width, height, 0], [0, height, 0]);
        addGlowLine([0, height, 0], [0, 0, 0]);
    }

    /**
     * @description Create solid right wall
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createSolidRightWall(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const rightWallGeometry = new THREE.PlaneGeometry(depth, height);
        const rightWallMaterial = new THREE.MeshBasicMaterial({
            color: this.rightWallColor,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });
        const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        rightWall.position.set(width + 0.1, height / 2, -depth / 2);
        rightWall.rotation.y = -Math.PI / 2;
        group.add(rightWall);
    }

    /**
     * @description Create matte cells
     * @param {THREE.Group} group - Group to add the lines to
     * @returns {void}
     */
    _createMatteCells(group) {
        const width = this.gridWidth * this.cellSize;
        const height = this.gridHeight * this.cellSize;
        const depth = this.gridDepth * this.cellSize;
        const x_c = width / 2;
        const y_c = height / 2;
        const shrinkK = this.shrinkK;
        const cellMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x6a4fd4,
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
                group.add(mesh);
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
                group.add(mesh);
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
                group.add(mesh);
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
                group.add(mesh);
            }
        }
    }

    /**
     * @description Build the grid
     * @returns {THREE.Group} - Group containing the grid
     */
    build() {
        this.group = new THREE.Group();
        this._createFloorLines(this.group);
        this._createCeilingLines(this.group);
        this._createLeftWallLines(this.group);
        this._createRightWallFrame(this.group);
        this._createBackFaceLines(this.group);
        this._createTunnelBorders(this.group);
        this._createGlowBorders(this.group);
        this._createSolidRightWall(this.group);
        this._createMatteCells(this.group);
        return this.group;
    }

    /**
     * @description Cleanup the grid
     * @returns {void}
     */
    cleanup() {
        if (!this.group) return;
        this.group.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.group = null;
    }
}