uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform vec3 coreColor;   
uniform vec3 edgeColor;  
uniform vec3 glowColor;
uniform float glowStrength;
uniform float pulseFreqs[3];
uniform float pulseAmps[3];
uniform float pulsePhases[3];
uniform float pulseNoiseScale;
uniform float pulseNoiseSpeed;
uniform float coreGlowStrength;
uniform float coreGlowRadius;
varying vec2 vUv;

// Простая функция шума (GLSL)
float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0;
    return mix(mix(hash(n+0.0), hash(n+1.0), f.x),
               mix(hash(n+57.0), hash(n+58.0), f.x), f.y);
}

void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUv - center);

    // 1. Gradient
    float edgeMix = smoothstep(0.0, 0.1, dist);
    vec3 color = mix(coreColor, edgeColor, edgeMix);

    // 2. Glow: pink (core) -> glowColor (edge)
    float glowMix = smoothstep(0.7, 1.0, dist);
    color = mix(color, glowColor, glowMix * glowStrength);

    // --- Core Glow (extra glow) ---
    float coreGlow = pow(smoothstep(coreGlowRadius, 0.0, dist), 2.0) * coreGlowStrength;
    color = mix(color, coreColor, coreGlow);

    // --- Outer Glow  ---
    float outerGlow = pow(smoothstep(0.5, 1.0, dist), 2.0) * glowStrength * 0.7;
    color = mix(color, glowColor, outerGlow);

    // ooth sum of pulsation waves
    float t = time * 2.0;
    float pulse = 0.0;
    float totalAmp = 0.0;
    for (int i = 0; i < 3; i++) {
        pulse += sin(t * pulseFreqs[i] + pulsePhases[i]) * pulseAmps[i];
        totalAmp += pulseAmps[i];
    }
    pulse = 0.7 + 0.3 * (pulse / totalAmp);

    // Let's add some noise to liven things up.
    float n = noise(vUv * 10.0 + time * pulseNoiseSpeed);
    pulse += pulseNoiseScale * n;

    // Using pulse to control coreAlpha
    float coreAlpha = smoothstep(0.35 * pulse, 0.0, dist);

    // lpha: core + soft glow + coreGlow + outerGlow
    float glowAlpha = pow(smoothstep(0.7, 1.0, dist), glowStrength); 
    float flicker = 0.97 + 0.03 * n;

    float alpha = 0.7 * coreAlpha + 0.5 * glowAlpha + 0.6 * coreGlow + 0.4 * outerGlow;
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= opacity;

    gl_FragColor = vec4(color, alpha);
}