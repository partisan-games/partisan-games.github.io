import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

const { randFloat } = THREE.MathUtils
const textureLoader = new THREE.TextureLoader()

const decalMaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  map: textureLoader.load('/assets/images/textures/decal-diffuse.png'),
  // normalMap: textureLoader.load('/assets/images/textures/decal-normal.jpg'),
  transparent: true,
  depthTest: true,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  opacity: .8
})

const helper = new THREE.Object3D()

/**
 * Leaves a mark where a shot struck the surface of `intersect`, as big as `size` metres at least and at most: a bullet
 * hole by default. Returns the mark, added to `scene`.
 */
export function shootDecals(intersect, { scene, color, size: [least, most] = [.15, .3] } = {}) {
  const { face, point, object } = intersect

  const normal = face.normal.clone()
  normal.transformDirection(object.matrixWorld)
  normal.add(point)

  helper.position.copy(point)
  helper.lookAt(normal)
  helper.rotation.z = Math.random() * 2 * Math.PI

  const randSize = randFloat(least, most)
  const size = new THREE.Vector3(randSize, randSize, randSize)

  const geometry = new DecalGeometry(object, point, helper.rotation, size)
  const material = decalMaterial.clone()
  if (color !== undefined) // it can be 0
    material.color = new THREE.Color(color)
  const decal = new THREE.Mesh(geometry, material)
  scene.add(decal)
  return decal
}
