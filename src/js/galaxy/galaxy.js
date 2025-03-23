import * as THREE from 'three';

console.log('Galaxy.js loaded');

export function initializeScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const hero = document.querySelector('#hero');
    hero.appendChild(renderer.domElement);

    return { scene, camera, renderer };
}

export function createStars(scene, starCount) {
    const starColors = [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF];
    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount); // Массив для размеров звезд

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2000; // X
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // Y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // Z

        // Выбираем случайный цвет для каждой звезды
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        colors[i * 3] = (color >> 16 & 255) / 255; // R
        colors[i * 3 + 1] = (color >> 8 & 255) / 255; // G
        colors[i * 3 + 2] = (color & 255) / 255; // B

        // Устанавливаем случайный размер для каждой звезды (от 1 до 5)
        sizes[i] = Math.random() * 3 + 1; // Размер от 1 до 5
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // Добавляем размеры звезд

    const starsMaterial = new THREE.PointsMaterial({ vertexColors: true, sizeAttenuation: true, size: 1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    return { positions, sizes, starCount, starsGeometry };
}

export function animateStars(positions, sizes, starCount, starsGeometry, renderer, scene, camera) {
    function animate() {
        requestAnimationFrame(animate);

        // Обновляем позиции и размеры звезд
        for (let i = 0; i < starCount; i++) {
            // Двигаем звезды по своей траектории
            positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01; // Движение по Y
            positions[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i) * 0.01; // Движение по Z

            // Затухание и появление
            const scale = Math.abs(Math.sin(Date.now() * 0.001 + i)); // Затухание
            sizes[i] = scale * 5; // Изменяем размер звезды (до 5)
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // Обновляем размеры звезд

        renderer.render(scene, camera);
    }

    animate();
}


