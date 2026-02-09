import GameObject from '/core3d/objects/GameObject.js'
import { loadModel } from '/core3d/loaders.js'

const mesh = await loadModel({ file: 'item/potion/potion.obj', mtl: 'item/potion/potion.mtl', size: .75, shouldAdjustHeight: true })

export default class Potion extends GameObject {
  constructor({ energy = 50, ...rest } = {}) {
    super({ mesh, energy, ...rest })
    this.name = 'health'
  }
}