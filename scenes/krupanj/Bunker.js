import Predmet from '/core/actor/Predmet.js'

export default class Bunker extends Predmet {
  constructor({ x, y, skalar = .5, zapaljiv = true, ...rest } = {}) {
    super('buildings/kuca-bunker.png', { x, y, z: -1, skalar, zapaljiv, ...rest })
  }
}
