uniform float time;
uniform float scaleMin;
uniform float scaleMax;
uniform float pulseSpeed;
uniform float pulseIntensity;
uniform float highlightIntensity;
uniform float syncWithObject;
uniform float syncScale;
uniform float cardScale;
varying vec2 vUv;
varying float vPulse;

void main() {
    vUv = uv;
    float basePulse = sin(time * pulseSpeed) * 0.5 + 0.5;
    basePulse = pow(basePulse, 1.5) * pulseIntensity;
    float objectInfluence = smoothstep(0.0, 1.0, highlightIntensity) * syncWithObject;
    float combinedEffect = mix(
        basePulse,
        basePulse * (1.0 + objectInfluence),
        smoothstep(0.0, 1.0, objectInfluence)
    );
    float scale;
    if (syncScale > 0.5) {
        scale = cardScale;
    } else {
        scale = scaleMin + (scaleMax - scaleMin) * pow(combinedEffect, 1.2);
    }
    vPulse = scale;
    vec3 scaledPosition = position * scale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
}