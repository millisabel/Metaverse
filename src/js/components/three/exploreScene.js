import * as THREE from 'three';

import { createLogger } from '../../utils/logger';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { Grid } from './grid';

const EXPLORE_DEFAULT_OPTIONS = {
    gridOptions: {
        gridWidth: 4,
        gridHeight: 6,
        gridDepth: 10,
        cellSize: 5,
        lineWidth: 1.5,
        borderLineWidth: 3,
        rightWallColor: 0x1e0b39,
        gridColor: 0x7F5CFF,
        frontBorderColor: 0xA18FFF,
        shrinkK: 1/3,
        cellSizeBack: 1,
        tunnelRotation: -Math.PI/8,
        tunnelPosition: null,
        borderColor: 0xA18FFF
    },
    boxConfigs: [
        { color: 0x7A42F4, size: { w: 1, h: 0.2, d: 3 } },
        { color: 0x4642F4, size: { w: 0.7, h: 0.3, d: 2.5 } },
        { color: 0xF00AFE, size: { w: 1.2, h: 0.5, d: 4 } },
        { color: 0x56FFEB, size: { w: 0.5, h: 0.1, d: 2 } },
        { color: 0xe6cf12, size: { w: 1.5, h: 0.5, d: 4 } },
        { color: 0xff5722, size: { w: 0.4, h: 0.1, d: 2.5 } },
    ],
    imageConfigs: [
        { file: './assets/images/explore_3D/objects/object_card1.png', size: { w: 2, h: 2 } },
        { file: './assets/images/explore_3D/objects/object_card2.png', size: { w: 2, h: 2 } },
        { file: './assets/images/explore_3D/objects/object_money.png', size: { w: 1, h: 1 } },
        { file: './assets/images/explore_3D/objects/object_link.png', size: { w: 1.5, h: 1.5 } },
        { file: './assets/images/explore_3D/objects/object_picture.png', size: { w: 1.8, h: 1.8 } }
    ],
};

export class ExploreScene extends Object_3D_Observer_Controller {
    /**
     * @param {HTMLElement} container - DOM-element for rendering
     * @param {Object} options - Options for configuring the grid
     */
    constructor(container, options = {}) {
        super(container, options, EXPLORE_DEFAULT_OPTIONS);
        
        this.logger = createLogger('ExploreScene');
        this.logger.log('ExploreScene constructor', { options });
        
        this.gridGroup = null;
        this.gridOptions = this.options.gridOptions;
        this.tunnelItems = [];
    }

    /**
     * Generates the 3D tunnel scene, adds tunnel, lights, and objects.
     */
    async setupScene() {
        console.log('setupScene called');
        this._createGrid();
        // this._addLights();
        // this.addTunnelImageObjects(this.imageConfigs);
        // this.addTunnelBoxes(this.boxConfigs);
    }

    async onResize() {
        console.log('onResize called');
        super.onResize();
    }

    update(delta) {
        if (this.tunnelItems && this.tunnelItems.length) {
            this.updateTunnelObjects(delta || 0.016);
        }

        super.update();
    }

    cleanup() {
        this._cleanupGrid();
        super.cleanup();
    }

    _createGrid() {
        const grid = new Grid(this.gridOptions);
        this.gridGroup = grid.build();

        this.gridGroup.rotation.y = this.gridOptions.tunnelRotation;
        
        if (this.gridOptions.tunnelPosition) {
            this.gridGroup.position.set(...this.gridOptions.tunnelPosition);
        } else {
            this.gridGroup.position.set(-this.gridOptions.gridWidth * this.gridOptions.cellSize / 2, -this.gridOptions.gridHeight * this.gridOptions.cellSize / 2, -45);
        }
        this.scene.add(this.gridGroup);
    }

    _cleanupGrid() {
        if (this.gridGroup && this.scene) {
            this.scene.remove(this.gridGroup);
            if (this.gridInstance && typeof this.gridInstance.cleanup === 'function') {
                this.gridInstance.cleanup();
            }
            this.gridGroup = null;
            this.gridInstance = null;
        }
    }

    /**
     * Returns tunnel grid dimensions and center positions.
     * @private
     */
    _getTunnelDimensions() {
        const gridWidth = this.gridOptions.gridWidth * this.gridOptions.cellSize;
        const gridHeight = this.gridOptions.gridHeight * this.gridOptions.cellSize;
        const gridDepth = this.gridOptions.gridDepth * this.gridOptions.cellSize;
        const localCenter = new THREE.Vector3(gridWidth / 1.4, gridHeight / 2, -gridDepth / 2);
        this.gridGroup.updateMatrixWorld(true);
        const worldCenter = localCenter.clone().applyMatrix4(this.gridGroup.matrixWorld);
        return { gridWidth, gridHeight, gridDepth, localCenter, worldCenter };
    }

