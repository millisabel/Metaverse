import * as THREE from 'three';

import { AnimationController } from '../../utils/animationController_3D';
import { createCanvas, updateRendererSize } from '../../utils/canvasUtils';
import constellationsData from '../../data/constellations.json';
import { createStarTexture } from '../../utils/textureUtils';
import {createLogger} from "../../utils/logger";
import { ContainerManager } from '../../utils/containerManager';

class Star {
    constructor(position, texture) {
        this.position = position;
        this.baseSize = 0.5;
        this.currentSize = this.baseSize;
        this.mesh = this.createMesh(texture);
        this.glowMesh = this.createGlowMesh(texture);
    }

    createMesh(texture) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute([this.currentSize], 1));

        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: this.currentSize,
            map: texture,
            transparent: true,
            opacity: 0.8
        });

        const mesh = new THREE.Points(geometry, material);
        mesh.position.copy(this.position);
        return mesh;
    }

    createGlowMesh(texture) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute([this.currentSize * 2], 1));

        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: this.currentSize * 2,
            map: texture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        const mesh = new THREE.Points(geometry, material);
        mesh.position.copy(this.position);
        return mesh;
    }

    update(isActive, time, transitionProgress = 1) {
        if (isActive) {
            // Smoothly increase and decrease the size of the active star
            this.currentSize = this.baseSize + Math.sin(time) * 0.5;
            this.mesh.material.opacity = transitionProgress;
            this.glowMesh.material.opacity = 0.6 * transitionProgress;
            this.glowMesh.material.size = this.currentSize * 3;
        } else {
            this.currentSize = this.baseSize;
            this.mesh.material.opacity = 0.4;
            this.glowMesh.material.opacity = 0.2;
            this.glowMesh.material.size = this.currentSize * 2;
        }

        this.mesh.material.size = this.currentSize;
        this.mesh.geometry.attributes.size.needsUpdate = true;
        this.glowMesh.geometry.attributes.size.needsUpdate = true;
    }
}

class ConstellationGroup {
    constructor(data, starTexture) {
        this.group = new THREE.Group();
        this.data = data;
        this.stars = [];
        this.activeStarIndex = Math.floor(Math.random() * this.data.stars.length);
        this.nextStarIndex = this.getNextStarIndex();
        this.transitionProgress = 0;
        this.changeSpeed = 0.5 + Math.random() * 0.5;
        this.animationSpeed = 0.5 + Math.random() * 0.5;
        
        // Parameters for Z movement
        this.zSpeed = 0.02 + Math.random() * 0.03;
        this.zAmplitude = 5 + Math.random() * 2;
        this.zPhase = Math.random() * Math.PI * 2;
        
        // Distance constraints
        this.maxDistance = -150;
        this.minDistance = -10;

        // Parameters for rotation
        this.rotationSpeed = {
            x: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
            y: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
            z: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1)
        };
        this.targetRotationSpeed = { ...this.rotationSpeed };
        this.rotationChangeTime = 15 + Math.random() * 15;
        this.rotationTimer = 0;
        this.rotationTransitionProgress = 0;

        // Parameters for orbital movement
        this.orbitSpeed = 0.03 + Math.random() * 0.02;
        this.orbitRadius = 50 + Math.random() * 60;
        this.orbitPhase = Math.random() * Math.PI * 2;
        
