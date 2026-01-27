import Player2D from '/core/actor/Player2D.js'
import Sprite from '/core/actor/Sprite.js'

export default class Bombas extends Player2D {

  constructor({ x = 100, y = 100 } = {}) {
    super('armies/partizani/vojnici/bombasi/partizan-bombas.gif', { x, y })
    this.potisak = 75
    this.faktorTrenja = 0.3
    this.krv = new Sprite('sprites/efekti/krv-mala.png', {
      imena: ['prska'], brojKadrova: 8, vremeAnimacije: .4,
    })
    this.krv.sakrij()
    this.predmeti.push(this.krv)
  }

  reagujNaPogodak() {
    super.umri()
    this.krv.dodeliAnimaciju('prska', false)
    this.krv.pokazi()
  }

  update(dt) {
    super.update(dt)
    this.krv.x = this.x + 5
    this.krv.y = this.y - 10
  }
}
