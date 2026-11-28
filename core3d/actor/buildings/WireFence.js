import * as THREE from 'three'
import { loadedModel } from '/core3d/assets/models.js'
import { campModels } from './CampProp.js'

export const models = [campModels['fence-straight']]

/** The stretch of barbed wire as measured on its model, in metres: its length, height and depth. */
const size = { width: 5, height: 2.6, depth: .3 }

/**
 * A stretch of barbed wire on wooden posts, `width` metres long, standing on the ground at its middle. Its mesh is an
 * unseen box of the stretch's size, for a light physics body that a tank knocks over; the drawn fence moves with it.
 */
export default class WireFence {
  static width = size.width
  /** Kilograms: light enough for a tank to push it over, heavy enough to stand until it does. */
  static mass = 30

  constructor() {
    const { width, height, depth } = size
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshBasicMaterial({ visible: false }))
    this.mesh.name = 'WireFence'
    this.mesh.position.y = height / 2
    // the model begins at its first post; its middle is half its length on
    const fence = loadedModel(models[0]).clone(true)
    fence.position.set(-width / 2, -height / 2, 0)
    this.mesh.add(fence)
  }
}
