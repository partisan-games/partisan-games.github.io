import * as THREE from 'three'
import { sample, similarColor } from '/core3d/helpers.js'
import { assets } from '/config.js'

const textureLoader = new THREE.TextureLoader()
textureLoader.setPath(`${assets.textures}planets/`)

function createRing(radius, tube, color) {
  const geometry = new THREE.TorusGeometry(radius, tube, 2, 35)
  const material = new THREE.MeshBasicMaterial({ color })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = Math.PI * .5
  return ring
}

export function addRings(planet) {
  const r = planet.geometry.parameters.radius
  const colors = [0xDDBC77, 0x665E4E, 0x7C776B]
  const color = sample(colors)
  planet.add(createRing(r * 1.4, r * .24, similarColor(color, .33)))
  planet.add(createRing(r * 1.9, r * .24, similarColor(color, .33)))
  planet.add(createRing(r * 2.4, r * .24, similarColor(color, .33)))
  return planet
}
