uniform float time;
uniform vec2 resolution;
varying vec2 vUv;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUv - center);
    
    // Base core glow
    float core = smoothstep(0.5, 0.0, dist);
    
    // Add noise for unevenness
    float noise1 = noise(vUv * 10.0 + time);
    float noise2 = noise(vUv * 20.0 - time * 0.5);
    
    // Mix colors
    vec3 color1 = vec3(0.8, 0.4, 1.0); // Light purple
    vec3 color2 = vec3(0.4, 0.0, 0.8); // Dark purple
    vec3 finalColor = mix(color2, color1, core + noise1 * 0.2);
    
    float alpha = core * (1.0 + noise2 * 0.3);
    gl_FragColor = vec4(finalColor, alpha);
}