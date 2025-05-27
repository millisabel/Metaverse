uniform float opacity;
uniform vec3 coreColor;
uniform vec3 edgeColor;
varying vec2 vUv;

void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUv - center);

    // Градиент между coreColor (центр) и edgeColor (край)
    float edgeMix = smoothstep(0.0, 0.35, dist);
    vec3 color = mix(coreColor, edgeColor, edgeMix);

    // Прозрачность уменьшается к краю
    float alpha = 1.0 - edgeMix;
    alpha *= opacity;
    
    gl_FragColor = vec4(color, alpha);
}