
import { BaseSetup } from '../utilsThreeD/baseSetup';
import { createLogger } from '../utils/logger';

export class Universal3DSection extends BaseSetup {
    constructor(containerId, objects3D) {
        super(containerId);

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        
        this.objects3D = objects3D;
        this.controllers = {};

        for (const [key, params] of Object.entries(objects3D)) {
            this.controllers[key] = this.create3DController(key, params);
        }
    }
  
    async setupScene() {

        this.logger.log({
            functionName: 'setupScene',
            conditions: ['init'],
            customData: {
                this: this
            }
        });

        for (const controller of Object.values(this.controllers)) {
          if (controller && typeof controller.init === 'function') {
            await controller.init();
          }
        }
      }

    create3DController(type, params) {
        const containerName = params.containerName || type;
        const zIndex = params.zIndex || 1;
        const container = this.createContainer(containerName, zIndex);

        if (!params.classRef) {
            throw new Error(`classRef is not specified for 3D object "${key}"`);
        }

        this.logger.log({
            type: 'success',
            functionName: 'create3DController',
            conditions: ['created'],
            customData: {
                this: this,
                type: type,
                params: params
            }
        });
    
        return new params.classRef(container, params);
    }

    onResize() {
        Object.values(this.controllers).forEach(ctrl => {
            if (ctrl && typeof ctrl.onResize === 'function') {
                ctrl.onResize();
            }
        });
    }

    update() {
    for (const controller of Object.values(this.controllers)) {
            if (controller && typeof controller.update === 'function') {
                controller.update();
            }
        }
    }

    cleanup() {
    for (const controller of Object.values(this.controllers)) {
        let logMessage = `starting cleanup in ${this.constructor.name}\n`;

        if (controller && typeof controller.cleanup === 'function') {
            logMessage += `controller: ${this.controllers}\n`;
            controller.cleanup(logMessage);
            }
        }
    }
  }