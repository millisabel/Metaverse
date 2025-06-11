import * as THREE from 'three';

import constellationsData from '../../data/constellations.json';

import { Object_3D_Observer_Controller } from '../../controllers/Object_3D_Observer_Controller';
import { createStarTexture } from '../../utilsThreeD/textureUtils';
import { createLogger } from "../../utils/logger";

/**
 * @param {Object} options
 * @param {number} options.countConstellations - count of constellations
 */
const DEFAULT_OPTIONS = {
    countConstellations: constellationsData.length,  
    constellation: {
        distance: {
            max: -100,
            min: -10,
        },
        screen: {
            max: 50,
        },
    },
    stars: {
        size: 0.5,
        opacity: 0.8,
        activeSize: 2,
        nextSize: 1,
        pulseAmplitude: 1,
        pulseSpeed: 0.1,
        transitionSpeed: 0.02,
    },
};

/**
 * @param {Object} data
 * @param {Object} data.basePosition - base position of the constellation
 * @param {Object} data.stars - stars of the constellation
 * @param {Object} data.connections - connections between stars
 * @param {Object} data.color - color of the constellation
 */
class ConstellationGroup {
    constructor(data, starTexture, optionsConstellation, optionsStars) {
        this.optionsConstellation = optionsConstellation;
        this.optionsStars = optionsStars;

        this.group = new THREE.Group();
        this.data = data;
        this.stars = [];
        this.activeStarIndex = Math.floor(Math.random() * this.data.stars.length);
        this.nextStarIndex = this.getNextStarIndex();
        this.transitionProgress = 0;
        this.changeSpeed = this.optionsStars.transitionSpeed || 0.02;
        this.animationSpeed = this.optionsStars.pulseSpeed || 0.3;
        
        // Parameters for Z movement
        this.zSpeed = 0.01 + Math.random() * 0.015;
        this.zAmplitude = 3 + Math.random() * 2;
        this.zPhase = Math.random() * Math.PI * 2;
        
        // Distance constraints
        this.maxDistance = this.optionsConstellation.distance.max;
        this.minDistance = this.optionsConstellation.distance.min;

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
        this.canvasRadius = 100 + Math.random() *100;
        this.canvasPhase = Math.random() * Math.PI * 2;
        
        // Save base positions for scaling
        this.baseX = this.data.basePosition.x;
        this.baseY = this.data.basePosition.y;

        // Parameters for avoiding collisions
        this.avoidanceRadius = 50;
        this.avoidanceSpeed = 0.1;
        this.avoidanceForce = new THREE.Vector3();

        // Parameters for screen movement constraints
        this.screenBounds = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.maxScreenDistance = this.optionsConstellation.screen.max;
        
        this.init(starTexture);
    }

    /**
     * @description Initialize the constellation
     * @param {Object} starTexture
     */
    init(starTexture) {
        this.data.stars.forEach(starData => {
            const position = new THREE.Vector3(
                starData.x,
                starData.y,
                starData.z
            );
            const starMaterial = new THREE.PointsMaterial({
                color: this.data.color || 0xFFFFFF,
                size: this.optionsStars.size,
                map: starTexture,
                transparent: true,
                opacity: this.optionsStars.opacity,
                blending: THREE.AdditiveBlending
            });

            const starGeometry = new THREE.BufferGeometry();
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute([position.x, position.y, position.z], 3));

            const star = new THREE.Points(starGeometry, starMaterial);
            this.stars.push({
                position,
                mesh: star,
                baseSize: this.optionsStars.size,
                currentSize: this.optionsStars.size
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

    /**
     * @description Get the next star index
     * @returns {number}
     */
    getNextStarIndex() {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.data.stars.length);
        } while (nextIndex === this.activeStarIndex);
        return nextIndex;
    }

    /**
     * @description Create connection lines
     * @returns {void}
     */
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

    /**
     * @description Update rotation
     * @returns {void}
     */
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

    /**
     * @description Check collision
     * @param {Object} otherConstellation
     * @returns {boolean}
     */
    checkCollision(otherConstellation) {
        const distance = this.group.position.distanceTo(otherConstellation.group.position);
        return distance < this.avoidanceRadius;
    }

    /**
     * @description Update avoidance force
     * @param {Object} otherConstellations
     * @returns {void}
     */
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

    /**
     * @description Update the constellation
     * @param {number} time
     * @param {Object} otherConstellations
     * @returns {void}
     */
    update(time, otherConstellations) {
        // Update transitions between active stars
        this.transitionProgress += this.changeSpeed;

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
                // Smoother pulse using easing function
                const pulse = (Math.sin(time * this.animationSpeed) + 1) / 2; // 0 to 1
                const smoothPulse = this._easeInOutCubic(pulse);
                star.mesh.material.size = star.baseSize + smoothPulse * this.optionsStars.pulseAmplitude;
                star.mesh.material.opacity = this.optionsStars.opacity * (1 - this.transitionProgress);
            } else if (isNextActive) {
                // Smoother pulse for next star
                const pulse = (Math.sin(time * this.animationSpeed) + 1) / 2;
                const smoothPulse = this._easeInOutCubic(pulse);
                star.mesh.material.size = star.baseSize + smoothPulse * this.optionsStars.pulseAmplitude;
                star.mesh.material.opacity = this.optionsStars.opacity * this.transitionProgress;
            } else {
                star.mesh.material.size = star.baseSize;
                star.mesh.material.opacity = this.optionsStars.opacity * 0.5; // Half opacity for inactive stars
            }
        });
    }

    /**
     * @description Ease-in-out cubic function for smooth transitions
     * @param {number} x - Input value (0-1)
     * @returns {number} - Smoothed value (0-1)
     */
    _easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
}

