import * as THREE from 'three'
import { skyColors } from '/core3d/constants.js'

const vertexShader = /* glsl */`
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`

const fragmentShader = /* glsl */`
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float offset;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float height = normalize( vWorldPosition + offset ).y;
    float weight = pow( max( height , 0.0), exponent );
    vec3 rgb = mix( color2, color1, weight );
    gl_FragColor = vec4( rgb, 1.0 );
  }
`

const uniforms = {
  color1: { value: new THREE.Color(skyColors.top) },
  color2: { value: new THREE.Color(skyColors.horizon) },
  offset: { value: 33 },
  exponent: { value: 0.6 }
}

export const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
})