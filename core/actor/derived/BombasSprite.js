import Sprite from '../Sprite.js'

export default class BombasSprite extends Sprite {
  constructor() {
    super('sprites/vojnici/bombas-idle.png', {
      imena: ['idle', 'kretanje'], brojKadrova: [2, 8], defaultAnimacija: 'idle',
      vremeAnimacije: .6, sirina: 66, visina: 72,
    })
    this.animira = true
    this.kretanje = false
    this.brzinaHoda = 0
  }

  update(dt) {
    this.dodeliAnimaciju(this.animira && this.kretanje ? 'kretanje' : 'idle')
    this.vremeAnimacije = this.kretanje ? .8 : .6
    // At full speed (~192px/s), play three steps per second with continuous phase.
    const animationDt = this.kretanje ? dt * this.brzinaHoda / 160 : dt
    if (this.animira) super.update(animationDt)
    else this.reset()
  }

  render() {
    if (this.prikazan) super.render()
  }
}
