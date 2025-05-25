import * as THREE from 'three';

export class ShaderController {
    constructor({ vertexShader, fragmentShader, uniforms = {}, options = {} }) {
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { ...uniforms },
            ...options
        });
    }

    setUniform(name, value) {
        if (this.material.uniforms[name]) {
            this.material.uniforms[name].value = value;
        }
    }

    updateUniforms(uniforms) {
        Object.entries(uniforms).forEach(([key, value]) => this.setUniform(key, value));
    }

    getMaterial() {
        return this.material;
    }
}