import Player2D from '/core/actor/Player2D.js'
import Sprite from '/core/actor/Sprite.js'
import BombasSprite from './BombasSprite.js'

export default class Bombas extends Player2D {

  constructor({ x = 100, y = 100 } = {}) {
    super(null, { x, y, sirina: 66, visina: 72 })
    this.sprite = new BombasSprite()
    this.sprite.polozaj = this.polozaj
    this.potisak = 75
    this.faktorTrenja = 0.3
    this.krv = new Sprite('sprites/efekti/krv-mala.png', {
      imena: ['prska'], brojKadrova: 8, vremeAnimacije: .4,
    })
    this.krv.sakrij()
    this.predmeti.push(this.sprite, this.krv)
    this.polozaj.z = -1
  }

  reagujNaPogodak() {
    super.umri()
    this.krv.dodeliAnimaciju('prska', false)
    this.krv.pokazi()
  }

  update(dt) {
    super.update(dt)
    const moving = this.input.left || this.input.right || this.input.up || this.input.down || this.brzina > 1
    this.sprite.animira = this.alive
    this.sprite.kretanje = Boolean(moving)
    this.sprite.brzinaHoda = this.brzina
    this.sprite.vidljiv = this.vidljiv
    this.krv.x = this.x + 5
    this.krv.y = this.y - 10
  }

  // The child sprite draws the player; the parent keeps movement and collision bounds.
  render() {}
}
