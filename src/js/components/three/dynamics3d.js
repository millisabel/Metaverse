import * as THREE from 'three';
import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createLogger } from '../../utils/logger';

export class Dynamics3D extends AnimationController {
    constructor(container, options = {}) {
        super(container, options);

        this.name = 'Dynamics3D';
        this.logger = createLogger(this.name);
    }

    setupScene() {
        this.logger.log('Setting up stars scene', {
            conditions: ['setup-scene'],
            functionName: 'setupScene'
        });
    }

    update() {
        this.logger.log('Updating dynamics 3D scene', {
            conditions: ['update'],
            functionName: 'update'
        });
    }

    cleanup() {
        this.logger.log('Cleaning up dynamics 3D scene', {
            conditions: ['cleanup'],
            functionName: 'cleanup'
        });
    }
}