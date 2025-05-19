/**
 * @description Gets the animated rotation
 * @param {number} t - The time
 * @param {Object} rotationParams - The rotation parameters
 * @returns {Object} The animated rotation
 */
export function getAnimatedRotation(t, rotationParams) {
    return {
        x: Math.sin(t * rotationParams.x.speed + (rotationParams.x.phase || 0)) * (rotationParams.x.amplitude || 0),
        y: Math.cos(t * rotationParams.y.speed + (rotationParams.y.phase || 0)) * (rotationParams.y.amplitude || 0),
        z: Math.sin(t * rotationParams.z.speed + (rotationParams.z.phase || 0)) * (rotationParams.z.amplitude || 0),
    };
}

/**
 * @description Gets the animated position
 * @param {number} t - The time
 * @param {Object} positionParams - The position parameters
 * @returns {Object} The animated position
 */
export function getAnimatedPosition(t, positionParams) {
    return {
        x: Math.sin(t * positionParams.x.speed + (positionParams.x.phase || 0)) * (positionParams.x.amplitude || 0),
        y: Math.sin(t * positionParams.y.speed + (positionParams.y.phase || 0)) * (positionParams.y.amplitude || 0),
        z: positionParams.z.basePosition - Math.abs(Math.sin(t * positionParams.z.speed + (positionParams.z.phase || 0)) * (positionParams.z.amplitude || 0)),
    };
}

/**
 * @description Gets the animated scale
 * @param {number} t - The time
 * @param {Object} scaleParams - The scale parameters
 * @returns {Object} The animated scale
 */
export function getAnimatedScale(t, scaleParams) {
    const scale = 1 + Math.sin(t * scaleParams.speed) * (scaleParams.amplitude || 0);
    return { x: scale, y: scale, z: scale };
}