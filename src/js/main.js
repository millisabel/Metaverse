
import * as THREE from 'three';
import { initializeScene, createStars, animateStars } from './galaxy/galaxy.js';

console.log('THREE.js version:', THREE.REVISION);
console.log('THREE object:', THREE);

// // Инициализируем сцену, камеру и рендерер
const { scene, camera, renderer } = initializeScene();

// // Создаем звезды
const starCount = 8000;
const { positions, sizes, starsGeometry } = createStars(scene, starCount);

// // Устанавливаем камеру
camera.position.z = 5;

// // Запускаем анимацию
animateStars(positions, sizes, starCount, starsGeometry, renderer, scene, camera);
