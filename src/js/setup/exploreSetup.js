import { SectionController } from '../controllers/SectionController';
import { ExploreScene } from '../components/three/exploreScene';
import { Glow } from '../components/three/glow';
import { projectToBack } from '../utilsThreeD/utilsThreeD';
import { AnimatedSVGScene } from '../components/three/AnimatedSVGScene';

const SECTION_ID = 'explore';

const Z_INDEX = {
    SECTION: 0,
    GLOW: -1,
    EXPLORE_SCENE: 1,
};
const NAME_3D_OBJECTS = {
    GLOW: 'EXPLORE_GLOW',
    ANIMATED_SVG: 'ANIMATED_SVG',
    EXPLORE_SCENE: 'EXPLORE_SCENE'
};  


const CONFIG_EXPLORE = {
    GLOW: {
        classRef: Glow,
        containerName: SECTION_ID,
        zIndex: Z_INDEX.GLOW, 
        objectConfig: {
            objectOptions: {
                movement: { enabled: false },
                opacity: { min: 0.1, max: 0.9 }
            }
        }
    },
    EXPLORE_SCENE: {
        classRef: ExploreScene,
        containerName: 'explore-3d',
        zIndex: Z_INDEX.EXPLORE_SCENE,
        objectConfig: {
            
        }
    }
};

export class ExploreSetup extends SectionController {
    constructor() {
        super(SECTION_ID, CONFIG_EXPLORE, Z_INDEX.SECTION);   

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
    }

    // setupScene() {
    //     this.setupGrid();
    //     this.setupAnimatedSVG();
    //     this.setupGlow();
    // }

    // setupGrid() {
    //     const exploreSceneContainer = this.createContainer(
    //         this.CONTAINER_TYPES.EXPLORE_SCENE,
    //         this.Z_INDEX.SCENE
    //     );
    //     this.exploreScene = new ExploreScene(exploreSceneContainer, this.CONFIG_GRID);  
    // }

    // setupAnimatedSVG() {
    //     const animatedSVGContainer = this.createContainer(
    //         this.CONTAINER_TYPES.ANIMATED_SVG,
    //         this.Z_INDEX.ANIMATED_SVG
    //     );
    //     this.animatedSVG = new AnimatedSVGScene(animatedSVGContainer, this.CONFIG_ANIMATED_SVG);
    // }

    // setupGlow() {
    //     const glowContainer = this.createContainer(
    //         this.CONTAINER_TYPES.GLOW,
    //         this.Z_INDEX.GLOW
    //     );
    //     this.glow = new Glow(glowContainer, this.getGlowOptions());
    // }

    // getGlowOptions() {

    //     const COMMON_GLOW_PROPS = {
    //         movement: { enabled: false },
    //         opacity: { min: 0.1, max: 0.9 }
    //     };

    //     const gridWidth = this.CONFIG_GRID.width * this.CONFIG_GRID.cellSize;
    //     const gridHeight = this.CONFIG_GRID.height * this.CONFIG_GRID.cellSize;
    //     const gridDepth = this.CONFIG_GRID.depth * this.CONFIG_GRID.cellSize;
    //     const shrinkK = this.CONFIG_GRID.shrinkK || (1 / 3);
    //     const x_c = gridWidth / 2;
    //     const y_c = gridHeight / 2;
    //     const [backX, backY] = projectToBack(gridWidth / 2, gridHeight / 2, x_c, y_c, shrinkK);
    //     const gridOffset = { x: -gridWidth / 2, y: -gridHeight / 2, z: -45 };
    //     const offsetX = gridWidth * 0.7;

    //     const glowConfigs = [
    //         {
    //             color: 0xFFFFFF,
    //             size: Math.max(gridWidth, gridHeight) * 1,
    //             position: { 
    //                 x: backX + gridOffset.x + offsetX, 
    //                 y: backY + gridOffset.y, 
    //                 z: -gridDepth + gridOffset.z - 1 },
    //                 scale: { min: 0.5, max: 3 },
    //                 pulse: { speed: 0.1, intensity: 1, sync: false },
    //         },
    //         {
    //             color: 0xF00AFE,
    //             size: Math.max(gridWidth, gridHeight) * 2,
    //             position: { 
    //                 x: backX + gridOffset.x + offsetX - 1, 
    //                 y: backY + gridOffset.y + 1, 
    //                 z: -gridDepth + gridOffset.z - 2 },
    //                 scale: { min: 1, max: 1.5 },
    //                 pulse: { speed: 0.2, intensity: 1.5, sync: false },
    //         },
    //         {
    //             color: 0x7A42F4,
    //             size: Math.max(gridWidth, gridHeight) * 3,
    //             position: { 
    //                 x: backX + gridOffset.x + offsetX, 
    //                 y: backY + gridOffset.y, 
    //                 z: -gridDepth + gridOffset.z - 1 },
    //                 scale: { min: 1, max: 1.2 },
    //                 pulse: { speed: 0.5, intensity: 2, sync: false },
    //         }
    //     ];
    //     const mergedGlowConfigs = glowConfigs.map(cfg => ({
    //         ...COMMON_GLOW_PROPS,
    //         ...cfg
    //     }));
    //     return {glowConfigs: mergedGlowConfigs};
    // }

    // update() {
    //     if (this.exploreScene) {
    //         this.exploreScene.update();
    //     }
    //     if (this.glow && typeof this.glow.update === 'function') {
    //         this.glow.update();
    //     }
    // }

    // cleanup() {
    //     if (this.exploreScene) {
    //         this.exploreScene.dispose();
    //         this.exploreScene = null;
    //     }
    //     if (this.glow && typeof this.glow.dispose === 'function') {
    //         this.glow.dispose();
    //         this.glow = null;
    //     }
    //     this.cleanupContainer(this.CONTAINER_TYPES.EXPLORE_SCENE);
    //     super.cleanup();
    // }
}
