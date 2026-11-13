import Sprite from '../Sprite.js'

const vremeZaustavljanja = .15

export default class BombasSprite extends Sprite {
  constructor() {
    super('sprites/vojnici/bombas-idle.png', {
      imena: ['idle', 'kretanje'], brojKadrova: [2, 8], defaultAnimacija: 'idle',
      vremeAnimacije: .6, sirina: 66, visina: 72,
    })
    this.animira = true
    this.kretanje = false
    this.brzinaHoda = 0
    this.preostaloZaustavljanja = 0
  }

  update(dt) {
    if (!this.animira) this.preostaloZaustavljanja = 0
    else if (this.kretanje) this.preostaloZaustavljanja = vremeZaustavljanja
    else this.preostaloZaustavljanja = Math.max(0, this.preostaloZaustavljanja - dt)
    const walking = this.animira && (this.kretanje || this.preostaloZaustavljanja > 0)
    this.dodeliAnimaciju(walking ? 'kretanje' : 'idle')
    this.vremeAnimacije = walking ? .8 : .6
    const slowdown = this.kretanje ? 1 : this.preostaloZaustavljanja / vremeZaustavljanja
    // At full speed (~192px/s), play three steps per second with continuous phase.
    const animationDt = walking ? dt * this.brzinaHoda / 160 * slowdown : dt
    if (this.animira) super.update(animationDt)
    else this.reset()
  }

  render() {
    if (this.prikazan) super.render()
  }
}
