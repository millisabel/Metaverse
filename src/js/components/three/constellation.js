import * as THREE from 'three';

import constellationsData from '../../data/constellations.json';

import { AnimationController } from '../../utilsThreeD/animationController_3D';
import { createCanvas, updateRendererSize } from '../../utilsThreeD/canvasUtils';
import { createStarTexture } from '../../utilsThreeD/textureUtils';
import { createLogger } from "../../utils/logger";
import { ThreeDContainerManager } from '../../utilsThreeD/ThreeDContainerManager';
import { addDefaultLights } from '../../utilsThreeD/utilsThreeD';

class ConstellationGroup {
    constructor(data, starTexture) {
        this.group = new THREE.Group();
        this.data = data;
        this.stars = [];
        this.activeStarIndex = Math.floor(Math.random() * this.data.stars.length);
        this.nextStarIndex = this.getNextStarIndex();
        this.transitionProgress = 0;
        this.changeSpeed = 0.2 + Math.random() * 0.3;
        this.animationSpeed = 0.2 + Math.random() * 0.3;
        
        // Parameters for Z movement
        this.zSpeed = 0.01 + Math.random() * 0.015;
        this.zAmplitude = 3 + Math.random() * 2;
        this.zPhase = Math.random() * Math.PI * 2;
        
        // Distance constraints
        this.maxDistance = -150;
        this.minDistance = -10;

        // Parameters for rotation
        this.rotationSpeed = {
            x: (0.0005 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
            y: (0.0005 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
            z: (0.0005 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1)
        };
        this.targetRotationSpeed = { ...this.rotationSpeed };
        this.rotationChangeTime = 20 + Math.random() * 20;
        this.rotationTimer = 0;
        this.rotationTransitionProgress = 0;

        // Parameters for orbital movement
        this.orbitSpeed = 0.015 + Math.random() * 0.01;
        this.orbitRadius = 50 + Math.random() * 60;
        this.orbitPhase = Math.random() * Math.PI * 2;
        
        // Parameters for additional canvas movement
        this.canvasSpeed = 0.005 + Math.random() * 0.005;
        this.canvasRadius = 100 + Math.random() * 100;
        this.canvasPhase = Math.random() * Math.PI * 2;
        
        // Save base positions for scaling
        this.baseX = this.data.basePosition.x;
        this.baseY = this.data.basePosition.y;

        // Parameters for avoiding collisions
        this.avoidanceRadius = 100;
        this.avoidanceSpeed = 0.1;
        this.avoidanceForce = new THREE.Vector3();

        // Parameters for screen movement constraints
        this.screenBounds = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.maxScreenDistance = 200;
        
        this.init(starTexture);
    }

    getNextStarIndex() {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.data.stars.length);
        } while (nextIndex === this.activeStarIndex);
        return nextIndex;
    }

