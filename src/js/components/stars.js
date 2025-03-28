import * as THREE from 'three';
console.log('Galaxy.js loaded');

export function initStars() {
    const heroSection = document.getElementById('home');
    let renderer, scene, camera, stars;
    let animationFrameId = null;
    let isVisible = false;
    let phases, isMoving, movePhases, flickerSpeeds, flickerAmplitudes;
    let isInitialized = false;
    
    // Инициализация сцены
    function initScene() {
        if (isInitialized) return;
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        // Настройка рендерера
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ограничиваем pixel ratio для производительности
        
        // Добавляем рендерер в DOM
        heroSection.insertBefore(renderer.domElement, heroSection.firstChild);
        
        // Устанавливаем стили
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '1';
        renderer.domElement.style.pointerEvents = 'none';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.overflow = 'hidden'; // Предотвращаем появление полосы прокрутки
        
        // Настройка камеры
        camera.position.z = 5;
        
        // Определяем количество звезд в зависимости от размера экрана
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 2500 : 5000;
        const depthRange = isMobile ? 500 : 1000; // Уменьшаем глубину для мобильных
        const starColors = [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF];
        
        // Создаем геометрию для звезд
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        phases = new Float32Array(starCount);
        isMoving = new Float32Array(starCount);
        movePhases = new Float32Array(starCount);
        flickerSpeeds = new Float32Array(starCount);
        flickerAmplitudes = new Float32Array(starCount);
        
        // Инициализация звезд
        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * depthRange;
            positions[i * 3 + 1] = (Math.random() - 0.5) * depthRange;
            positions[i * 3 + 2] = (Math.random() - 0.5) * depthRange;
            
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            colors[i * 3] = (color >> 16 & 255) / 255;
            colors[i * 3 + 1] = (color >> 8 & 255) / 255;
            colors[i * 3 + 2] = (color & 255) / 255;
            
            sizes[i] = Math.random() * 3 + 1;
            phases[i] = Math.random() * Math.PI * 2;
            isMoving[i] = Math.random() < 0.15 ? 1 : 0;
            movePhases[i] = Math.random() * Math.PI * 2;
            
            // Настройка мерцания
            if (Math.random() < 0.3) {
                flickerSpeeds[i] = 0.05 + Math.random() * 0.1;
                flickerAmplitudes[i] = 0.5 + Math.random() * 0.5;
            } else {
                flickerSpeeds[i] = 0.005;
                flickerAmplitudes[i] = 0.2;
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starsMaterial = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: true,
            size: 2,
            transparent: true,
            opacity: 1,
            map: createStarTexture()
        });
        
        stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
        isInitialized = true;
    }
    
    // Создание текстуры для круглых звезд
    function createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    // Анимация
    function animate() {
        if (!isVisible || !stars || !phases || !flickerSpeeds || !flickerAmplitudes) return;
        
        animationFrameId = requestAnimationFrame(animate);
        
        // Обновляем позиции и размеры звезд
        const positions = stars.geometry.attributes.position.array;
        const sizes = stars.geometry.attributes.size.array;
        const depthRange = window.innerWidth < 768 ? 500 : 1000;
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            // Мерцание для всех звезд с разной скоростью и амплитудой
            phases[index] += flickerSpeeds[index];
            const brightness = Math.sin(phases[index]) * flickerAmplitudes[index] + (1 - flickerAmplitudes[index] / 2);
            sizes[index] = brightness * (Math.random() * 3 + 1);
            
            // Движение только для некоторых звезд
            if (isMoving[index] === 1) {
                movePhases[index] += 0.003;
                
                positions[i] += Math.sin(movePhases[index]) * 0.05;
                positions[i + 1] += Math.cos(movePhases[index]) * 0.05;
                positions[i + 2] += Math.sin(movePhases[index] * 0.5) * 0.02;
            }
            
            // Возврат на противоположную сторону при выходе за границы
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < -depthRange) positions[i + 2] = depthRange;
            if (positions[i + 2] > depthRange) positions[i + 2] = -depthRange;
        }
        
        // Обновляем атрибуты
        stars.geometry.attributes.position.needsUpdate = true;
        stars.geometry.attributes.size.needsUpdate = true;
        
        // Очень медленное вращение камеры
        camera.rotation.x += 0.00002;
        camera.rotation.y += 0.00002;
        
        renderer.render(scene, camera);
    }
    
    // Очистка ресурсов
    function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
            renderer = null;
        }
        if (stars) {
            stars.geometry.dispose();
            stars.material.dispose();
            stars = null;
        }
        // Очищаем глобальные массивы
        phases = null;
        isMoving = null;
        movePhases = null;
        flickerSpeeds = null;
        flickerAmplitudes = null;
        isInitialized = false;
    }
    
    // Обработчик изменения размера окна
    function handleResize() {
        if (!renderer || !camera) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Пересоздаем сцену при изменении размера экрана
        if (isInitialized) {
            cleanup();
            initScene();
        }
    }
    
    // Наблюдатель за видимостью
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isVisible = true;
                if (!isInitialized) {
                    initScene();
                }
                animate();
            } else {
                isVisible = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                cleanup();
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Добавляем обработчики событий
    window.addEventListener('resize', handleResize);
    observer.observe(heroSection);
} 