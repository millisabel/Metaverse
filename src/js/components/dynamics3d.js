import * as THREE from 'three';
import decoration1Svg from '../../assets/svg/dynamics/decoration_1.svg';
import decoration2Svg from '../../assets/svg/dynamics/decoration_2.svg';
import decoration3Svg from '../../assets/svg/dynamics/decoration_3.svg';

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

// Create decorative circles for each scene
function createDecorativeCircles(sceneType) {
    const group = new THREE.Group();
    const loader = new THREE.TextureLoader();
    
    // Определяем SVG и цвет в зависимости от типа сцены
    const svgConfig = {
        guardians: { svg: decoration1Svg, color: 0x38DBFF },
        metaverse: { svg: decoration2Svg, color: 0x2B6BF3 },
        sankopa: { svg: decoration3Svg, color: 0xE431FF }
    };

    const config = svgConfig[sceneType];
    
    loader.load(
        config.svg,
        // onLoad callback
        (texture) => {
            const planeGeometry = new THREE.PlaneGeometry(5, 5);
            const planeMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                emissive: config.color,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.z = -0.2;
            group.add(plane);
        },
        // onProgress callback
        (xhr) => {
            console.log(`${sceneType} texture: ${(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        // onError callback
        (error) => {
            console.error(`Error loading texture for ${sceneType}:`, error);
            // Fallback to basic circle if texture fails to load
            const circleGeometry = new THREE.RingGeometry(1.5, 1.8, 32);
            const circleMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });
            const circle = new THREE.Mesh(circleGeometry, circleMaterial);
            circle.position.z = -0.2;
            group.add(circle);
        }
    );

    return group;
}

// Create geometries
const discGeometry = new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const boxGeometry = new THREE.BoxGeometry(1.8, 1, 1.4);

// Create materials with glow effect
const createGlowMaterial = (color) => {
    return new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 100,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        flatShading: false
    });
};

// Create meshes with their decorative elements
const guardiansGroup = new THREE.Group();
const guardiansMaterial = createGlowMaterial(0x00E6C3);
guardiansMaterial.metalness = 0.5;
guardiansMaterial.roughness = 0.2;
const guardiansMesh = new THREE.Mesh(discGeometry, guardiansMaterial);
guardiansMesh.rotation.x = -Math.PI / 2;
const guardiansBackground = createDecorativeCircles('guardians');
guardiansGroup.add(guardiansMesh);
guardiansGroup.add(guardiansBackground);

const metaverseGroup = new THREE.Group();
const metaverseMesh = new THREE.Mesh(cubeGeometry, createGlowMaterial(0x2B6BF3));
const metaverseBackground = createDecorativeCircles('metaverse');
metaverseGroup.add(metaverseMesh);
metaverseGroup.add(metaverseBackground);

const sankopaGroup = new THREE.Group();
const sankopaMesh = new THREE.Mesh(boxGeometry, createGlowMaterial(0xE431FF));
const sankopaBackground = createDecorativeCircles('sankopa');
sankopaGroup.add(sankopaMesh);
sankopaGroup.add(sankopaBackground);

// Add meshes to scenes
scenes.guardians.add(guardiansGroup);
scenes.metaverse.add(metaverseGroup);
scenes.sankopa.add(sankopaGroup);

// Add lights to all scenes
Object.values(scenes).forEach(scene => {
    // Основной рассеянный свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Направленный свет сверху
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    // Точечный свет спереди для бликов
    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Мягкий свет сзади для контура
    const backLight = new THREE.PointLight(0xffffff, 0.2);
    backLight.position.set(0, 0, -5);
    scene.add(backLight);
});

// Animation parameters
let guardiansRotationX = 0.01;
let guardiansRotationY = 0.01;
let rotationTimer = 0;

// Animation state
let isAnimating = false;
let animationFrameId = null;
let activeElements = new Set();
let intersectionDebounceTimeout = null;

// Function to start animation
function startAnimation() {
    if (!isAnimating && activeElements.size > 0) {
        console.log('Starting animation');
        isAnimating = true;
        animate();
    }
}

// Function to stop animation
function stopAnimation() {
    if (isAnimating && activeElements.size === 0) {
        console.log('Stopping animation');
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

// Function to handle intersection changes with debounce
function handleIntersection(entries) {
    if (intersectionDebounceTimeout) {
        clearTimeout(intersectionDebounceTimeout);
    }

    intersectionDebounceTimeout = setTimeout(() => {
        entries.forEach(entry => {
            const id = entry.target.id;
            console.log(`Element ${id} intersection:`, entry.isIntersecting);

            if (entry.isIntersecting) {
                if (!renderers[id]) {
                    console.log(`Creating renderer for ${id}`);
                    const container = document.getElementById(id);
                    if (container) {
                        renderers[id] = createRenderer(container);
                        activeElements.add(id);
                        startAnimation();
                    }
                } else {
                    activeElements.add(id);
                    startAnimation();
                }
            } else {
                activeElements.delete(id);
                if (renderers[id]) {
                    console.log(`Destroying renderer for ${id}`);
                    destroyRenderer(renderers[id], id);
                    delete renderers[id];
                }
                stopAnimation();
            }
        });
    }, 150); // Добавляем небольшую задержку для сглаживания
}

// Function to create renderer
function createRenderer(container) {
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    
    // Устанавливаем размеры на основе контейнера
    updateRendererSize(renderer, container);
    
    container.appendChild(renderer.domElement);
    return renderer;
}

// Function to update renderer size
function updateRendererSize(renderer, container) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Обновляем размеры рендерера
    renderer.setSize(width, height);
    
    // Обновляем аспект камеры
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Function to destroy renderer
function destroyRenderer(renderer, id) {
    if (renderer) {
        console.log('Destroying renderer...');

        // Удаляем элемент из активных
        activeElements.delete(id);
        stopAnimation();

        // Очищаем все геометрии и материалы
        renderer.dispose();

        // Удаляем canvas из DOM
        if (renderer.domElement && renderer.domElement.parentNode) {
            console.log('Removing canvas from DOM');
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }

        // Принудительно освобождаем WebGL контекст
        if (renderer.getContext()) {
            console.log('Forcing context loss');
            renderer.forceContextLoss();
        }

        // Очищаем все свойства рендерера
        Object.keys(renderer).forEach(key => {
            if (typeof renderer[key] === 'object' && renderer[key] !== null) {
                renderer[key] = null;
            }
        });

        renderer = null;
        console.log('Renderer destroyed successfully');
    }
}

// Animation loop
function animate() {
    if (!isAnimating) {
        console.log('Animation stopped');
        return;
    }

    animationFrameId = requestAnimationFrame(animate);

    // Используем время для более плавной анимации
    const time = performance.now() * 0.001; // Конвертируем в секунды

    // Анимация для первой фигуры (Guardians)
    if (guardiansGroup) {
        // Вращение по всем осям с разными скоростями
        guardiansGroup.rotation.x = Math.sin(time * 0.5) * 0.2;
        guardiansGroup.rotation.y = Math.cos(time * 0.7) * 0.2;
        guardiansGroup.rotation.z = Math.sin(time * 0.3) * 0.15;
        
        // Пульсация
        const scale = 1 + Math.sin(time * 0.4) * 0.05;
        guardiansGroup.scale.set(scale, scale, scale);
        
        // Легкое смещение по Y
        guardiansGroup.position.y = Math.sin(time * 0.3) * 0.1;
    }

    // Анимация для второй фигуры (Metaverse)
    if (metaverseGroup) {
        // Вращение по всем осям с другими скоростями
        metaverseGroup.rotation.x = Math.sin(time * 0.7) * 0.25;
        metaverseGroup.rotation.y = Math.cos(time * 0.5) * 0.2;
        metaverseGroup.rotation.z = Math.sin(time * 0.4) * 0.15;
        
        // Пульсация с другой частотой
        const scale = 1 + Math.sin(time * 0.6) * 0.05;
        metaverseGroup.scale.set(scale, scale, scale);
        
        // Легкое смещение по Y с другой частотой
        metaverseGroup.position.y = Math.sin(time * 0.5) * 0.1;
    }

    // Анимация для третьей фигуры (Sankopa)
    if (sankopaGroup) {
        // Вращение по всем осям с третьим набором скоростей
        sankopaGroup.rotation.x = Math.sin(time * 0.4) * 0.2;
        sankopaGroup.rotation.y = Math.cos(time * 0.6) * 0.25;
        sankopaGroup.rotation.z = Math.sin(time * 0.5) * 0.15;
        
        // Пульсация с третьей частотой
        const scale = 1 + Math.sin(time * 0.7) * 0.05;
        sankopaGroup.scale.set(scale, scale, scale);
        
        // Легкое смещение по Y с третьей частотой
        sankopaGroup.position.y = Math.sin(time * 0.4) * 0.1;
    }

    // Render scenes only if they have renderers
    Object.entries(renderers).forEach(([id, renderer]) => {
        if (renderer && scenes[id.replace('3d', '')] && activeElements.has(id)) {
            renderer.render(scenes[id.replace('3d', '')], camera);
        }
    });
}

// Initialize renderers and start animation
export function initDynamics3D() {
    console.log('Initializing 3D dynamics...');

    // Handle window resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
            Object.entries(renderers).forEach(([id, renderer]) => {
                const container = document.getElementById(id);
                if (container && renderer) {
                    updateRendererSize(renderer, container);
                }
            });
        }, 100);
    });

    // Create Intersection Observer
    const observer = new IntersectionObserver(handleIntersection, {
        threshold: [0, 0.1, 0.5, 1.0], // Добавляем больше порогов для плавности
        rootMargin: '100px', // Увеличиваем отступ для более раннего начала загрузки
    });

    // Observe all 3D containers
    ['guardians3d', 'metaverse3d', 'sankopa3d'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            console.log(`Observing container: ${id}`);
            observer.observe(container);
        } else {
            console.warn(`Container not found: ${id}`);
        }
    });

    // Добавляем обработчик для очистки при размонтировании
    window.addEventListener('beforeunload', () => {
        console.log('Cleaning up before unload...');
        if (intersectionDebounceTimeout) {
            clearTimeout(intersectionDebounceTimeout);
        }
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        isAnimating = false;
        activeElements.clear();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        Object.entries(renderers).forEach(([id, renderer]) => {
            destroyRenderer(renderer, id);
        });
        renderers = {};
    });
}