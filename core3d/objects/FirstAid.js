import GameObject from '/core3d/objects/GameObject.js'
import { loadedModel } from '/core3d/assets/models.js'

const model = { file: 'item/first-aid-kit/4X1LECF6RT2DKR1BQH4NBTCP3.obj', mtl: 'item/first-aid-kit/4X1LECF6RT2DKR1BQH4NBTCP3.mtl', size: .4, shouldAdjustHeight: true }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class FirstAid extends GameObject {
  constructor({ energy = 50, ...rest } = {}) {
    super({ mesh: loadedModel(model), energy, ...rest })
    this.name = 'health'
  }
}