        // Parameters for additional canvas movement
        this.canvasSpeed = 0.01 + Math.random() * 0.01;
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
                x: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
                y: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
                z: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1)
            };
            this.rotationTimer = 0;
            this.rotationTransitionProgress = 0;
            this.rotationChangeTime = 15 + Math.random() * 15;
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
        // Create stars
        this.data.stars.forEach(starData => {
            const position = new THREE.Vector3(
                starData.x,
                starData.y,
                starData.z
            );
            const star = new Star(position, starTexture);
            this.stars.push(star);
            this.group.add(star.mesh);
            this.group.add(star.glowMesh);
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
        // Smooth transition progress change
        this.transitionProgress += this.changeSpeed * 0.01;
        
        // If transition is complete, start a new one
        if (this.transitionProgress >= 1) {
            this.transitionProgress = 0;
            this.activeStarIndex = this.nextStarIndex;
            this.nextStarIndex = this.getNextStarIndex();
        }

        // Calculate movement within constraints
        const progress = (Math.sin(time * this.zSpeed + this.zPhase) + 1) / 2;
        const zPosition = this.minDistance + (this.maxDistance - this.minDistance) * progress;
        
        // Calculate scale factor based on Z-position
        const scaleFactor = Math.abs(zPosition / this.maxDistance);
        const smoothScaleFactor = Math.pow(scaleFactor, 0.7);
        
        // Update Z-position
        this.group.position.z = zPosition;

        // Update rotation timer
        this.updateRotation(time);

        // Orbital movement with scaling
        const orbitX = Math.cos(time * this.orbitSpeed + this.orbitPhase) * this.orbitRadius * smoothScaleFactor;
        const orbitY = Math.sin(time * this.orbitSpeed + this.orbitPhase) * this.orbitRadius * smoothScaleFactor;
        
        // Additional canvas movement with scaling
        const canvasX = Math.cos(time * this.canvasSpeed + this.canvasPhase) * this.canvasRadius * smoothScaleFactor;
        const canvasY = Math.sin(time * this.canvasSpeed + this.canvasPhase) * this.canvasRadius * smoothScaleFactor;
        
        // Calculate current position considering all movements
        let currentX = this.baseX + orbitX + canvasX;
        let currentY = this.baseY + orbitY + canvasY;

        // Apply scaling to current position
        currentX *= smoothScaleFactor;
        currentY *= smoothScaleFactor;

        // Constrain movement on screen depending on depth
        const depthFactor = Math.abs(zPosition / this.maxDistance);
        const maxAllowedDistance = this.maxScreenDistance * depthFactor;
        
        // Check and constrain distance from center
        const distanceFromCenter = Math.sqrt(currentX * currentX + currentY * currentY);
        if (distanceFromCenter > maxAllowedDistance) {
            const scale = maxAllowedDistance / distanceFromCenter;
            currentX *= scale;
            currentY *= scale;
        }

        // Update position
        this.group.position.x = currentX;
        this.group.position.y = currentY;

        // Update avoidance force
        this.updateAvoidanceForce(otherConstellations);

        // Apply avoidance force to position
        this.group.position.add(this.avoidanceForce);

        // Update all stars
        this.stars.forEach((star, index) => {
            const isCurrentActive = index === this.activeStarIndex;
            const isNextActive = index === this.nextStarIndex;
            
            // Smooth transition between active stars
            if (isCurrentActive) {
                star.update(true, time * this.animationSpeed, 1 - this.transitionProgress);
            } else if (isNextActive) {
                star.update(true, time * this.animationSpeed, this.transitionProgress);
            } else {
                star.update(false, time * this.animationSpeed, 0);
            }
        });
    }
}

class BackgroundStars {
    constructor(count, starTexture) {
        this.group = new THREE.Group();
        this.count = count;
        this.starTexture = starTexture;
        this.stars = [];
        this.init();
    }

