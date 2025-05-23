import * as THREE from 'three';

import { mergeOptionsWithObjectConfig } from '../utils/utils';

/**
 * DEFAULT_LIGHTS
 * @description The default lights for the scene
 * @type {Object}
 * @property {number} ambientColor - The color of the ambient light
 * @property {number} ambientIntensity - The intensity of the ambient light
 */
export const DEFAULT_LIGHTS = {
    ambientColor: 0xffffff,
    ambientIntensity: 0.5,
    pointColor: 0xffffff,
    pointIntensity: 1,
    pointPosition: { x: 0, y: 2, z: 0 }
};

/**
 * addLightsToScene
 * @description The function to add lights to the scene
 * @param {Object} scene - The scene
 * @param {Object} config - The config
 * @returns {Object} - The lights
 */
export function addLightsToScene(scene, config = {}) {
    const lights = mergeOptionsWithObjectConfig(DEFAULT_LIGHTS, config);
    console.log('lights', lights);
    lights.ambient = addAmbientLight(scene, lights);
    lights.point = addPointLight(scene, lights);
    lights.directional = addDirectionalLight(scene, lights);
    lights.spot = addSpotLight(scene, lights);
    lights.hemisphere = addHemisphereLight(scene, lights);
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
    const ambient = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity);
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
    const point = new THREE.PointLight(
        config.pointColor,
        config.pointIntensity,
        config.pointDistance || 0,
        config.pointDecay || 1
    );
    point.position.set(
        config.pointPosition.x,
        config.pointPosition.y,
        config.pointPosition.z
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
    if (!config.directionalEnabled) return null;
    const dir = new THREE.DirectionalLight(config.directionalColor || 0xffffff, config.directionalIntensity || 1);
    if (config.directionalPosition) {
        dir.position.set(
            config.directionalPosition.x,
            config.directionalPosition.y,
            config.directionalPosition.z
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
    if (!config.spotEnabled) return null;
    const spot = new THREE.SpotLight(config.spotColor || 0xffffff, config.spotIntensity || 1);
    if (config.spotPosition) {
        spot.position.set(
            config.spotPosition.x,
            config.spotPosition.y,
            config.spotPosition.z
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
    if (!config.hemiEnabled) return null;
    const hemi = new THREE.HemisphereLight(
        config.hemiSkyColor || 0xffffff,
        config.hemiGroundColor || 0x444444,
        config.hemiIntensity || 1
    );
    scene.add(hemi);
    return hemi;
}