uniform float time;
uniform vec2 resolution;
uniform float opacity;
uniform vec3 coreColor;   
uniform vec3 edgeColor;  
uniform vec3 glowColor;
uniform float glowStrength;
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

    // 1. Градиент: белый (центр) -> розовый (середина)
    float edgeMix = smoothstep(0.0, 0.1, dist);
    vec3 color = mix(coreColor, edgeColor, edgeMix);

    // 2. Glow: розовый (ядро) -> glowColor (край)
    float glowMix = smoothstep(0.7, 1.0, dist);
    color = mix(color, glowColor, glowMix * glowStrength);

    // Несколько волн
    float t = time * 2.0;
    float pulse1 = sin(t) * 0.5 + 0.5;
    float pulse2 = sin(t * 0.37 + 1.7) * 0.3 + 0.3;
    float pulse3 = sin(t * 1.31 - 2.0) * 0.2 + 0.2;

    // Суммарная пульсация
    float pulse = 0.7 + 0.3 * (pulse1 + pulse2 + pulse3);

    // Добавим шум для "живости"
    float n = noise(vUv * 10.0 + time * 0.5);
    pulse += 0.08 * n;

    // Используем pulse для управления coreAlpha
    float coreAlpha = smoothstep(0.35 * pulse, 0.0, dist);

    // Альфа: ядро + мягкое свечение
    float glowAlpha = pow(smoothstep(0.7, 1.0, dist), glowStrength); // экспоненциальное усиление свечения
    
    float flicker = 0.97 + 0.03 * n;

    float alpha = 0.7 * coreAlpha + 0.5 * glowAlpha;
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= opacity;

    gl_FragColor = vec4(color, alpha);
}