    init() {
        const positions = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        
        for (let i = 0; i < this.count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 2] = -300 + Math.random() * 200;
            
            sizes[i] = Math.random() * 1 + 0.5;
            
            // Create an object with parameters for each star
            this.stars.push({
                phase: Math.random() * Math.PI * 2,
                movePhase: Math.random() * Math.PI * 2,
                isMoving: Math.random() < 0.15,
                flickerSpeed: Math.random() < 0.3 
                    ? 0.05 + Math.random() * 0.1 
                    : 0.005,
                flickerAmplitude: Math.random() < 0.3 
                    ? 0.5 + Math.random() * 0.5 
                    : 0.2,
                delay: Math.random() * Math.PI * 2 // Random delay for flickering
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1,
            map: this.starTexture,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.points = new THREE.Points(geometry, material);
        this.group.add(this.points);
    }

    update() {
        const positions = this.points.geometry.attributes.position.array;
        const sizes = this.points.geometry.attributes.size.array;
        
        for (let i = 0; i < this.count; i++) {
            const star = this.stars[i];
            
            // Update flickering with delay
            star.phase += star.flickerSpeed + Math.random() * 0.01;
            const brightness = Math.sin(star.phase + star.delay) * star.flickerAmplitude + (1 - star.flickerAmplitude / 2);
            sizes[i] = brightness * (Math.random() * 1 + 0.5);
            
            if (star.isMoving) {
                star.movePhase += 0.003;
                
                positions[i * 3] += Math.sin(star.movePhase) * 0.05;
                positions[i * 3 + 1] += Math.cos(star.movePhase) * 0.05;
                positions[i * 3 + 2] += Math.sin(star.movePhase * 0.5) * 0.02;
                
                // Constrain movement on screen
                if (positions[i * 3] < -800) positions[i * 3] = 800;
                if (positions[i * 3] > 800) positions[i * 3] = -800;
                if (positions[i * 3 + 1] < -800) positions[i * 3 + 1] = 800;
                if (positions[i * 3 + 1] > 800) positions[i * 3 + 1] = -800;
                if (positions[i * 3 + 2] < -300) positions[i * 3 + 2] = -100;
                if (positions[i * 3 + 2] > -100) positions[i * 3 + 2] = -300;
            }
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.size.needsUpdate = true;
    }
}

export class Constellation extends AnimationController {
    constructor(container) {
        super(container);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.constellations = [];
        this.backgroundStars = null;
        this.frame = 0;

        this.name = 'Constellation';
        this.logger = createLogger(this.name);
        this.logger.log('Controller initialization', {
            conditions: ['initializing-controller'],
        });
    }

    onResize() {
        updateRendererSize(this.renderer, this.container, this.camera, {
            clearColor: { color: 0x000000, alpha: 0 },
            composer: this.composer
        });
    }

    initScene() {
        if (this.isInitialized) return;
        this.logger.log('Scene initialization', {
            conditions: ['initializing-scene'],
            functionName: 'initScene'
        });

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        
        updateRendererSize(this.renderer, this.container, this.camera);
        
        this.container.appendChild(this.renderer.domElement);
        
        createCanvas(this.renderer, { zIndex: '2' });
        
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(0, 0, -1);
        
        const starTexture = createStarTexture();
        this.backgroundStars = new BackgroundStars(2000, starTexture);
        this.scene.add(this.backgroundStars.group);
        
        constellationsData.forEach((data) => {
            const constellationGroup = new ConstellationGroup(data, starTexture);
            this.scene.add(constellationGroup.group);
            this.constellations.push(constellationGroup);
        });

        // Add fog for depth effect
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);
        
        this.isInitialized = true;
    }

    cleanup() {
        this.constellations = [];
        this.backgroundStars = null;
        super.cleanup(this.renderer, this.scene);
    }

    update() {
        if (!this.canAnimate()) {
            return;
        }

        // Log only when update is called for the first time
        if (!this.animationFrameId) {
            this.logger.log('Starting update cycle', {
                conditions: ['running'],
                functionName: 'update',
                trackType: 'animation'
            });
        }

        // Optimization - update every second frame
        if (this.frame % 2 === 0) {
            const time = Date.now() * 0.001;

            if (this.backgroundStars) {
                this.backgroundStars.update(time);
            }

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

    const constellationManager = new ContainerManager(aboutSection, { zIndex: '1' });
    const constellationContainer = constellationManager.create();

    return new Constellation(constellationContainer);
} 