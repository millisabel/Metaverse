import { BaseSetup } from '../utilsThreeD/baseSetup';
import { ExploreScene } from '../components/three/exploreScene';
import { Glow } from '../components/three/glow';
import { projectToBack } from '../utilsThreeD/utilsThreeD';

export class ExploreSetup extends BaseSetup {
    constructor() {
        super('explore-img', 'ExploreSetup', {
            camera: {
                fov: 75,
                position: { x: 0, y: 0, z: 80 },
                lookAt: { x: 0, y: 0, z: 0 }
            },
            renderer: {
                alpha: true,
                antialias: true
            }
        });   
    
        this.CONTAINER_TYPES = {
            EXPLORE_SCENE: 'EXPLORE_SCENE'
        };
        
        this.Z_INDEX = {
            SCENE: '0',
            GLOW: '-1'
        };

        this.COMMON_GLOW_PROPS = {
            pulse: { speed: 0.05, intensity: 0.05, sync: false },
            movement: { enabled: false },
            opacity: { min: 0.1, max: 0.9 },
            scale: { min: 0.8, max: 1.2 }
        };

        this.IMAGE_CONFIGS = [
            { file: './assets/images/explore_3D/objects/object_card1.png', size: { w: 2, h: 2 } },
            { file: './assets/images/explore_3D/objects/object_card2.png', size: { w: 2, h: 2 } },
            { file: './assets/images/explore_3D/objects/object_money.png', size: { w: 1, h: 1 } },
            { file: './assets/images/explore_3D/objects/object_link.png', size: { w: 1.5, h: 1.5 } },
            { file: './assets/images/explore_3D/objects/object_picture.png', size: { w: 1.8, h: 1.8 } }
        ];

        this.BOX_CONFIGS = [
            { color: 0x7A42F4, size: { w: 1, h: 0.2, d: 3 } },
            { color: 0x4642F4, size: { w: 0.7, h: 0.3, d: 2.5 } },
            { color: 0xF00AFE, size: { w: 1.2, h: 0.5, d: 4 } },
            { color: 0x56FFEB, size: { w: 0.5, h: 0.1, d: 2 } },
            { color: 0xe6cf12, size: { w: 1.5, h: 0.5, d: 4 } },
            { color: 0xff5722, size: { w: 0.4, h: 0.1, d: 2.5 } },
        ];

        this.CONFIG_GRID = {
            width: 4,
            height: 6,
            depth: 10,
            cellSize: 3,
            lineWidth: 1.5,
            borderLineWidth: 3,
            rightWallColor: 0x1e0b39,
            gridColor: 0x7F5CFF,
            frontBorderColor: 0xA18FFF,
            imageConfigs: this.IMAGE_CONFIGS,
            boxConfigs: this.BOX_CONFIGS
        };

        this.exploreScene = null;
        this.glow = null;
    }

    setupScene() {
        this.exploreScene = this.setupGrid(this.container, this.CONFIG_GRID);

        if (!this.exploreScene || !this.exploreScene.scene || !this.exploreScene.renderer) {
            console.error('ExploreScene or its scene/renderer is not initialized');
            return;
        }

        this.glow = new Glow(this.container, this.getGlowOptions());
    }

    getGlowOptions() {
        const gridWidth = this.CONFIG_GRID.width * this.CONFIG_GRID.cellSize;
        const gridHeight = this.CONFIG_GRID.height * this.CONFIG_GRID.cellSize;
        const gridDepth = this.CONFIG_GRID.depth * this.CONFIG_GRID.cellSize;
        const shrinkK = this.CONFIG_GRID.shrinkK || (1 / 3);
        const x_c = gridWidth / 2;
        const y_c = gridHeight / 2;
        const [backX, backY] = projectToBack(gridWidth / 2, gridHeight / 2, x_c, y_c, shrinkK);
        const gridOffset = { x: -gridWidth / 2, y: -gridHeight / 2, z: -45 };
        const offsetX = gridWidth * 0.7;

        const glowConfigs = [
            {
                color: 0xC06829,
                size: Math.max(gridWidth, gridHeight) * 2,
                position: { x: backX + gridOffset.x + offsetX, y: backY + gridOffset.y, z: -gridDepth + gridOffset.z - 1 },
                ...this.COMMON_GLOW_PROPS
            },
            {
                color: 0x7A42F4,
                size: Math.max(gridWidth, gridHeight) * 3,
                position: { x: backX + gridOffset.x + offsetX, y: backY + gridOffset.y, z: -gridDepth + gridOffset.z - 1 },
                ...this.COMMON_GLOW_PROPS
            },
            {
                color: 0xC94BFF,
                size: Math.max(gridWidth, gridHeight) * 4,
                position: { x: backX + gridOffset.x + offsetX, y: backY + gridOffset.y, z: -gridDepth + gridOffset.z - 2 },
                ...this.COMMON_GLOW_PROPS
            },
            {
                color: 0x7A42F4,
                size: Math.max(gridWidth, gridHeight) * 5,
                position: { x: backX + gridOffset.x + offsetX, y: backY + gridOffset.y, z: -gridDepth + gridOffset.z - 3 },
                ...this.COMMON_GLOW_PROPS
            }
        ];

        return {
            count: glowConfigs.length,
            colors: glowConfigs.map(g => g.color),
            size: { min: Math.min(...glowConfigs.map(g => g.size)), max: Math.max(...glowConfigs.map(g => g.size)) },
            opacity: { min: Math.min(...glowConfigs.map(g => g.opacity.min)), max: Math.max(...glowConfigs.map(g => g.opacity.max)) },
            scale: { min: Math.min(...glowConfigs.map(g => g.scale?.min ?? 1)), max: Math.max(...glowConfigs.map(g => g.scale?.max ?? 1)) },
            movement: glowConfigs[0].movement,
            initialPositions: glowConfigs.map(g => g.position)
        };
    }

    setupGrid(container, options) {
        const sceneInstance = new ExploreScene(container, options);
        if (typeof sceneInstance.initScene === 'function') {
            sceneInstance.initScene();
        }
        return sceneInstance;
    }

    update() {
        if (this.exploreScene) {
            this.exploreScene.update();
        }
        if (this.glow && typeof this.glow.update === 'function') {
            this.glow.update();
        }
    }

    cleanup() {
        if (this.exploreScene) {
            this.exploreScene.dispose();
            this.exploreScene = null;
        }
        if (this.glow && typeof this.glow.dispose === 'function') {
            this.glow.dispose();
            this.glow = null;
        }
        this.cleanupContainer(this.CONTAINER_TYPES.EXPLORE_SCENE);
        super.cleanup();
    }
}

export function initExplore() {
    const exploreSetup = new ExploreSetup();
    return exploreSetup;
}
