import * as THREE from 'three'
import { createTexture } from '/core3d/helpers.js'

/** A concrete block, in metres: its length, height and depth. */
export const block = { width: 1, height: .5, depth: .5 }

/** Kilograms: light enough for a tank to scatter a wall of them, for the joy of it (owner, 2026-11-28). */
export const blockMass = 40

/** The look of the blocks of one game, the concrete of the forts of Jablanica; the scene that ends frees it. */
export function concreteMaterial() {
  const map = createTexture({ file: 'terrain/concrete.jpg' })
  map.magFilter = THREE.LinearFilter
  map.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshLambertMaterial({ map, color: 0xb4bec7 })
}

/**
 * The middles of the blocks of a wall `length` metres long and `courses` high, along x, standing on the ground at its
 * middle: each course laid half a block along from the one under it, as a mason lays them.
 */
export function wallCourses(length, courses) {
  const { width, height } = block
  const places = []
  for (let course = 0; course < courses; course++) {
    const shift = course % 2 ? width / 2 : 0
    for (let x = -length / 2 + width / 2 + shift; x + width / 2 <= length / 2 + 1e-9; x += width)
      places.push({ x, y: height * (course + .5) })
  }
  return places
}

/** One concrete block of `material`, its mesh a box for a loose physics body, centred where it is put. */
export default class ConcreteBlock {
  static mass = blockMass

  constructor(material) {
    const { width, height, depth } = block
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
    this.mesh.name = 'ConcreteBlock'
    this.mesh.castShadow = this.mesh.receiveShadow = true
  }
}
