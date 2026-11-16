import GameObject2D from '/core/actor/GameObject2D.js'

export default class Bunker extends GameObject2D {
  constructor({ x, y, scale = .5, flammable = true, ...rest } = {}) {
    super('buildings/kuca-bunker.png', { x, y, z: -1, scale, flammable, ...rest })
  }
}
