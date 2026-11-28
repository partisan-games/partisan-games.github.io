import * as THREE from 'three'
import Sandbags, { models } from './Sandbags.js'

export { models }

/** The supplied sandbag wall as measured on its model, in metres: its length, height and depth. */
const size = { width: 4.27, height: 1.1, depth: 1.11 }

/**
 * A sandbag wall of a trench or a gun nest, standing on the ground at its middle. Its mesh is an unseen box of the
 * wall's size, for a physics body that a tank can push aside; the drawn sandbags move with it.
 */
export default class SandbagWall {
  static width = size.width
  /** Kilograms, as heavy for its length as a stretch of the street barricades, which a tank pushes too. */
  static mass = 160

  constructor() {
    const { width, height, depth } = size
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshBasicMaterial({ visible: false }))
    this.mesh.name = 'SandbagWall'
    this.mesh.position.y = height / 2
    const bags = new Sandbags().mesh
    bags.position.y = -height / 2
    this.mesh.add(bags)
  }
}
