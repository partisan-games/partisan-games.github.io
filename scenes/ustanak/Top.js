import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys as keys } from '/core/io/keys.js'
import Predmet from '/core/actor/Predmet.js'
import Health from '/core/gameplay/Health.js'
import Djule from './Djule.js'

const skalar = .75
const GORNJI_UGAO = 5.68
const DONJI_UGAO = 6.2

export default class Top extends Predmet {
  constructor({ x, y, clock, ciljevi = [] } = {}) {
    super('armies/game-ready/top-cev.gif', { x, y, skalar, zapaljiv: true })
    this.postolje = new Predmet('armies/game-ready/top-postolje.gif', { x: x - 40, y: y + 32, skalar })
    this.pocetniX = x
    this.ugao = -0.2
    this.sila = this.minSila = 300
    this.projektili = Array.from({ length: 5 }, () => new Djule({ clock }))
    this.predmeti = [...this.projektili, this.postolje]
    this.ciljevi = ciljevi
    this.health = new Health()
  }

  get energija() {
    return this.health.current
  }

  get alive() {
    return this.health.alive
  }

  set alive(value) {
    if (!this.health) return
    if (value) this.health.reset()
    else this.health.damage(this.health.current)
  }

  get zapaljen() {
    return this.zapaljiv && this.health.current <= 20
  }

  get vrhX() {
    return this.x + this.sirina * 0.5 * Math.cos(-this.ugao)
  }

  get vrhY() {
    return this.y - this.sirina * 0.5 * Math.sin(-this.ugao) + 8
  }

  pali() {
    const projektil = this.projektili.find(p => !p.vidljiv)
    if (!projektil) return

    const polozaj = { x: this.vrhX, y: this.vrhY }
    projektil.pali(polozaj, this.ugao, this.sila)
    this.x -= 5
    this.sila = this.minSila
  }

  handleInput(dt) {
    if (keyboard.isDown(keys.shoot))
      this.sila += 10
    else if (this.sila > this.minSila)
      this.pali()

    if (keyboard.isDown(keys.up))
      this.ugao = Math.max(this.ugao - 0.5 * dt, GORNJI_UGAO)
    if (keyboard.isDown(keys.down))
      this.ugao = Math.min(this.ugao + 0.5 * dt, DONJI_UGAO)
  }

  proveriPogodak() {
    this.projektili.forEach(projektil => {
      if (projektil.vidljiv)
        this.ciljevi.forEach(cilj => projektil.proveriPogodak(cilj))
    })
  }

  reagujNaPogodak(steta) {
    this.health.damage(steta)
  }

  sudara(predmet) {
    return super.sudara(predmet) || this.postolje.sudara(predmet)
  }

  update(dt) {
    super.update(dt)
    this.proveriPogodak()
    if (this.x < this.pocetniX) this.x += 20 * dt
  }
}
