import GameObject2D from '/core/actor/GameObject2D.js'

export default class Mina extends GameObject2D {
  constructor(params) {
    super('items/nagazna.png', { scale: .75, flammable: true, ...params })
  }

  proveriSudar(telo) {
    if (this.collidesWith(telo)) {
      this.die()
      telo.die()
    }
  }
}