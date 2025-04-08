import * as THREE from 'three';
console.log('Galaxy.js loaded');

export function initStars(container) {
    const heroSection = document.getElementById('hero');
    let renderer, scene, camera, stars;
    let animationFrameId = null;
    let isVisible = false;
    let phases, isMoving, movePhases, flickerSpeeds, flickerAmplitudes;
    let isInitialized = false;
    
    // Initialize scene
    function initScene() {
        if (isInitialized) return;
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        // Setup renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add renderer to container
        container.appendChild(renderer.domElement);
        
        // Set styles
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '2';
        renderer.domElement.style.pointerEvents = 'none';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.overflow = 'hidden';
        
        // Setup camera
        camera.position.z = 5;
        
        // Determine star count based on screen size
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 2500 : 5000;
        const depthRange = isMobile ? 500 : 1000;
        const starColors = [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF];
        
        // Create geometry for stars
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        phases = new Float32Array(starCount);
        isMoving = new Float32Array(starCount);
        movePhases = new Float32Array(starCount);
        flickerSpeeds = new Float32Array(starCount);
        flickerAmplitudes = new Float32Array(starCount);
        
        // Initialize stars
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
            size: isMobile ? 1.5 : 2,
            transparent: true,
            opacity: 1,
            map: createStarTexture()
        });
        
        stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
        isInitialized = true;
    }
    
    // Create texture for round stars
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
    
    // Animation
    function animate() {
        if (!isVisible || !stars || !phases || !flickerSpeeds || !flickerAmplitudes) return;
        
        animationFrameId = requestAnimationFrame(animate);
        
        // Update positions and sizes of stars
        const positions = stars.geometry.attributes.position.array;
        const sizes = stars.geometry.attributes.size.array;
        const depthRange = window.innerWidth < 768 ? 500 : 1000;
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            // Flickering for all stars with different speeds and amplitudes
            phases[index] += flickerSpeeds[index];
            const brightness = Math.sin(phases[index]) * flickerAmplitudes[index] + (1 - flickerAmplitudes[index] / 2);
            sizes[index] = brightness * (Math.random() * 3 + 1);
            
            // Movement only for some stars
            if (isMoving[index] === 1) {
                movePhases[index] += 0.003;
                
                positions[i] += Math.sin(movePhases[index]) * 0.05;
                positions[i + 1] += Math.cos(movePhases[index]) * 0.05;
                positions[i + 2] += Math.sin(movePhases[index] * 0.5) * 0.02;
            }
            
            // Return to opposite side when exiting boundaries
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < -depthRange) positions[i + 2] = depthRange;
            if (positions[i + 2] > depthRange) positions[i + 2] = -depthRange;
        }
        
        // Update attributes
        stars.geometry.attributes.position.needsUpdate = true;
        stars.geometry.attributes.size.needsUpdate = true;
        
        // Very slow camera rotation
        camera.rotation.x += 0.00002;
        camera.rotation.y += 0.00002;
        
        renderer.render(scene, camera);
    }
    
    // Cleanup resources
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
        // Clear global arrays
        phases = null;
        isMoving = null;
        movePhases = null;
        flickerSpeeds = null;
        flickerAmplitudes = null;
        isInitialized = false;
    }
    
    // Window resize handler
    function handleResize() {
        if (!renderer || !camera || !isVisible) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Recreate scene when screen size changes
        if (isInitialized) {
            cleanup();
            initScene();
        }
    }
    
    // Visibility observer
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
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    observer.observe(heroSection);
} 