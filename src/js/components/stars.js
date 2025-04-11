import * as THREE from 'three';
import { AnimationController } from '../utils/animationController_3D';
import {createCanvas, updateRendererSize} from "../utils/canvasUtils";
import { createStarTexture } from '../utils/textureUtils';
import {createLogger} from "../utils/logger";

export class Stars extends AnimationController {
    constructor(container) {
        super(container);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.stars = null;
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;

        this.name = 'Stars';
        this.logger = createLogger(this.name);
        this.logger.log('Initializing controller');
    }

    initScene() {
        if (this.isInitialized) return;
        this.logger.log(`Initializing scene`);

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
        
        this.camera.position.z = 5;
        
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 2500 : 5000;
        const depthRange = isMobile ? 500 : 1000;
        const starColors = [0xA109FE, 0x7A59FF, 0x6100FF, 0xFFFFFF];
        
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        this.phases = new Float32Array(starCount);
        this.isMoving = new Float32Array(starCount);
        this.movePhases = new Float32Array(starCount);
        this.flickerSpeeds = new Float32Array(starCount);
        this.flickerAmplitudes = new Float32Array(starCount);
        
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
            map: createStarTexture()
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
        this.isInitialized = true;
    }
    
    animate() {
        if (!this.isVisible || !this.stars || !this.phases || !this.flickerSpeeds || !this.flickerAmplitudes) return;
        
        super.animate();
        
        const positions = this.stars.geometry.attributes.position.array;
        const sizes = this.stars.geometry.attributes.size.array;
        const depthRange = window.innerWidth < 768 ? 500 : 1000;
        
        for (let i = 0; i < positions.length; i += 3) {
            const index = i / 3;
            
            this.phases[index] += this.flickerSpeeds[index];
            const brightness = Math.sin(this.phases[index]) * this.flickerAmplitudes[index] + (1 - this.flickerAmplitudes[index] / 2);
            sizes[index] = brightness * (Math.random() * 3 + 1);
            
            if (this.isMoving[index] === 1) {
                this.movePhases[index] += 0.003;
                
                positions[i] += Math.sin(this.movePhases[index]) * 0.05;
                positions[i + 1] += Math.cos(this.movePhases[index]) * 0.05;
                positions[i + 2] += Math.sin(this.movePhases[index] * 0.5) * 0.02;
            }
            
            if (positions[i] < -depthRange) positions[i] = depthRange;
            if (positions[i] > depthRange) positions[i] = -depthRange;
            if (positions[i + 1] < -depthRange) positions[i + 1] = depthRange;
            if (positions[i + 1] > depthRange) positions[i + 1] = -depthRange;
            if (positions[i + 2] < -depthRange) positions[i + 2] = depthRange;
            if (positions[i + 2] > depthRange) positions[i + 2] = -depthRange;
        }
        
        this.stars.geometry.attributes.position.needsUpdate = true;
        this.stars.geometry.attributes.size.needsUpdate = true;
        
        this.camera.rotation.x += 0.00002;
        this.camera.rotation.y += 0.00002;
        
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        updateRendererSize(this.renderer, this.container, this.camera);
    }

    cleanup() {
        this.logger.log(`Starting cleanup`);
        super.cleanup(this.renderer, this.scene);
        
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
            this.stars = null;
            this.logger.log(`Stars disposed`);
        }
        
        this.phases = null;
        this.isMoving = null;
        this.movePhases = null;
        this.flickerSpeeds = null;
        this.flickerAmplitudes = null;
        this.logger.log(`Cleanup completed`);
    }
}