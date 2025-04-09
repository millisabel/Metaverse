import * as THREE from 'three';
console.log('Galaxy.js loaded');

export class Stars {
    constructor(container) {
        this.container = container;
        this.heroSection = document.getElementById('hero');
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.stars = null;
        this.animationFrameId = null;
        this.isVisible = false;
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
        this.isInitialized = false;

        this.init();
    }

    init() {
        // Visibility observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    if (!this.isInitialized) {
                        this.initScene();
                    }
                    this.animate();
                } else {
                    this.isVisible = false;
                    if (this.animationFrameId) {
                        cancelAnimationFrame(this.animationFrameId);
                        this.animationFrameId = null;
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        observer.observe(this.heroSection);

        // Add event listeners
        window.addEventListener('resize', () => this.handleResize());
    }

    initScene() {
        if (this.isInitialized) return;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add renderer to container
        this.container.appendChild(this.renderer.domElement);
        
        // Set styles
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '2';
        this.renderer.domElement.style.pointerEvents = 'none';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.overflow = 'hidden';
        
        // Setup camera
        this.camera.position.z = 5;
        
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
        this.phases = new Float32Array(starCount);
        this.isMoving = new Float32Array(starCount);
        this.movePhases = new Float32Array(starCount);
        this.flickerSpeeds = new Float32Array(starCount);
        this.flickerAmplitudes = new Float32Array(starCount);
        
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
            this.phases[i] = Math.random() * Math.PI * 2;
            this.isMoving[i] = Math.random() < 0.15 ? 1 : 0;
            this.movePhases[i] = Math.random() * Math.PI * 2;
            
            if (Math.random() < 0.3) {
                this.flickerSpeeds[i] = 0.05 + Math.random() * 0.1;
                this.flickerAmplitudes[i] = 0.5 + Math.random() * 0.5;
            } else {
                this.flickerSpeeds[i] = 0.005;
                this.flickerAmplitudes[i] = 0.2;
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
            map: this.createStarTexture()
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
        this.isInitialized = true;
    }
    
    createStarTexture() {
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
    
    animate() {
        if (!this.isVisible || !this.stars || !this.phases || !this.flickerSpeeds || !this.flickerAmplitudes) return;
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        // Update positions and sizes of stars
        const positions = this.stars.geometry.attributes.position.array;
        const sizes = this.stars.geometry.attributes.size.array;
        const depthRange = window.innerWidth < 768 ? 500 : 1000;
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            // Flickering for all stars with different speeds and amplitudes
            this.phases[index] += this.flickerSpeeds[index];
            const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
            sizes[index] = brightness * (Math.random() * 3 + 1);
            
            // Movement only for some stars
            if (this.isMoving[index] === 1) {
                this.movePhases[index] += 0.003;
                
                positions[i] += Math.sin(this.movePhases[index]) * 0.05;
                positions[i + 1] += Math.cos(this.movePhases[index]) * 0.05;
                positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * 0.02;
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
        this.stars.geometry.attributes.position.needsUpdate = true;
        this.stars.geometry.attributes.size.needsUpdate = true;
        
        // Very slow camera rotation
        this.camera.rotation.x += 0.00002;
        this.camera.rotation.y += 0.00002;
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        if (!this.renderer || !this.camera || !this.isVisible) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Recreate scene when screen size changes
        if (this.isInitialized) {
            this.cleanup();
            this.initScene();
        }
    }
    
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
        }
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
            this.stars = null;
        }
        // Clear arrays
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
        this.isInitialized = false;
    }
} 