import Sprite from '/core/actor/Sprite.js'
import platno, { ctx } from '/core/io/platno.js'
import mish from '/core/io/mish.js'
import Vreme from '/core/Vreme.js'
import { randomInRange } from '/core/utils.js'
import config from '/config.js'

const rafal = new Audio('/assets/sounds/rafal.mp3')

export default class Okupator extends Sprite {
  constructor({ callback } = {}) {
    super ('sprites/vojnici/okupator-sprite.png', {
      imena: ['nagore', 'nadole', 'nalevo', 'nadesno', 'umire'], brojKadrova: 5, sirina: 50, visina: 180
    })
    this.y = platno.height * .75
    this.callback = callback
    this.pucanjeSlika = new Image()
    this.pucanjeSlika.src = 'assets/images/pucanje.png'
    this.pripucao = false
    this.vreme = new Vreme()
    this.vremeHodanja = randomInRange(700, 3200)
    this.kreni()
  }

  kreni() {
    const izlaziLevo = Math.random() > .5
    this.x = izlaziLevo ? 0 : platno.width
    this.defaultAnimacija = izlaziLevo ? 'nadesno' : 'nalevo'
    this.brzina = izlaziLevo ? 200 : -200
  }

  pucaj(dt) {
    this.dodeliAnimaciju('nadole', false)
    this.stani()
    rafal.volume = randomInRange(config.volume * 0.5, config.volume * 1.25)
    rafal.play()
    this.pripucao = true
    if (this.callback) this.callback(dt)
  }

  proveriPogodak(callback) {
    if (!mish.iznad(this)) return
    this.umri()
    if (callback) callback()
  }

  umri() {
    super.umri()
    this.pripucao = false
    this.dodeliAnimaciju('umire', false)
  }

  render() {
    super.render()
    if (this.pripucao)
      ctx.drawImage(this.pucanjeSlika, this.x - 15, this.y - 25)
  }

  update(dt, t) {
    super.update(dt, t)
    if (!this.ziv) return

    if (this.vreme.proteklo > this.vremeHodanja)
      this.pucaj(dt)
  }
}
