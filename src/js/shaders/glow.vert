uniform float time;
uniform float syncScale;
varying vec2 vUv;

void main() {
    vUv = uv;

    vec3 scaledPosition = position * syncScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
}