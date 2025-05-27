uniform float opacity;
uniform vec3 coreColor;
uniform vec3 edgeColor;
uniform float transitionRadius;
// Pulse uniforms
uniform float pulseTime;
uniform float pulseSpeedCore;
uniform float pulseSpeedEdge;
uniform float pulseAmplitudeCore;
uniform float pulseAmplitudeEdge;
varying vec2 vUv;

void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUv - center);

    float pulseCore = 1.0 + sin(pulseTime * pulseSpeedCore) * pulseAmplitudeCore;
    float pulseEdge = 1.0 + sin(pulseTime * pulseSpeedEdge + 1.57) * pulseAmplitudeEdge;
    vec3 coreCol = coreColor * pulseCore;
    vec3 edgeCol = edgeColor * pulseEdge;

    float edgeMix = smoothstep(0.0, transitionRadius, dist);
    vec3 color = mix(coreCol, edgeCol, edgeMix);

    float alpha = 1.0 - edgeMix;
    alpha *= opacity;
    
    gl_FragColor = vec4(color, alpha);
}