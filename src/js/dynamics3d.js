import * as THREE from 'three';

// Initialize scenes for each card
const scenes = {
    guardians: new THREE.Scene(),
    metaverse: new THREE.Scene(),
    sankopa: new THREE.Scene()
};

// Initialize cameras
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.z = 5;

// Initialize renderers
const renderers = {};

// Create geometries
const discGeometry = new THREE.CircleGeometry(1.2, 32); // Плоский диск для первой фигуры
const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const boxGeometry = new THREE.BoxGeometry(1.8, 1, 1.4); // Прямоугольный параллелепипед

// Create materials with glow effect
const createGlowMaterial = (color) => {
    return new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 100,
        side: THREE.DoubleSide // Чтобы плоская фигура была видна с обеих сторон
    });
};

// Create meshes
const guardiansMesh = new THREE.Mesh(discGeometry, createGlowMaterial(0x00E6C3));
const metaverseMesh = new THREE.Mesh(cubeGeometry, createGlowMaterial(0x2B6BF3));
const sankopaMesh = new THREE.Mesh(boxGeometry, createGlowMaterial(0xE431FF));

// Add meshes to scenes
scenes.guardians.add(guardiansMesh);
scenes.metaverse.add(metaverseMesh);
scenes.sankopa.add(sankopaMesh);

// Add lights to all scenes
Object.values(scenes).forEach(scene => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(ambientLight);
    scene.add(pointLight);
});

// Animation parameters
let guardiansRotationX = 0.01;
let guardiansRotationY = 0.01;
let rotationTimer = 0;

// Initialize renderers and start animation
export function initDynamics3D() {
    // Initialize renderers for each container
    ['guardians3d', 'metaverse3d', 'sankopa3d'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            const renderer = new THREE.WebGLRenderer({ 
                alpha: true,
                antialias: true 
            });
            renderer.setSize(container.clientWidth, container.clientWidth);
            container.appendChild(renderer.domElement);
            renderers[id] = renderer;
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Периодически меняем направление вращения для первой фигуры
        rotationTimer += 0.01;
        if (rotationTimer > Math.PI * 2) {
            rotationTimer = 0;
            guardiansRotationX = Math.random() * 0.02 - 0.01; // Случайное значение от -0.01 до 0.01
            guardiansRotationY = Math.random() * 0.02 - 0.01;
        }

        // Вращаем первую фигуру по случайной траектории
        guardiansMesh.rotation.x += guardiansRotationX;
        guardiansMesh.rotation.y += guardiansRotationY;

        // Сложное вращение для второй фигуры
        metaverseMesh.rotation.y += 0.01;
        metaverseMesh.rotation.x = Math.sin(rotationTimer) * 0.5;

        // Плавное вращение для третьей фигуры
        sankopaMesh.rotation.y += 0.008;
        sankopaMesh.rotation.x += 0.005;

        // Render scenes
        if (renderers.guardians3d) {
            renderers.guardians3d.render(scenes.guardians, camera);
        }
        if (renderers.metaverse3d) {
            renderers.metaverse3d.render(scenes.metaverse, camera);
        }
        if (renderers.sankopa3d) {
            renderers.sankopa3d.render(scenes.sankopa, camera);
        }
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        ['guardians3d', 'metaverse3d', 'sankopa3d'].forEach(id => {
            const container = document.getElementById(id);
            const renderer = renderers[id];
            if (container && renderer) {
                renderer.setSize(container.clientWidth, container.clientWidth);
            }
        });
    });

    // Start animation
    animate();
} 