    createConnectionLines() {
        this.data.connections.forEach(connection => {
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: new THREE.Color(this.data.color),
                transparent: true, 
                opacity: 0.2,
                linewidth: 2
            });

            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                this.stars[connection[0]].position,
                this.stars[connection[1]].position
            ]);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.group.add(line);
        });
    }

    updateRotation() {
        this.rotationTimer += 0.016;
        this.rotationTransitionProgress += 0.01;
        
        if (this.rotationTimer >= this.rotationChangeTime) {
            this.targetRotationSpeed = {
                x: (0.0005 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
                y: (0.0005 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1),
                z: (0.0005 + Math.random() * 0.0005) * (Math.random() > 0.5 ? 1 : -1)
            };
            this.rotationTimer = 0;
            this.rotationTransitionProgress = 0;
            this.rotationChangeTime = 20 + Math.random() * 20;
        }

        if (this.rotationTransitionProgress < 1) {
            this.rotationSpeed.x = THREE.MathUtils.lerp(
                this.rotationSpeed.x,
                this.targetRotationSpeed.x,
                this.rotationTransitionProgress
            );
            this.rotationSpeed.y = THREE.MathUtils.lerp(
                this.rotationSpeed.y,
                this.targetRotationSpeed.y,
                this.rotationTransitionProgress
            );
            this.rotationSpeed.z = THREE.MathUtils.lerp(
                this.rotationSpeed.z,
                this.targetRotationSpeed.z,
                this.rotationTransitionProgress
            );
        }

        this.group.rotation.x += this.rotationSpeed.x;
        this.group.rotation.y += this.rotationSpeed.y;
        this.group.rotation.z += this.rotationSpeed.z;
    }

    init(starTexture) {
        this.data.stars.forEach(starData => {
            const position = new THREE.Vector3(
                starData.x,
                starData.y,
                starData.z
            );
            const starMaterial = new THREE.PointsMaterial({
                color: this.data.color || 0xFFFFFF,
                size: 0.5,
                map: starTexture,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });

            const starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute([position.x, position.y, position.z], 3));

            const star = new THREE.Points(starGeometry, starMaterial);
            this.stars.push({
                position,
                mesh: star,
                baseSize: 0.5,
                currentSize: 0.5
            });
            this.group.add(star);
        });

        // Create connections between stars
        this.createConnectionLines();

        // Set initial position of the group
        this.group.position.set(
            this.data.basePosition.x,
            this.data.basePosition.y,
            this.data.basePosition.z
        );
    }

    checkCollision(otherConstellation) {
        const distance = this.group.position.distanceTo(otherConstellation.group.position);
        return distance < this.avoidanceRadius;
    }

    updateAvoidanceForce(otherConstellations) {
        this.avoidanceForce.set(0, 0, 0);
        let collisionCount = 0;

        otherConstellations.forEach(other => {
            if (other !== this && this.checkCollision(other)) {
                const direction = new THREE.Vector3()
                    .subVectors(this.group.position, other.group.position)
                    .normalize();
                
                const distance = this.group.position.distanceTo(other.group.position);
                const force = (this.avoidanceRadius - distance) / this.avoidanceRadius;
                
                this.avoidanceForce.add(direction.multiplyScalar(force));
                collisionCount++;
            }
        });

        if (collisionCount > 0) {
            this.avoidanceForce.divideScalar(collisionCount);
            this.avoidanceForce.multiplyScalar(this.avoidanceSpeed);
        }
    }

    update(time, otherConstellations) {
        // Update transitions between active stars
        this.transitionProgress += this.changeSpeed * 0.01;

        if (this.transitionProgress >= 1) {
            this.transitionProgress = 0;
            this.activeStarIndex = this.nextStarIndex;
            this.nextStarIndex = this.getNextStarIndex();
        }

        // Update movement in space
        const progress = (Math.sin(time * this.zSpeed + this.zPhase) + 1) / 2;
        const zPosition = this.minDistance + (this.maxDistance - this.minDistance) * progress;
        const scaleFactor = Math.pow(Math.abs(zPosition / this.maxDistance), 0.7);

        this.group.position.z = zPosition;

        this.updateRotation(time);

        const orbitX = Math.cos(time * this.orbitSpeed + this.orbitPhase) * this.orbitRadius * scaleFactor;
        const orbitY = Math.sin(time * this.orbitSpeed + this.orbitPhase) * this.orbitRadius * scaleFactor;
        const canvasX = Math.cos(time * this.canvasSpeed + this.canvasPhase) * this.canvasRadius * scaleFactor;
        const canvasY = Math.sin(time * this.canvasSpeed + this.canvasPhase) * this.canvasRadius * scaleFactor;

        // Calculation of position taking all movements into account
        let currentX = (this.baseX + orbitX + canvasX) * scaleFactor;
        let currentY = (this.baseY + orbitY + canvasY) * scaleFactor;

        // Movement restriction
        const depthFactor = Math.abs(zPosition / this.maxDistance);
        const maxAllowedDistance = this.maxScreenDistance * depthFactor;
        const distanceFromCenter = Math.sqrt(currentX * currentX + currentY * currentY);

        if (distanceFromCenter > maxAllowedDistance) {
            const scale = maxAllowedDistance / distanceFromCenter;
            currentX *= scale;
            currentY *= scale;
        }

        this.group.position.x = currentX;
        this.group.position.y = currentY;

        this.updateAvoidanceForce(otherConstellations);
        this.group.position.add(this.avoidanceForce);

        // Update sizes and transparency of stars
        this.stars.forEach((star, index) => {
            const isCurrentActive = index === this.activeStarIndex;
            const isNextActive = index === this.nextStarIndex;

            if (isCurrentActive) {
                star.mesh.material.size = star.baseSize + Math.sin(time * this.animationSpeed) * 0.5;
                star.mesh.material.opacity = 0.8 * (1 - this.transitionProgress);
            } else if (isNextActive) {
                star.mesh.material.size = star.baseSize + Math.sin(time * this.animationSpeed) * 0.5;
                star.mesh.material.opacity = 0.8 * this.transitionProgress;
            } else {
                star.mesh.material.size = star.baseSize;
                star.mesh.material.opacity = 0.4;
            }
        });
    }
}

export class Constellation extends AnimationController {
    constructor(container) {
        super(container, {
            camera: {
                fov: 75,
                near: 0.1,
                far: 1000,
                position: { x: 0, y: 0, z: 0 },
                lookAt: { x: 0, y: 0, z: -1 },
                rotation: false,
                speed: { x: 0, y: 0 }
            },
            renderer: {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            }
        });
        this.constellations = [];
        this.backgroundStars = null;
        this.frame = 0;
        this.name = 'Constellation';
        this.logger = createLogger(this.name);
        this.CONTAINER_TYPE = 'ABOUT_CONSTELLATION';
        this.Z_INDEX = '2';
    }

    setupScene() {
        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'setupScene'
        });

        // Добавляем свет через утилиту
        addDefaultLights(this.scene, {
            ambientColor: 0xffffff,
            ambientIntensity: 0.7,
            pointColor: 0xffffff,
            pointIntensity: 1.5,
            pointPosition: { x: 0, y: 10, z: 10 }
        });

        const starTexture = createStarTexture();
        constellationsData.forEach((data) => {
            const constellationGroup = new ConstellationGroup(data, starTexture);
            this.scene.add(constellationGroup.group);
            this.constellations.push(constellationGroup);
        });

        // Add fog for depth effect
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);
    }

    cleanup() {
        this.constellations = [];
        this.backgroundStars = null;
        super.cleanup();
    }

    update() {
        if (!this.canAnimate()) {
            return;
        }

        if (!this.animationFrameId) {
            this.logger.log('Starting update cycle', {
                conditions: ['running'],
                functionName: 'update',
                trackType: 'animation'
            });
        }

        if (this.frame % 2 === 0) {
            const time = Date.now() * 0.001;
            if (this.constellations) {
                this.constellations.forEach(constellation => {
                    constellation.update(time, this.constellations.filter(c => c !== constellation));
                });
            }
        }
        this.frame++;
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

export function initConstellation() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) {
        console.warn('About section not found');
        return;
    }

    const constellationManager = new ThreeDContainerManager(aboutSection, { 
        type: 'ABOUT_CONSTELLATION',
        zIndex: '2'
    });
    const constellationContainer = constellationManager.create();

    return new Constellation(constellationContainer);
} 