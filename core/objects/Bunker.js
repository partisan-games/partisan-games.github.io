import GameObject2D from '/core/actor/GameObject2D.js'

/** The size the house bunker is drawn at in the game Bunker, where its machine gunner keeps his own size. */
export const bunkerScale = .5

export default class Bunker extends GameObject2D {
  constructor({ x, y, scale = bunkerScale, flammable = true, ...rest } = {}) {
    super('buildings/kuca-bunker.png', { x, y, z: -1, scale, flammable, ...rest })
  }
}
