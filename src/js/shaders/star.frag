uniform float glowStrength;
uniform vec3 glowColor;
uniform sampler2D pointTexture;
uniform float opacity;
varying vec3 vColor;

void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float glow = (1.0 - smoothstep(0.4, 0.5, dist)) * glowStrength;
    vec3 finalColor = mix(vColor, glowColor, glow);
    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * opacity);
    if (gl_FragColor.a < 0.1) discard;
}