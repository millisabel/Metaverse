import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { AnimatedSVGMesh } from './AnimatedSVGMesh';

export class AnimatedSVGScene extends AnimationController {
    constructor(container, options = {}) {
        super(container, options);
        this.animatedSVG = null;
    }

    setupScene() {
        // Создаём и добавляем SVG-меш
        console.log("setupScene");
        this.animatedSVG = new AnimatedSVGMesh(
            this.options.svgUrl,
            {
                color: this.options.color || 0xff00ff,
                opacity: this.options.opacity || 1,
                container: this.container
            }
        );
        this.animatedSVG.position.set(0, 0, 0);
        this.animatedSVG.scale.set(10, 10, 10);
        this.scene.add(this.animatedSVG);

        // Камера по умолчанию
        this.camera.position.set(0, 0, 150); 
        this.camera.lookAt(0, 0, 0); 
        this.camera.updateProjectionMatrix();

        console.log('[Camera] Position:', this.camera.position);
        console.log('[Camera] LookAt:', { x: 0, y: 0, z: 0 });
    }

    update(delta) {
        if (this.animatedSVG) {
            this.animatedSVG.update(delta);
        }
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    dispose() {
        console.log("dispose");
        // Очистка ресурсов
        if (this.animatedSVG) {
            this.scene.remove(this.animatedSVG);
            // ...очистка геометрии/материалов
        }
        super.dispose();
    }
}


