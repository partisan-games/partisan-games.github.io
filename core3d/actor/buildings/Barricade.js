import * as THREE from 'three'
import { loadedModel } from '/core3d/assets/models.js'

export const models = [{ file: 'props/barricade-sandbags/model.glb', scale: 1, receiveShadow: true }]

/** The stretch of sandbags as measured on its model, in metres: its width and depth, and its top above the ground. */
const size = { width: 2.92, depth: .94, height: 1.27 }

/**
 * A stretch of sandbag barricade, `width` metres across a street, standing on the ground at its middle. Its mesh is an
 * unseen box of the wall's size, for a physics body that a tank can push; the drawn sandbags move with it.
 */
export default class Barricade {
  static width = size.width

  constructor() {
    const { width, depth, height } = size
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshBasicMaterial({ visible: false }))
    this.mesh.name = 'Barricade'
    this.mesh.position.y = height / 2
    const bags = loadedModel(models[0]).clone(true)
    bags.position.y = -height / 2
    this.mesh.add(bags)
  }
}