/**
 * @param {Object} container
 * @param {Object} options
 * @param {Object} options.countConstellations - count of constellations
 */
export class Constellation extends Object_3D_Observer_Controller {
    constructor(container, options = {}) {
        super(container, options, DEFAULT_OPTIONS);

        this.name = this.constructor.name;
        this.logger = createLogger(this.name);

        this.constellations = [];
        this.frame = 0;
        this.starTexture = null;  // Store texture reference
    }

    /**
     * @description Setup the scene
     * @returns {void}
     */
    async setupScene() {
        this.logMessage = `${this.constructor.name} setupScene \n`;
        this._createConstellations();
        this.setupLights(this.options.lights);
        this.logMessage = `${this.constructor.name} setupScene completed \n`;
    }

    /**
     * @description On resize
     * @returns {void}
     */
    onResize() {    
        this.logMessage = `${this.constructor.name} onResize \n`;
        super.onResize();
        this.logMessage = `${this.constructor.name} onResize completed \n`;
    }   

    /**
     * @description Update the animation
     * @returns {void}
     */
    update() {

        if (this.frame % 2 === 0) {
            const time = Date.now() * 0.001;
            if (this.constellations) {
                this.constellations.forEach(constellation => {
                    constellation.update(time, this.constellations.filter(c => c !== constellation));
                });
            }
        }
        this.frame++;

        super.update();
    }

    /**
     * @description Cleanup the scene
     * @returns {void}
     */
    cleanup() {
        this.logMessage = 
            `${this.constructor.name} starting cleanup \n` + 
            `---------------------------------------\n`;

        if (this.constellations && Array.isArray(this.constellations)) {
            this.constellations.forEach(constellationGroup => {
                if (constellationGroup.stars && Array.isArray(constellationGroup.stars)) {
                    constellationGroup.stars.forEach(starObj => {
                        if (starObj.mesh) {
                            starObj.mesh.geometry?.dispose();
                            starObj.mesh.material?.dispose();
                        }
                    });
                }
                if (constellationGroup.group && constellationGroup.group.children) {
                    constellationGroup.group.children.forEach(child => {
                        if (child.type === 'Line') {
                            child.geometry?.dispose();
                            child.material?.dispose();
                        }
                    });
                }
            });
        }

        this.constellations = [];

        // Dispose star texture
        if (this.starTexture) {
            this.starTexture.dispose();
            this.starTexture = null;
        }

        this.logMessage += 
            `mesh disposed \n` + 
            `geometry disposed \n` + 
            `texture disposed \n` +
            `this.constellations ${this.constellations} \n`;

        super.cleanup();

        this.logMessage += `${this.constructor.name} cleanup completed \n`;
    }

    /**
     * @description Create constellations
     * @returns {void}
     */
    _createConstellations() {
        this.logMessage = `${this.constructor.name} _createConstellations \n`;

        // Create texture only once
        if (!this.starTexture) {
            this.starTexture = createStarTexture();
        }

        const count = this.options.countConstellations || constellationsData.length;
        const dataToUse = constellationsData.slice(0, count);
        console.log('data:', dataToUse.length);
        dataToUse.forEach((data) => {
            const constellationGroup = new ConstellationGroup(data, this.starTexture, this.options.constellation, this.options.stars);
            this.scene.add(constellationGroup.group);
            this.constellations.push(constellationGroup);
        });

        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);
        
        this.logMessage = `${this.constructor.name} _createConstellations completed \n`;
    }
}