    /**
     * Adds all lights to the scene: ambient, directional, point, and tunnel light.
     * @private
     */
    _addLights() {
        // Ambient, directional, and point lights for tunnel illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 30);
        this.scene.add(dirLight);
        const pointLight = new THREE.PointLight(0xffffff, 0.4, 100);
        pointLight.position.set(-5, 10, 20);
        this.scene.add(pointLight);
        const bottomLight = new THREE.DirectionalLight(0xffffff, 0.3);
        bottomLight.position.set(0, -10, 10);
        const width = this.gridOptions.gridWidth * this.gridOptions.cellSize;
        const height = this.gridOptions.gridHeight * this.gridOptions.cellSize;
        const depth = this.gridOptions.gridDepth * this.gridOptions.cellSize;
        const tunnelLight = new THREE.DirectionalLight(0xffffff, 1.1);
        tunnelLight.position.set(-10, height / 2, 40);
        tunnelLight.target.position.set(width / 2, height / 2, -depth / 2);
        this.scene.add(tunnelLight);
        this.scene.add(tunnelLight.target);
        this.scene.add(bottomLight);
    }

    /**
     * Adds image objects (PlaneGeometry with texture) to the tunnel.
     * @param {Array} imageObjects - Array of objects: { file: string, size?: {w: number, h: number}, position?: {x: number, y: number, z: number} }
     */
    addTunnelImageObjects(imageObjects) {
        if (!Array.isArray(imageObjects) || imageObjects.length === 0) return;
        const loader = new THREE.TextureLoader();
        const { gridWidth, gridHeight, gridDepth, worldCenter } = this._getTunnelDimensions();
        const width = gridWidth;
        const height = gridHeight;
        imageObjects.forEach((obj, idx) => {
            if (!obj || typeof obj !== 'object') return;
            const size = obj.size || { w: 1, h: 1 };
            loader.load(
                obj.file,
                texture => {
                    const geometry = new THREE.PlaneGeometry(size.w, size.h);
                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 0 
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    // All objects spawn at the left wall, random height
                    let pos;
                    if (obj.position) {
                        pos = obj.position;
                    } else {
                        const x = -width / 2;
                        const y = -height / 2 + Math.random() * height;
                        const z = 0;
                        pos = { x, y, z };
                    }
                    mesh.position.set(pos.x, pos.y, pos.z);
                    mesh.name = obj.name || `image_object_${idx}`;
                    mesh.scale.set(10, 10, 1); 
                    this.scene.add(mesh);
                    const rotationAxis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
                    const rotationSpeed = 0.2 + Math.random() * 0.4;
                    const rotationPhase = Math.random() * Math.PI * 2;
                    this.tunnelItems.push({
                        type: 'image',
                        mesh,
                        state: 'waiting',
                        timer: 0,
                        delay: idx === 0 ? 0 : Math.random() * 30,
                        start: { ...pos },
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
                        rotationAxis,
                        rotationSpeed,
                        rotationPhase
                    });
                },
                undefined,
                err => {
                    console.error(`Failed to load texture for ${obj.file}`);
                }
            );
        });
    }

