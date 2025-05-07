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

        this.CONFIG_GRID = {
            width: 4,
            height: 6,
            depth: 10,
            cellSize: 3,
            lineWidth: 1.5,
            borderLineWidth: 3,
            rightWallColor: 0x14092b,
        };

        this.COMMON_GLOW_PROPS = {
            pulse: { speed: 0, intensity: 0, sync: false },
            movement: { enabled: false },
            opacity: { min: 0.1, max: 0.9 },
            scale: { min: 1, max: 1 }
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
        const offsetX = gridWidth * 0.5;

        const glowConfigs = [
            {
                color: 0x7A42F4,
                size: Math.max(gridWidth, gridHeight) * 2,
                position: { x: backX + gridOffset.x + offsetX, y: backY + gridOffset.y, z: -gridDepth + gridOffset.z - 1 },
                ...this.COMMON_GLOW_PROPS
            },
            {
                color: 0xC94BFF,
                size: Math.max(gridWidth, gridHeight) * 3,
                position: { x: backX + gridOffset.x + offsetX, y: backY + gridOffset.y, z: -gridDepth + gridOffset.z - 2 },
                ...this.COMMON_GLOW_PROPS
            },
            {
                color: 0x7A42F4,
                size: Math.max(gridWidth, gridHeight) * 4,
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
            pulse: glowConfigs[0].pulse,
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
