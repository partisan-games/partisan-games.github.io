import { keyboard } from '/core/io/Keyboard.js'
import Predmet from '/core/actor/Predmet.js'
import { praviEnergiju } from '/core/actor/prosirenja/energija.js'
import Djule from './Djule.js'

const skalar = .75
const GORNJI_UGAO = 5.68
const DONJI_UGAO = 6.2

export default class Top extends Predmet {
  constructor({ x, y, ciljevi = [] } = {}) {
    super('armies/top-cev.gif', { x, y, skalar, zapaljiv: true })
    this.postolje = new Predmet('armies/top-postolje.gif', { x: x - 40, y: y + 32, skalar })
    this.pocetniX = x
    this.ugao = -0.2
    this.sila = this.minSila = 300
    this.projektili = Array.from({ length: 5 }, () => new Djule())
    this.predmeti = [...this.projektili, this.postolje]
    this.ciljevi = ciljevi
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(praviEnergiju()))
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
    if (keyboard.space)
      this.sila += 10
    else if (this.sila > this.minSila)
      this.pali()

    if (keyboard.pressed.KeyW)
      this.ugao = Math.max(this.ugao - 0.5 * dt, GORNJI_UGAO)
    if (keyboard.pressed.KeyS)
      this.ugao = Math.min(this.ugao + 0.5 * dt, DONJI_UGAO)
  }

  proveriPogodak() {
    this.projektili.forEach(projektil => {
      if (projektil.vidljiv)
        this.ciljevi.forEach(cilj => projektil.proveriPogodak(cilj))
    })
  }

  reagujNaPogodak(steta) {
    this.skiniEnergiju(steta)
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
