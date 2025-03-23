import * as THREE from 'three';
import { initializeScene, createStars, animateStars } from './galaxy/galaxy.js';
import { initAllAnimations } from './animations/animations.js';
import './navbar/navbar.js';

console.log('THREE.js version:', THREE.REVISION);

const { scene, camera, renderer } = initializeScene();

const starCount = 8000;
const { positions, sizes, starsGeometry } = createStars(scene, starCount);

camera.position.z = 5;

animateStars(positions, sizes, starCount, starsGeometry, renderer, scene, camera);

initAllAnimations();
