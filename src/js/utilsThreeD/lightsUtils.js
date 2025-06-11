import * as THREE from 'three';

import { deepMergeOptions } from '../utils/utils';

/**
 * DEFAULT_LIGHTS
 * @description The default lights for the scene
 * @type {Object}
 * @property {number} ambientColor - The color of the ambient light
 * @property {number} ambientIntensity - The intensity of the ambient light
 */
export const DEFAULT_LIGHTS = {
    ambient: {
        enabled: true,
        color: 0xffffff,
        intensity: 1,
    },
    point: {
        enabled: false,
        color: 0xffffff,
        intensity: 1,
        distance: 0,
        decay: 1,
        position: { x: 0, y: 2, z: 0 },
    },
    directional: {
        enabled: false,
        color: 0xffffff,
        intensity: 1,
        direction: { x: 1, y: 1, z: 1 },
        position: { x: 1, y: 1, z: 1 },
    },
    spot: {
        enabled: false,
        color: 0xffffff,
        intensity: 1,
        direction: { x: 0, y: 0, z: 2 },
        position: { x: 0, y: 0, z: 0 },
    },
    hemisphere: {
        enabled: false,
        skyColor: 0xffffff,
        groundColor: 0x444444,
        intensity: 1,
    },
};

/**
 * addLightsToScene
 * @description The function to add lights to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The lights
 */
export function addLightsToScene(scene, config = {}) {
    const lights = deepMergeOptions(DEFAULT_LIGHTS, config);

    lights.ambient = addAmbientLight(scene, lights.ambient);
    lights.point = addPointLight(scene, lights.point);
    lights.directional = addDirectionalLight(scene, lights.directional);
    lights.spot = addSpotLight(scene, lights.spot);
    lights.hemisphere = addHemisphereLight(scene, lights.hemisphere);
    
    return lights;
}

/**
 * addAmbientLight
 * @description The function to add the ambient light to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The ambient light
 */
export function addAmbientLight(scene, config) {
    if (!config.enabled) return null;
    const ambient = new THREE.AmbientLight(config.color, config.intensity);
    scene.add(ambient);
    return ambient;
}

/**
 * addPointLight
 * @description The function to add the point light to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The point light
 */
export function addPointLight(scene, config) {
    if (!config.enabled) return null;
    const point = new THREE.PointLight(
        config.color,
        config.intensity,
        config.distance || 0,
        config.decay || 1
    );
    point.position.set(
        config.position.x,
        config.position.y,
        config.position.z
    );
    scene.add(point);
    return point;
}

/**
 * addDirectionalLight
 * @description The function to add the directional light to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The directional light
 */
export function addDirectionalLight(scene, config) {
    if (!config.enabled) return null;
    const dir = new THREE.DirectionalLight(config.color, config.intensity);
    if (config.position) {
        dir.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );
    }
    scene.add(dir);
    return dir;
}

/**
 * addSpotLight
 * @description The function to add the spot light to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The spot light
 */
export function addSpotLight(scene, config) {
    if (!config.enabled) return null;
    const spot = new THREE.SpotLight(config.color, config.intensity);
    if (config.position) {
        spot.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );
    }
    scene.add(spot);
    return spot;
}

/**
 * addHemisphereLight
 * @description The function to add the hemisphere light to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The hemisphere light
 */
export function addHemisphereLight(scene, config) {
    if (!config.enabled) return null;
    const hemi = new THREE.HemisphereLight(
        config.skyColor,
        config.groundColor,
        config.intensity
    );
    scene.add(hemi);
    return hemi;
}