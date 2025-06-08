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
        { color: 0x4642F4, size: { w: 1.7, h: 1.3, d: 2.5 } },
        { color: 0xF00AFE, size: { w: 1.2, h: 0.5, d: 4 } },
        { color: 0x56FFEB, size: { w: 5.5, h: 2.1, d: 2 } },
        { color: 0xe6cf12, size: { w: 3.5, h: 1.5, d: 4 } },
        { color: 0xff5722, size: { w: 2.9, h: 1.2, d: 2.5 } },
    ],
    imageConfigs: [
        { file: './assets/images/explore_3D/object_card1.png', size: { w: 5.5, h: 2.5 } },
        { file: './assets/images/explore_3D/object_card2.png', size: { w: 7, h: 7 } },
        { file: './assets/images/explore_3D/object_money.png', size: { w: 2, h: 2 } },
        { file: './assets/images/explore_3D/object_link.png', size: { w: 2.5, h: 2.5 } },
        { file: './assets/images/explore_3D/object_picture.png', size: { w: 2.8, h: 2.8 } }
    ],
    animationOptions: {
        moveDuration: { box: [10, 50], image: [8, 28] },
        floatA: [0.35, 2.5],
        floatB: [0.35, 0.5],
        freqA: [0.7, 2.0],
        freqB: [0.8, 1.1],
        endJitter: 0,
        delay: { box: [1, 3], image: [2, 4] },
        pauseAfter: { box: [1, 3], image: [2, 4] },
        spawnInterval: { box: [5, 15], image: [2, 4] },
        firstDelay: { box: [0, 1], image: [1, 3] },
        rotation: {
            box: ['x', 'y', 'z'],
            image: ['z']
        }
    }
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
        this.setupLights();
        this._addLights();

        this.addTunnelObjects(this.options.imageConfigs, 'image', this.createImageMesh.bind(this));
        this.addTunnelObjects(this.options.boxConfigs, 'box', this.createBoxMesh.bind(this));
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
        const { gridWidth, gridHeight, gridDepth } = this._getTunnelDimensions();

        const tunnelCenter = new THREE.Vector3(
        gridWidth / 2,
        gridHeight / 2,
        -gridDepth / 2
        );

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(
        gridWidth / 2,        
        gridHeight * 1.2,      
        gridDepth * 0.7        
        );
        dirLight.target.position.copy(tunnelCenter);

        const ambient = new THREE.AmbientLight(0xffffff, 0.4);

        this.scene.add(dirLight);
        this.scene.add(dirLight.target);
        this.scene.add(ambient);
    }

    /**
     * Universal method to add tunnel objects (images, boxes, etc.)
     * @param {Array} configs - Array of configs for objects
     * @param {string} type - Type of object ('image' | 'box')
     * @param {Function} meshFactory - Function (cfg, idx, width, height, loader?) => { mesh, extra }
     */
    addTunnelObjects(configs, type, meshFactory) {
        const { gridWidth, gridHeight, gridDepth, worldCenter } = this._getTunnelDimensions();
        const width = gridWidth;
        const height = gridHeight;
        const loader = type === 'image' ? new THREE.TextureLoader() : null;
        const anim = this.options.animationOptions || EXPLORE_DEFAULT_OPTIONS.animationOptions;
        const delayRange = anim.delay && anim.delay[type] ? anim.delay[type] : [0, 2];
        const pauseRange = anim.pauseAfter && anim.pauseAfter[type] ? anim.pauseAfter[type] : [1, 2];
        const firstDelayRange = anim.firstDelay && anim.firstDelay[type] ? anim.firstDelay[type] : [0, 0];
        const spawnRange = anim.spawnInterval && anim.spawnInterval[type] ? anim.spawnInterval[type] : [0, 0];

        configs.forEach((cfg, idx) => {
            const { mesh, extra } = meshFactory(cfg, idx, width, height, loader);
            let pos = cfg.position || {
                x: -width / 2,
                y: -height / 2 + Math.random() * height,
                z: 0
            };
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.name = cfg.name || `${type}_object_${idx}`;
            this.scene.add(mesh);
            if (type === 'image') mesh.scale.set(10, 10, 1);
            // Вращение: для image только 'z', для box — случайная ось
            let rotationAxis;
            if (type === 'image') {
                rotationAxis = 'z';
            } else {
                const axes = anim.rotation.box;
                rotationAxis = axes[Math.floor(Math.random() * axes.length)];
            }
            const rotationSpeed = type === 'image'
                ? 0.2 + Math.random() * 0.4
                : 0.15 + Math.random() * 0.3;
            const rotationPhase = Math.random() * Math.PI * 2;
            const obj = {
                type,
                mesh,
                ...extra,
                state: 'waiting',
                timer: 0,
                delay: idx === 0
                    ? firstDelayRange[0] + Math.random() * (firstDelayRange[1] - firstDelayRange[0])
                    : delayRange[0] + Math.random() * (delayRange[1] - delayRange[0]),
                start: { ...pos },
                end: { x: worldCenter.x, y: worldCenter.y, z: worldCenter.z },
                durationFadeIn: 1.3 + Math.random() * 0.9,
                durationMove: type === 'box' ? 40 + Math.random() * 30 : 8 + Math.random() * 60,
                durationFadeOut: 1.3 + Math.random() * 0.3,
                pauseAfter: pauseRange[0] + Math.random() * (pauseRange[1] - pauseRange[0]),
                floatA: 0.35 + Math.random() * 0.15,
                floatB: 0.35 + Math.random() * 0.15,
                freqA: 0.7 + Math.random() * 0.3 + idx * 0.07,
                freqB: 0.8 + Math.random() * 0.3 + idx * 0.09,
                moveStart: null,
                rotationAxis,
                rotationSpeed,
                rotationPhase,
                spawnInterval: spawnRange[0] + Math.random() * (spawnRange[1] - spawnRange[0]),
            };
            this._resetTunnelItem(obj, idx, width, height, worldCenter, anim, type);
            this.tunnelItems.push(obj);
        });
    }

    /**
     * Сброс параметров и траектории для объекта тоннеля
     */
    _resetTunnelItem(obj, i, width, height, worldCenter, anim, type) {
        // Получаем опции
        anim = anim || this.options.animationOptions || EXPLORE_DEFAULT_OPTIONS.animationOptions;
        type = type || obj.type;
        // Стартовая точка
        obj.start = {
            x: -width / 2,
            y: -height / 2 + Math.random() * height,
            z: 0
        };
        // Конечная точка с разбросом
        const jitter = anim.endJitter || 2;
        obj.end = {
            x: worldCenter.x + (Math.random() - 0.5) * jitter,
            y: worldCenter.y + (Math.random() - 0.5) * jitter,
            z: worldCenter.z + (Math.random() - 0.5) * jitter
        };
        // Диапазоны
        const dur = anim.moveDuration[type] || [8, 68];
        obj.durationMove = dur[0] + Math.random() * (dur[1] - dur[0]);
        const fA = anim.floatA || [0.35, 0.5];
        obj.floatA = fA[0] + Math.random() * (fA[1] - fA[0]);
        const fB = anim.floatB || [0.35, 0.5];
        obj.floatB = fB[0] + Math.random() * (fB[1] - fB[0]);
        const fqA = anim.freqA || [0.7, 1.0];
        obj.freqA = fqA[0] + Math.random() * (fqA[1] - fqA[0]) + i * 0.07;
        const fqB = anim.freqB || [0.8, 1.1];
        obj.freqB = fqB[0] + Math.random() * (fqB[1] - fqB[0]) + i * 0.09;
        // Вращение: для image только по Z, для box — как раньше
        if (type === 'image') {
            obj.rotationAxis = 'z';
        } else {
            const axes = anim.rotation.box;
            obj.rotationAxis = axes[Math.floor(Math.random() * axes.length)];
        }
    }

    // Фабрика для image
    createImageMesh(cfg, idx, width, height, loader) {
        let mesh = null;
        let extra = {};
        const size = cfg.size || { w: 1, h: 1 };
        // Синхронно создаём mesh с прозрачным материалом, текстуру подгружаем асинхронно
        const geometry = new THREE.PlaneGeometry(size.w, size.h);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0
        });
        mesh = new THREE.Mesh(geometry, material);
        if (cfg.file && loader) {
            loader.load(
                cfg.file,
                texture => {
                    mesh.material.map = texture;
                    mesh.material.needsUpdate = true;
                },
                undefined,
                err => {
                    console.error(`Failed to load texture for ${cfg.file}`);
                }
            );
        }
        return { mesh, extra };
    }

    // Фабрика для box
    createBoxMesh(cfg, idx, width, height) {
        const geometry = new THREE.BoxGeometry(cfg.size.w, cfg.size.h, cfg.size.d, 16, 4, 16);
        const material = new THREE.MeshStandardMaterial({
            color: cfg.color,
            metalness: 0.1,
            roughness: 0.7,
            opacity: 1,
            transparent: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        // Glossy overlay (опционально, если нужно)
        // const glossGeometry = new THREE.PlaneGeometry(cfg.size.w * 0.8, cfg.size.d * 0.7);
        // const glossMaterial = new THREE.MeshBasicMaterial({
        //     color: 0xffffff,
        //     transparent: true,
        //     opacity: 0.18
        // });
        // const glossMesh = new THREE.Mesh(glossGeometry, glossMaterial);
        // glossMesh.position.set(0, cfg.size.h / 2 + 0.01, 0);
        // glossMesh.rotation.x = -Math.PI / 2;
        // mesh.add(glossMesh);
        return { mesh, extra: {} };
    }

    /**
     * Updates animation for all tunnel items (images and boxes) in a unified way.
     * @param {number} delta - Time delta in seconds
     */
    updateTunnelObjects(delta) {
        if (!this.tunnelItems) return;
        const now = Date.now() * 0.001;
        const width = this.gridOptions.gridWidth * this.gridOptions.cellSize;
        const height = this.gridOptions.gridHeight * this.gridOptions.cellSize;
        const { worldCenter } = this._getTunnelDimensions();
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

                // Гарантированно плавное затухание колебаний
                const phaseA = Math.PI * t;
                const phaseB = Math.PI * t + Math.PI / 2;
                const fade = 1 - t;
                obj.mesh.position.x = baseX + Math.sin(phaseA) * obj.floatA * fade;
                obj.mesh.position.y = baseY + Math.sin(phaseB) * obj.floatB * fade;
                obj.mesh.position.z = baseZ;

                const minScale = 0.7;
                const maxScale = 2;
                const scale = maxScale - (maxScale - minScale) * t;
                obj.mesh.scale.set(scale, scale, 1);
                obj.mesh.material.opacity = obj.type === 'box' ? 0.98 * (1 - t * 0.2) : 1 - t * 0.2;
                // Вращение: для image только по Z, для box — как раньше
                if (obj.type === 'box' && obj.rotationAxis && obj.rotationSpeed) {
                    const angle = Math.sin(now * 0.7 + obj.rotationPhase) * 0.2 + (now * obj.rotationSpeed);
                    obj.mesh.rotation[obj.rotationAxis] = angle;
                } else if (obj.type === 'image') {
                    // Для image — только по Z, можно чуть-чуть покачивать
                    obj.mesh.rotation.x = 0;
                    obj.mesh.rotation.y = 0;
                    obj.mesh.rotation.z = Math.sin(now * 0.5 + i) * 0.07;
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
                if (obj.timer >= obj.pauseAfter + obj.spawnInterval) {
                    obj.state = 'waiting';
                    obj.timer = 0;
                    // Генерируем новую задержку, паузу и spawnInterval из animationOptions
                    const anim = this.options.animationOptions || EXPLORE_DEFAULT_OPTIONS.animationOptions;
                    const delayRange = anim.delay && anim.delay[obj.type] ? anim.delay[obj.type] : [0, 2];
                    const pauseRange = anim.pauseAfter && anim.pauseAfter[obj.type] ? anim.pauseAfter[obj.type] : [1, 2];
                    const spawnRange = anim.spawnInterval && anim.spawnInterval[obj.type] ? anim.spawnInterval[obj.type] : [0, 0];
                    obj.delay = delayRange[0] + Math.random() * (delayRange[1] - delayRange[0]);
                    obj.pauseAfter = pauseRange[0] + Math.random() * (pauseRange[1] - pauseRange[0]);
                    obj.spawnInterval = spawnRange[0] + Math.random() * (spawnRange[1] - spawnRange[0]);
                    this._resetTunnelItem(obj, i, width, height, worldCenter, anim, obj.type);
                }
            }
        }
    }
} 