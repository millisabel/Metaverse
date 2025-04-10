import * as THREE from 'three';
import constellationsData from '../data/constellations.json';

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

        // Параметры для вращения в разных плоскостях (уменьшена скорость вращения)
        this.rotationSpeed = {
            x: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
            y: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1),
            z: (0.0001 + Math.random() * 0.0001) * (Math.random() > 0.5 ? 1 : -1)
        };
        this.targetRotationSpeed = { ...this.rotationSpeed };
        this.rotationChangeTime = 15 + Math.random() * 15;
        this.rotationTimer = 0;
        this.rotationTransitionProgress = 0;

        // Параметры для орбитального движения (увеличена скорость и радиус)
        this.orbitSpeed = 0.03 + Math.random() * 0.02;
        this.orbitRadius = 50 + Math.random() * 60;
        this.orbitPhase = Math.random() * Math.PI * 2;
        
        // Параметры для дополнительного движения по полотну (увеличена скорость и радиус)
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
        this.maxScreenDistance = 200; // Максимальное расстояние от центра экрана
        
        this.init(starTexture);
    }

    getNextStarIndex() {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.data.stars.length);
        } while (nextIndex === this.activeStarIndex);
        return nextIndex;
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
        this.rotationTimer += 0.016;
        this.rotationTransitionProgress += 0.01;
        
        // Проверяем, нужно ли сменить направление вращения
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

        // Плавно интерполируем текущую скорость вращения к целевой
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

        // Вращение созвездия по всем осям
        this.group.rotation.x += this.rotationSpeed.x;
        this.group.rotation.y += this.rotationSpeed.y;
        this.group.rotation.z += this.rotationSpeed.z;

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

export class Constellation {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.constellations = [];
        
        this.init();
    }

    init() {
        // Настраиваем рендерер
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Настраиваем камеру
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(0, 0, 0);
        
        // Создаем текстуру для звезд
        const starTexture = this.createStarTexture();
        
        // Создаем созвездия
        constellationsData.forEach((data) => {
            const constellationGroup = new ConstellationGroup(data, starTexture);
            this.scene.add(constellationGroup.group);
            this.constellations.push(constellationGroup);
        });

        // Проверяем количество созданных созвездий
        console.log('Created constellations:', this.constellations.length);
        
        // Запускаем рендеринг
        this.animate();
    }

    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001; // Преобразуем время в секунды
        
        // Обновляем все созвездия
        this.constellations.forEach((constellation, index) => {
            constellation.update(time, this.constellations.filter(c => c !== constellation));
        });
        
        this.renderer.render(this.scene, this.camera);
    }
} 