    /**
     * Adds glossy boxes to the tunnel.
     * @param {Array} boxConfigs - Array of objects: { color: number, size: {w: number, h: number, d: number}, position?: {x: number, y: number, z: number} }
     */
    addTunnelBoxes(boxConfigs) {
        const { gridWidth, gridHeight, gridDepth, worldCenter } = this._getTunnelDimensions();
        const width = gridWidth;
        const height = gridHeight;
        boxConfigs.forEach((cfg, i) => {
            const geometry = new THREE.BoxGeometry(cfg.size.w, cfg.size.h, cfg.size.d, 16, 4, 16);
            const material = new THREE.MeshStandardMaterial({
                color: cfg.color,
                metalness: 0.1,
                roughness: 0.7,
                opacity: 1,
                transparent: false
            });
            // All boxes spawn at the left wall, random height
            let pos;
            if (cfg.position) {
                pos = cfg.position;
            } else {
                const x = -width / 2;
                const y = -height / 2 + Math.random() * height;
                const z = 0;
                pos = { x, y, z };
            }
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.rotation.x = 0;
            mesh.scale.set(1, 1, 1);
            this.scene.add(mesh);
            const glossGeometry = new THREE.PlaneGeometry(cfg.size.w * 0.8, cfg.size.d * 0.7);
            const glossMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.18
            });
            const glossMesh = new THREE.Mesh(glossGeometry, glossMaterial);
            glossMesh.position.set(0, cfg.size.h / 2 + 0.01, 0);
            glossMesh.rotation.x = -Math.PI / 2;
            // mesh.add(glossMesh);
            const rotationAxis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
            const rotationSpeed = 0.15 + Math.random() * 0.3;
            const rotationPhase = Math.random() * Math.PI * 2;
            this.tunnelItems.push({
                type: 'box',
                mesh,
                state: 'waiting',
                timer: 0,
                delay: i === 0 ? 0 : 15 + Math.random() * 40,
                start: { ...pos },
                end: { x: worldCenter.x, y: worldCenter.y, z: worldCenter.z },
                durationFadeIn: 1.3 + Math.random() * 0.9,
                durationMove: 40 + Math.random() * 30,
                durationFadeOut: 1.3 + Math.random() * 0.3,
                pauseAfter: 15 + Math.random() * 15,
                floatA: 0.35 + Math.random() * 0.15,
                floatB: 0.35 + Math.random() * 0.15,
                freqA: 0.7 + Math.random() * 0.3 + i * 0.07,
                freqB: 0.8 + Math.random() * 0.3 + i * 0.09,
                moveStart: null,
                rotationAxis,
                rotationSpeed,
                rotationPhase
            });
        });
    }

    /**
     * Updates animation for all tunnel items (images and boxes) in a unified way.
     * @param {number} delta - Time delta in seconds
     */
    updateTunnelObjects(delta) {
        if (!this.tunnelItems) return;
        const now = Date.now() * 0.001;
        const width = this.gridOptions.gridWidth * this.gridOptions.cellSize;
        const rightWallX = width / 2;
        const margin = 0.3;
        for (let i = 0; i < this.tunnelItems.length; i++) {
            const obj = this.tunnelItems[i];
            obj.timer += delta;
            if (obj.state === 'waiting') {
                obj.mesh.position.set(obj.start.x, obj.start.y, obj.start.z);
                obj.mesh.material.opacity = obj.type === 'box' ? 0 : 0;
                obj.mesh.scale.set(0, 0, 1);
                obj.mesh.rotation.x = 0;
                obj.mesh.rotation.y = 0;
                obj.mesh.rotation.z = 0;
                if (obj.timer >= obj.delay) {
                    obj.state = 'fading-in';
                    obj.timer = 0;
                }
            } else if (obj.state === 'fading-in') {
                const t = Math.min(obj.timer / obj.durationFadeIn, 1);
                obj.mesh.material.opacity = obj.type === 'box' ? t * 0.98 : t;
                const minScale = 0.5;
                const maxScale = 2;
                const scale = maxScale - (maxScale - minScale) * t;
                obj.mesh.scale.set(scale, scale, 1);
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
                let baseX = THREE.MathUtils.lerp(obj.moveStart.x, obj.end.x, t);
                let baseY = THREE.MathUtils.lerp(obj.moveStart.y, obj.end.y, t);
                let baseZ = THREE.MathUtils.lerp(obj.moveStart.z, obj.end.z, t);
                if (baseX > rightWallX - margin) {
                    const excess = baseX - (rightWallX - margin);
                    baseX -= excess * 2;
                }
                obj.mesh.position.x = baseX + Math.sin(now * obj.freqA + i) * obj.floatA;
                obj.mesh.position.y = baseY + Math.cos(now * obj.freqB + i * 0.5) * obj.floatB;
                obj.mesh.position.z = baseZ;
                const minScale = 0.7;
                const maxScale = 2;
                const scale = maxScale - (maxScale - minScale) * t;
                obj.mesh.scale.set(scale, scale, 1);
                obj.mesh.material.opacity = obj.type === 'box' ? 0.98 * (1 - t * 0.2) : 1 - t * 0.2;
                if (obj.rotationAxis && obj.rotationSpeed) {
                    const angle = Math.sin(now * 0.7 + obj.rotationPhase) * 0.2 + (now * obj.rotationSpeed);
                    obj.mesh.rotation[obj.rotationAxis] = angle;
                }
                for (let j = 0; j < this.tunnelItems.length; j++) {
                    if (i === j) continue;
                    const other = this.tunnelItems[j];
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
                    obj.delay = obj.type === 'box' ? 10 + Math.random() * 10 : Math.random() * 2.0;
                }
            }
        }
    }
} 