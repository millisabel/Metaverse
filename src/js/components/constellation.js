import * as THREE from 'three';
import { AnimationController } from '../utils/animationController_3D';
import { createCanvas, updateRendererSize } from '../utils/canvasUtils';
import constellationsData from '../data/constellations.json';
import { createStarTexture } from '../utils/textureUtils';

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
            // Плавное увеличение и уменьшение размера активной звезды
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
        
        // Параметры для движения по Z
        this.zSpeed = 0.02 + Math.random() * 0.03;
        this.zAmplitude = 5 + Math.random() * 2;
        this.zPhase = Math.random() * Math.PI * 2;
        
        // Ограничения по расстоянию
        this.maxDistance = -150;
        this.minDistance = -10;

        // Параметры для вращения
        this.rotationSpeed = {
            x: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
            y: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
            z: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1)
        };
        this.targetRotationSpeed = { ...this.rotationSpeed };
        this.rotationChangeTime = 15 + Math.random() * 15;
        this.rotationTimer = 0;
        this.rotationTransitionProgress = 0;

        // Параметры для орбитального движения
        this.orbitSpeed = 0.03 + Math.random() * 0.02;
        this.orbitRadius = 50 + Math.random() * 60;
        this.orbitPhase = Math.random() * Math.PI * 2;
        
        // Параметры для дополнительного движения по полотну
        this.canvasSpeed = 0.01 + Math.random() * 0.01;
        this.canvasRadius = 100 + Math.random() * 100;
        this.canvasPhase = Math.random() * Math.PI * 2;
        
        // Сохраняем базовые позиции для масштабирования
        this.baseX = this.data.basePosition.x;
        this.baseY = this.data.basePosition.y;

        // Параметры для избегания столкновений
        this.avoidanceRadius = 100;
        this.avoidanceSpeed = 0.1;
        this.avoidanceForce = new THREE.Vector3();

        // Параметры для ограничения движения по экрану
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

    updateRotation(time) {
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
        // Создаем звезды
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

        // Создаем соединения между звездами
        this.createConnectionLines();

        // Устанавливаем начальную позицию группы
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
        // Плавное изменение прогресса перехода
        this.transitionProgress += this.changeSpeed * 0.01;
        
        // Если переход завершен, начинаем новый
        if (this.transitionProgress >= 1) {
            this.transitionProgress = 0;
            this.activeStarIndex = this.nextStarIndex;
            this.nextStarIndex = this.getNextStarIndex();
        }

        // Вычисляем движение в пределах ограничений
        const progress = (Math.sin(time * this.zSpeed + this.zPhase) + 1) / 2;
        const zPosition = this.minDistance + (this.maxDistance - this.minDistance) * progress;
        
        // Вычисляем коэффициент масштабирования на основе Z-позиции
        const scaleFactor = Math.abs(zPosition / this.maxDistance);
        const smoothScaleFactor = Math.pow(scaleFactor, 0.7);
        
        // Обновляем позицию по Z
        this.group.position.z = zPosition;

        // Обновляем таймер вращения
        this.updateRotation(time);

        // Орбитальное движение с учетом масштабирования
        const orbitX = Math.cos(time * this.orbitSpeed + this.orbitPhase) * this.orbitRadius * smoothScaleFactor;
        const orbitY = Math.sin(time * this.orbitSpeed + this.orbitPhase) * this.orbitRadius * smoothScaleFactor;
        
        // Дополнительное движение по полотну с учетом масштабирования
        const canvasX = Math.cos(time * this.canvasSpeed + this.canvasPhase) * this.canvasRadius * smoothScaleFactor;
        const canvasY = Math.sin(time * this.canvasSpeed + this.canvasPhase) * this.canvasRadius * smoothScaleFactor;
        
        // Вычисляем текущую позицию с учетом всех движений
        let currentX = this.baseX + orbitX + canvasX;
        let currentY = this.baseY + orbitY + canvasY;

        // Применяем масштабирование к текущей позиции
        currentX *= smoothScaleFactor;
        currentY *= smoothScaleFactor;

        // Ограничиваем движение по экрану в зависимости от глубины
        const depthFactor = Math.abs(zPosition / this.maxDistance);
        const maxAllowedDistance = this.maxScreenDistance * depthFactor;
        
        // Проверяем и ограничиваем расстояние от центра
        const distanceFromCenter = Math.sqrt(currentX * currentX + currentY * currentY);
        if (distanceFromCenter > maxAllowedDistance) {
            const scale = maxAllowedDistance / distanceFromCenter;
            currentX *= scale;
            currentY *= scale;
        }

        // Обновляем позицию
        this.group.position.x = currentX;
        this.group.position.y = currentY;

        // Обновляем силу избегания
        this.updateAvoidanceForce(otherConstellations);

        // Применяем силу избегания к позиции
        this.group.position.add(this.avoidanceForce);

        // Обновляем все звезды
        this.stars.forEach((star, index) => {
            const isCurrentActive = index === this.activeStarIndex;
            const isNextActive = index === this.nextStarIndex;
            
            // Плавный переход между активными звездами
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
            
            // Создаем объект с параметрами для каждой звезды
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
                delay: Math.random() * Math.PI * 2 // Случайная задержка для мерцания
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

    update(time) {
        const positions = this.points.geometry.attributes.position.array;
        const sizes = this.points.geometry.attributes.size.array;
        
        for (let i = 0; i < this.count; i++) {
            const star = this.stars[i];
            
            // Обновляем мерцание с учетом задержки
            star.phase += star.flickerSpeed + Math.random() * 0.01;
            const brightness = Math.sin(star.phase + star.delay) * star.flickerAmplitude + (1 - star.flickerAmplitude / 2);
            sizes[i] = brightness * (Math.random() * 1 + 0.5);
            
            if (star.isMoving) {
                star.movePhase += 0.003;
                
                positions[i * 3] += Math.sin(star.movePhase) * 0.05;
                positions[i * 3 + 1] += Math.cos(star.movePhase) * 0.05;
                positions[i * 3 + 2] += Math.sin(star.movePhase * 0.5) * 0.02;
                
                // Ограничиваем движение по экрану
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
        this.name = 'Constellation';
        this.frame = 0;
    }

    onResize() {
        updateRendererSize(this.renderer, this.container, this.camera, {
            clearColor: { color: 0x000000, alpha: 0 },
            composer: this.composer
        });
    }

    initScene() {
        if (this.isInitialized) return;
        console.log(`[${this.name}] Initializing scene`);

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

        // Добавляем туман для эффекта глубины
        this.scene.fog = new THREE.FogExp2(0x000000, 0.002);
        
        this.isInitialized = true;
    }

    animate() {
        if (!this.isVisible || !this.scene || !this.camera) return;

        super.animate();
        
        // Обновляем анимацию через кадр
        if (this.frame % 2 === 0) {
            const time = Date.now() * 0.001;
            
            this.backgroundStars.update(time);
            
            this.constellations.forEach((constellation, index) => {
                constellation.update(time, this.constellations.filter(c => c !== constellation));
            });
        }
        
        this.frame++;
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        this.constellations = [];
        this.backgroundStars = null;
        super.cleanup();
    }
} 