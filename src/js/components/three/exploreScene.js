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
        moveDuration: { box: [5, 50], image: [8, 28] },
        float: {
            box: { x: [0.35, 2.5], y: [0.35, 0.5] },
            image: { x: [0.5, 1.5], y: [0.2, 0.7] }
        },
        freq: {
            box: { x: [0.7, 2.0], y: [0.8, 1.1] },
            image: { x: [1.0, 1.5], y: [1.0, 1.5] }
        },
        tunnelEndSpread: 0,
        delay: [1, 3],
        pauseAfter: [1, 3],
        spawnInterval: [5, 15],
        scale: {
            box: { min: 0.3, max: 3 },
            image: { min: 0.2, max: 3 }
        },
        opacity: {
            box: { min: 0, max: 0.98 },
            image: { min: 0, max: 1 }
        },
        rotationAmplitude: {
            box: 0.2,
            image: 0.005
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
        this.objects = [];
    }

    /**
     * Generates the 3D tunnel scene, adds tunnel, lights, and objects.
     */
    async setupScene() {
        this._createGrid();
        this._addLights();

        this.addTunnelObjects(this.options.imageConfigs, 'image', this.createImageMesh.bind(this));
        this.addTunnelObjects(this.options.boxConfigs, 'box', this.createBoxMesh.bind(this));
        console.log(this.objects);
    }

    async onResize() {
        super.onResize();
    }

    update(delta) {
        if (this.objects && this.objects.length) {
            this.updateTunnelObjects(delta || 0.016);
        }

        super.update();
    }

    cleanup() {
        if (this.objects && this.scene) {
            this.objects.forEach(obj => {
                if (obj.mesh) {
                    this.scene.remove(obj.mesh);
                }
            });
            this.objects = [];
        }
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

        const numLights = 4;
        for (let i = 0; i < numLights; i++) {
            const z = -gridDepth * (i / (numLights - 1));
            const pointLight = new THREE.PointLight(0xffffff, 0.8, gridDepth * 1.2, 2);
            pointLight.position.set(gridWidth / 2, gridHeight / 2, z);
            this.scene.add(pointLight);
        }

        const spotLight = new THREE.SpotLight(0xffffff, 0.7, gridDepth * 1.5, Math.PI / 6, 0.3, 1);
        spotLight.position.set(gridWidth / 2, gridHeight / 2, 10);
        spotLight.target.position.set(gridWidth / 2, gridHeight / 2, -gridDepth);
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
    }

    /**
     * Universal method to add tunnel objects (images, boxes, etc.)
     * @param {Array} configs - Array of configs for objects
     * @param {string} type - Type of object ('image' | 'box')
     * @param {Function} meshFactory - Function (cfg, idx, width, height, loader?) => { mesh, extra }
     */
    addTunnelObjects(configs, type, meshFactory) {
        const { gridWidth, gridHeight, worldCenter } = this._getTunnelDimensions();
        const width = gridWidth;
        const height = gridHeight;
        const loader = type === 'image' ? new THREE.TextureLoader() : null;

        const tempObjects = [];
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
            if (type === 'image') {
                const scaleX = width / (cfg.size?.w || 1);
                const scaleY = height / (cfg.size?.h || 1);
                mesh.scale.set(scaleX, scaleY, 1);
            }
            const newObj = { type, mesh, extra, idx, pos };
            tempObjects.push(newObj);
        });
        this.objects.push(...tempObjects);
    }

    /**
     * Генерирует анимационные параметры для объекта тоннеля
     */
    _generateTunnelAnimationParams(base, idx, worldCenter) {
        const anim = this.options.animationOptions || EXPLORE_DEFAULT_OPTIONS.animationOptions;
        const type = base.type;
        const floatRange = anim.float?.[type] || { x: [0.35, 0.5], y: [0.35, 0.5] };
        const freqRange = anim.freq?.[type] || { x: [0.7, 1.0], y: [0.8, 1.1] };
        const delayRange = anim.delay || [0, 2];
        const pauseRange = anim.pauseAfter || [1, 2];
        const spawnRange = anim.spawnInterval || [0, 0];
        const axes = ['x', 'y', 'z'];
        const rotationAxis = type === 'image' ? 'z' : axes[Math.floor(Math.random() * axes.length)];
        const rotationSpeed = type === 'image'
            ? 0.2 + Math.random() * 0.4
            : 0.15 + Math.random() * 0.3;
        const rotationPhase = Math.random() * Math.PI * 2;
        const delay = idx === 0 ? 0 : delayRange[0] + Math.random() * (delayRange[1] - delayRange[0]);
        const start = { ...base.pos };
        const end = { x: worldCenter.x, y: worldCenter.y, z: worldCenter.z };
        const durationFadeIn = 1.3 + Math.random() * 0.9;
        const moveRange = anim.moveDuration?.[type] || [8, 68];
        const durationMove = moveRange[0] + Math.random() * (moveRange[1] - moveRange[0]);
        const durationFadeOut = 1.3 + Math.random() * 0.3;
        const pauseAfter = pauseRange[0] + Math.random() * (pauseRange[1] - pauseRange[0]);
        const floatX = floatRange.x[0] + Math.random() * (floatRange.x[1] - floatRange.x[0]);
        const floatY = floatRange.y[0] + Math.random() * (floatRange.y[1] - floatRange.y[0]);
        const freqX = freqRange.x[0] + Math.random() * (freqRange.x[1] - freqRange.x[0]) + idx * 0.07;
        const freqY = freqRange.y[0] + Math.random() * (freqRange.y[1] - freqRange.y[0]) + idx * 0.09;
        const moveStart = null;
        const spawnInterval = spawnRange[0] + Math.random() * (spawnRange[1] - spawnRange[0]);

        return {
            ...base,
            state: 'waiting',
            timer: 0,
            delay,
            start,
            end,
            durationFadeIn,
            durationMove,
            durationFadeOut,
            pauseAfter,
            floatX,
            floatY,
            freqX,
            freqY,
            moveStart,
            rotationAxis,
            rotationSpeed,
            rotationPhase,
            spawnInterval,
        };
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
        return { gridWidth, gridHeight, worldCenter, gridDepth, localCenter };
    }

    // Фабрика для image
    createImageMesh(cfg, idx, width, height, loader) {
        let mesh = null;
        let extra = {};

        const size = cfg.size || { w: 1, h: 1 };
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

    createBoxMesh(cfg) {
        const geometry = new THREE.BoxGeometry(cfg.size.w, cfg.size.h, cfg.size.d, 16, 4, 16);
        const material = new THREE.MeshStandardMaterial({
            color: cfg.color,
            metalness: 0.1,
            roughness: 0.7,
            opacity: 1,
            transparent: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        return { mesh, extra: {} };
    }

    /**
     * Updates animation for all tunnel items (images and boxes) in a unified way.
     * @param {number} delta - Time delta in seconds
     */
    updateTunnelObjects(delta) {
        if (!this.objects) return;

        const now = Date.now() * 0.001;
        const { worldCenter } = this._getTunnelDimensions();
        
        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            if (!obj.state) {
                if (i === 0) {
                    Object.assign(obj, this._generateTunnelAnimationParams(obj, i, worldCenter));
                    obj.delay = 0;
                } else {
                    const prev = this.objects[i - 1];
                    if (prev.state && prev.state !== 'waiting') {
                        Object.assign(obj, this._generateTunnelAnimationParams(obj, i, worldCenter));
                    } else {
                        continue; 
                    }
                }
            }
            obj.timer += delta;
            switch (obj.state) {
                case 'waiting':
                    this._handleWaitingState(obj);
                    break;
                case 'fading-in':
                    this._handleFadingInState(obj);
                    break;
                case 'moving':
                    this._handleMovingState(obj, i, now);
                    break;
                case 'pause':
                    this._handlePauseState(obj, i, worldCenter);
                    break;
            }
        }
    }

    _handleWaitingState(obj) {
        obj.mesh.position.set(obj.start.x, obj.start.y, obj.start.z);
        obj.mesh.material.opacity = 0;
        obj.mesh.scale.set(0, 0, 1);
        obj.mesh.rotation.x = 0;
        obj.mesh.rotation.y = 0;
        obj.mesh.rotation.z = 0;
        if (obj.timer >= obj.delay) {
            obj.state = 'fading-in';
            obj.timer = 0;
        }
    }

    _handleFadingInState(obj) {
        const animOpts = this.options.animationOptions || EXPLORE_DEFAULT_OPTIONS.animationOptions;
        const scaleOpts = animOpts.scale?.[obj.type] || { min: obj.type === 'box' ? 0.7 : 0.5, max: 2 };
        const opacityOpts = animOpts.opacity?.[obj.type] || { min: 0, max: obj.type === 'box' ? 0.98 : 1 };
        const t = Math.min(obj.timer / obj.durationFadeIn, 1);

        obj.mesh.material.opacity = opacityOpts.min + (opacityOpts.max - opacityOpts.min) * t;
        const scale = scaleOpts.max - (scaleOpts.max - scaleOpts.min) * t;
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
    }

    _handleMovingState(obj, i, now) {
        const t = Math.min(obj.timer / obj.durationMove, 1);

        let baseX = THREE.MathUtils.lerp(obj.moveStart.x, obj.end.x, t);
        let baseY = THREE.MathUtils.lerp(obj.moveStart.y, obj.end.y, t);
        let baseZ = THREE.MathUtils.lerp(obj.moveStart.z, obj.end.z, t);

        const animOpts = this.options.animationOptions || EXPLORE_DEFAULT_OPTIONS.animationOptions;
        const scaleOpts = animOpts.scale?.[obj.type] || { min: obj.type === 'box' ? 0.7 : 0.5, max: 2 };
        const opacityOpts = animOpts.opacity?.[obj.type] || { min: 0, max: obj.type === 'box' ? 0.98 : 1 };
        const rotationAmp = animOpts.rotationAmplitude?.[obj.type] ?? (obj.type === 'box' ? 0.2 : 0.05);
        const phaseX = Math.PI * t * obj.freqX;
        const phaseY = Math.PI * t * obj.freqY + Math.PI / 2;
        const fade = 1 - t;
        const scale = scaleOpts.max - (scaleOpts.max - scaleOpts.min) * t;
        const angle = Math.sin(now * 0.7 + obj.rotationPhase) * rotationAmp + (now * obj.rotationSpeed);

        obj.mesh.position.x = baseX + Math.sin(phaseX) * obj.floatX * fade;
        obj.mesh.position.y = baseY + Math.sin(phaseY) * obj.floatY * fade;
        obj.mesh.position.z = baseZ;
        obj.mesh.scale.set(scale, scale, 1);
        obj.mesh.material.opacity = opacityOpts.max - (opacityOpts.max - opacityOpts.min) * t * 0.2;
        obj.mesh.rotation[obj.rotationAxis] = angle;

        for (let j = 0; j < this.objects.length; j++) {
            if (i === j) continue;
            const other = this.objects[j];
            if (other.state !== 'moving') continue;
            const dist = obj.mesh.position.distanceTo(other.mesh.position);
            const threshold = 0.7;
            if (dist < threshold && dist > 0.001) {
                const dir = obj.mesh.position.clone().sub(other.mesh.position).normalize();
                obj.mesh.position.add(dir.multiplyScalar(0.04 * (1 - dist / threshold)));
            }
        }
        if (t >= 1) {
            obj.mesh.material.opacity = opacityOpts.min;
            obj.mesh.scale.set(0, 0, 1);
            obj.state = 'pause';
            obj.timer = 0;
        }
    }

    _handlePauseState(obj, i, worldCenter) {
        if (obj.timer >= obj.pauseAfter + obj.spawnInterval) {
            obj.state = 'waiting';
            obj.timer = 0;
            const newParams = this._generateTunnelAnimationParams(obj, i, worldCenter);
            Object.assign(obj, newParams, { mesh: obj.mesh, type: obj.type });
        }
    }
} 