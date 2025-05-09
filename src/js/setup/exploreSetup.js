import { BaseSetup } from '../utilsThreeD/baseSetup';
import { ExploreScene } from '../components/three/exploreScene';
import { Glow } from '../components/three/glow';
import { projectToBack } from '../utilsThreeD/utilsThreeD';
import { AnimatedSVGScene } from '../components/three/AnimatedSVGScene';

export class ExploreSetup extends BaseSetup {
    constructor() {
        super('explore-img', 'ExploreSetup', {
            camera: {
                fov: 75,
                position: { x: 0, y: 0, z: 0 },
                lookAt: { x: 0, y: 0, z: 0 }
            },
            renderer: {
                alpha: true,
                antialias: true
            }
        });   
    
        this.CONTAINER_TYPES = {
            EXPLORE_SCENE: 'EXPLORE_SCENE',
            GLOW: 'GLOW',
            ANIMATED_SVG: 'ANIMATED_SVG'
        };
        
        this.Z_INDEX = {
            SCENE: '0',
            GLOW: '-1',
            ANIMATED_SVG: '-2'
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

        this.CONFIG_ANIMATED_SVG = {
            svgUrl: 'assets/images/explore_3D/grid_background.svg',
            svgOptions: {
                color: 0x7A42F4,
                opacity: 1,
                amp: 15,
                waveSpeed: 0.5,
                smoothRadius: 5,
                freq: 1
            }
        };

        this.exploreScene = null;
        this.glow = null;
        this.animatedSVG = null;
    }

    setupScene() {
        this.setupGrid();
        this.setupAnimatedSVG();
        this.setupGlow();
    }

    setupGrid() {
        const exploreSceneContainer = this.createContainer(
            this.CONTAINER_TYPES.EXPLORE_SCENE,
            this.Z_INDEX.SCENE
        );
        this.exploreScene = new ExploreScene(exploreSceneContainer, this.CONFIG_GRID);  
    }

    setupAnimatedSVG() {
        const animatedSVGContainer = this.createContainer(
            this.CONTAINER_TYPES.ANIMATED_SVG,
            this.Z_INDEX.ANIMATED_SVG
        );
        this.animatedSVG = new AnimatedSVGScene(animatedSVGContainer, this.CONFIG_ANIMATED_SVG);
    }

    setupGlow() {
        const glowContainer = this.createContainer(
            this.CONTAINER_TYPES.GLOW,
            this.Z_INDEX.GLOW
        );
        this.glow = new Glow(glowContainer, this.getGlowOptions());
    }

    getGlowOptions() {

        const COMMON_GLOW_PROPS = {
            movement: { enabled: false },
            opacity: { min: 0.1, max: 0.9 }
        };

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
                color: 0xFFFFFF,
                size: Math.max(gridWidth, gridHeight) * 1,
                position: { 
                    x: backX + gridOffset.x + offsetX, 
                    y: backY + gridOffset.y, 
                    z: -gridDepth + gridOffset.z - 1 },
                    scale: { min: 0.5, max: 3 },
                    pulse: { speed: 0.1, intensity: 1, sync: false },
            },
            {
                color: 0xF00AFE,
                size: Math.max(gridWidth, gridHeight) * 2,
                position: { 
                    x: backX + gridOffset.x + offsetX - 1, 
                    y: backY + gridOffset.y + 1, 
                    z: -gridDepth + gridOffset.z - 2 },
                    scale: { min: 1, max: 1.5 },
                    pulse: { speed: 0.2, intensity: 1.5, sync: false },
            },
            {
                color: 0x7A42F4,
                size: Math.max(gridWidth, gridHeight) * 3,
                position: { 
                    x: backX + gridOffset.x + offsetX, 
                    y: backY + gridOffset.y, 
                    z: -gridDepth + gridOffset.z - 1 },
                    scale: { min: 1, max: 1.2 },
                    pulse: { speed: 0.5, intensity: 2, sync: false },
            }
        ];
        const mergedGlowConfigs = glowConfigs.map(cfg => ({
            ...COMMON_GLOW_PROPS,
            ...cfg
        }));
        return {glowConfigs: mergedGlowConfigs};
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
