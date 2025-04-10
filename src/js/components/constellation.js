import * as THREE from 'three';
import constellationsData from '../data/constellations.json';

class Star {
    constructor(position, texture) {
        this.position = position;
        this.baseSize = 1;
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
                opacity: 1,
                linewidth: 2
            });

            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                this.stars[connection[0]].position,
                this.stars[connection[1]].position
            ]);
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.group.add(line);
        });

        // Устанавливаем позицию группы
        this.group.position.set(
            this.data.basePosition.x,
            this.data.basePosition.y,
            this.data.basePosition.z
        );
    }

    update(time) {
        // Плавное изменение прогресса перехода
        this.transitionProgress += this.changeSpeed * 0.01;
        
        // Если переход завершен, начинаем новый
        if (this.transitionProgress >= 1) {
            this.transitionProgress = 0;
            this.activeStarIndex = this.nextStarIndex;
            this.nextStarIndex = this.getNextStarIndex();
        }

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
        this.constellations.forEach(constellation => {
            constellation.update(time);
        });
        
        this.renderer.render(this.scene, this.camera);
    }
} 