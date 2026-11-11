import Player2D from '/core/actor/Player2D.js'
import { frames } from '/core/konstante.js'
import { praviRakete } from '/core/actor/prosirenja/pucanje.js'

const OKRET = 0.01
const MOGUCNOST_OKRETA = 0.066
const gravitacija = 3

export default class AvionIgrac extends Player2D {
  constructor(nivoTla, src = 'armies/partizani/potez-25.png') {
    super(src, { skalar: .55, zapaljiv: true, buttonDict: { attack: '🚀', special: '🎯' } })
    this.brzina = 0
    this.nivoTla = nivoTla
    Object.assign(this, praviRakete({ vremePunjenja: 1.5 }))
  }

  get jeNaVrhu() {
    return this.y <= this.visina / 2
  }

  get jePrizemljen() {
    return this.y + this.visina / 2 >= this.nivoTla
  }

  proveriGranice() {
    this.ogranici()
  }

  /** KOMANDE ***/

  handleInput(dt) {
    super.handleInput(dt)
    if (this.input.special)
      this.pucaCiljano()
  }

  nalevo(dt) {
    if (!this.jePrizemljen) super.nalevo(dt)
  }

  nagore(dt) {
    if (this.jeNaVrhu) return

    super.nagore(dt)
    if (this.ugao === 0 || this.ugao >= 2 * Math.PI - MOGUCNOST_OKRETA)
      this.ugao -= OKRET * frames(dt)
  }

  nadole(dt) {
    if (this.jePrizemljen) return

    super.nadole(dt)
    if (this.ugao <= MOGUCNOST_OKRETA)
      this.ugao += OKRET * frames(dt)
  }

  puca() {
    const poz = { x: this.x + 5, y: this.y + 15 }
    this.pali(poz, this.ugao + Math.PI / 16)
  }

  /** OSTALO ***/

  ispraviAvion(dt) {
    if (this.input.up || this.input.down || this.ugao === 0) return
    const korak = OKRET * frames(dt)
    const doVodoravnog = this.ugao < Math.PI ? this.ugao : 2 * Math.PI - this.ugao
    // steps vary with the frame length, so snap to level instead of overshooting it
    if (doVodoravnog <= korak) this.ugao = 0
    else this.ugao += this.ugao < Math.PI ? -korak : korak
  }

  proveriTlo() {
    if (!this.jePrizemljen) return
    if (this.ugao > MOGUCNOST_OKRETA / 2) this.umri()
  }

  dodajGravitaciju(dt) {
    if (this.jePrizemljen) return

    const teza = this.dead ? gravitacija * 100 : gravitacija
    this.dodajSilu(teza * frames(dt), Math.PI * .5)
  }

  proveriSudare() {
    this.cvrstaTela.forEach(predmet => {
      if (!this.sudara(predmet)) return
      this.umri()
      predmet.umri()
    })
  }

  update(dt, t) {
    super.update(dt, t)
    this.proveriTlo()
    this.proveriSudare()
    this.proveriPogotke()
    this.dodajGravitaciju(dt)
    this.ispraviAvion(dt)
  }
}
