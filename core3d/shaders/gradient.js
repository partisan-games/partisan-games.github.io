import * as THREE from 'three'
import { skyColors } from '/core3d/constants.js'

const fragmentShader = /* glsl */`
  uniform vec2 resolution; // uniform variables must be declared here
  uniform vec3 color1;
  uniform vec3 color2;

  void main() {
    vec2 coord = gl_FragCoord.xy / resolution.xy; // normalize coordinates
    vec3 rgb = mix( color2, color1, coord.y );
    gl_FragColor = vec4( rgb, 1.0 );
  }
`

const createUniforms = () => ({
  color1: { value: new THREE.Color(skyColors.top) },
  color2: { value: new THREE.Color(skyColors.horizon) },
  resolution: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
})

export const createMaterial = () => new THREE.ShaderMaterial({ uniforms: createUniforms(), fragmentShader })