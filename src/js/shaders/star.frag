uniform sampler2D pointTexture;
varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
    if (gl_FragColor.a < 0.1) discard;
}