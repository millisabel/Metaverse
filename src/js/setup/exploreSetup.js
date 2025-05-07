import { BaseSetup } from '../utilsThreeD/baseSetup';
import { ExploreScene } from '../components/three/exploreScene';
import { isMobile } from '../utils/utils';

export class ExploreSetup extends BaseSetup {
    constructor() {
        super('explore-img', 'ExploreSetup', {
            camera: {
                fov: 75,
                position: { x: 0, y: 0, z: 80 },
                lookAt: { x: 0, y: 0, z: -30 }
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
            SCENE: '0'
        };

        this.exploreScene = null;
    }

    /**
     * Реализация метода setupScene для инициализации ExploreScene
     */
    setupScene() {
        // Создаём экземпляр ExploreScene, передаём контейнер и опции
        this.exploreScene = new ExploreScene(this.container, {
            gridWidth: 4,
            gridHeight: 6,
            gridDepth: 10,
            cellSize: 3,
            lineColor: '#A259FF',
            lineWidth: 1.5,
            borderLineWidth: 3
        });
    }

    update() {
        if (this.exploreScene) {
            this.exploreScene.update();
        }
    }

    cleanup() {
        if (this.exploreScene) {
            this.exploreScene.dispose();
            this.exploreScene = null;
        }
        this.cleanupContainer(this.CONTAINER_TYPES.EXPLORE_SCENE);
        super.cleanup();
    }
}

export function initExplore() {
    const exploreSetup = new ExploreSetup();
    return exploreSetup;
}
