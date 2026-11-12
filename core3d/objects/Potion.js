import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = { file: 'item/potion/potion.obj', mtl: 'item/potion/potion.mtl', size: .75, shouldAdjustHeight: true }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class Potion extends GameObject {
  constructor({ energy = 50, ...rest } = {}) {
    super({ mesh: loadedModel(model), energy, ...rest })
    this.name = 'health'
  }
}