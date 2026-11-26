import { loadedModel } from '/core3d/assets/models.js'

const monument = { file: 'building/monument/milutin.glb', scale: 1, receiveShadow: true }

export const models = [monument]

export default class Milutin {
  constructor() {
    this.mesh = loadedModel(monument).clone(true)
    this.mesh.name = 'Milutin'
  }
}
