import * as THREE from 'three'
import { skyColors } from '/core3d/constants.js'

const vertexShader = /* glsl */`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
  }
`

const createUniforms = () => ({
  color1: { type: 'vec3', value: new THREE.Color(skyColors.horizon) },
  color2: { type: 'vec3', value: new THREE.Color(skyColors.top) },
})

export const createMaterial = () => new THREE.ShaderMaterial({
  uniforms: createUniforms(),
  vertexShader,
  fragmentShader
})