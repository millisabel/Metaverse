import { BaseSetup } from '../utilsThreeD/baseSetup';
import { ExploreScene } from '../components/three/exploreScene';
import { SingleGlow  } from '../components/three/singleGlow';
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
            rightWallColor: 0x0B061B,
        }

        this.CONFIG_GLOW = {
            color: 0x7A42F4,
            size: 6,
            opacity: { min: 0.1, max: 0.9 },
            position: { x: 0, y: 0, z: 0 },
            pulse: { speed: 0, intensity: 0, sync: false },
            width: 50,
            height: 50,
            depth: 50,
            movement: { enabled: false },
            scale: { min: 0.5, max: 1.2 }
        }

        this.exploreScene = null;
        this.glow = null;
    }

    setupScene() {
        this.exploreScene = this.setupGrid(this.container, this.CONFIG_GRID);

        if (!this.exploreScene || !this.exploreScene.scene || !this.exploreScene.renderer) {
            console.error('ExploreScene or its scene/renderer is not initialized');
            return;
        }

        const gridWidth = this.CONFIG_GRID.width * this.CONFIG_GRID.cellSize;
        const gridHeight = this.CONFIG_GRID.height * this.CONFIG_GRID.cellSize;
        const gridDepth = this.CONFIG_GRID.depth * this.CONFIG_GRID.cellSize;
        const shrinkK = this.CONFIG_GRID.shrinkK || (1 / 3);
        const x_c = gridWidth / 2;
        const y_c = gridHeight / 2;
        const [backX, backY] = projectToBack(gridWidth / 2, gridHeight / 2, x_c, y_c, shrinkK);
        const gridOffset = { x: -gridWidth / 2, y: -gridHeight / 2, z: -45 };
        const offsetX = gridWidth * 0.2; // смещение вправо на 25% ширины задней стороны
        const glowPosition = {
            x: backX + gridOffset.x + offsetX,
            y: backY + gridOffset.y,
            z: -gridDepth + gridOffset.z - 1
        };
        const glowSize = Math.max(gridWidth, gridHeight) * 5;
        const glowOptions = {
            ...this.CONFIG_GLOW,
            position: glowPosition,
            size: glowSize
        };
        this.setupGlow(
            this.exploreScene.scene,
            this.exploreScene.renderer,
            this.container,
            glowOptions
        );
    }

    setupGrid(container, options) {
        const sceneInstance = new ExploreScene(container, options);
        if (typeof sceneInstance.initScene === 'function') {
            sceneInstance.initScene();
        }
        return sceneInstance;
    }

    setupGlow(scene, renderer, container, options) {
        this.glow = new SingleGlow (scene, renderer, container, options
        );
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
