import { loadedModel } from '/core3d/assets/models.js'

export const models = [{ file: 'props/sandbags/sandbags.glb', scale: 1, receiveShadow: true }]

/** One supplied sandbag wall, in metres, resting on the ground. */
export default class Sandbags {
  constructor() {
    this.mesh = loadedModel(models[0]).clone(true)
    this.mesh.name = 'Sandbags'
  }
}
