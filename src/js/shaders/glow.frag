uniform vec3 color;
uniform float opacity;
uniform float cardProgress;
uniform float syncOpacity;
uniform float cardOpacity;
varying vec2 vUv;
varying float vPulse;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    float glow = smoothstep(0.5, 0.0, dist);
    float falloff = pow(1.0 - smoothstep(0.0, 0.5, dist), 2.0);
    float intensity = glow * falloff;
    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    intensity *= 0.9 + 0.1 * noise;
    float finalOpacity = opacity;
    if (syncOpacity > 0.5) {
        finalOpacity = cardOpacity;
    }
    gl_FragColor = vec4(color, intensity * finalOpacity);
}