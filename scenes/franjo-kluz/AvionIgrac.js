import { keyboard } from '/core/io/Keyboard.js'
import Player2D from '/core/actor/Player2D.js'
import { praviRakete } from '/core/actor/prosirenja/pucanje.js'

const OKRET = 0.01
const MOGUCNOST_OKRETA = 0.066
const gravitacija = 3

export default class AvionIgrac extends Player2D {
  constructor(nivoTla, src = 'armies/partizani/potez-25.png') {
    super(src, { skalar: .55, zapaljiv: true })
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

  handleInput() {
    super.handleInput()
    if (keyboard.pressed.Enter)
      this.pucaCiljano()
  }

  nalevo() {
    if (!this.jePrizemljen) super.nalevo()
  }

  nagore() {
    if (this.jeNaVrhu) return

    super.nagore()
    if (this.ugao === 0 || this.ugao >= 2 * Math.PI - MOGUCNOST_OKRETA)
      this.ugao -= OKRET
  }

  nadole() {
    if (this.jePrizemljen) return

    super.nadole()
    if (this.ugao <= MOGUCNOST_OKRETA)
      this.ugao += OKRET
  }

  puca() {
    const poz = { x: this.x + 5, y: this.y + 15 }
    this.pali(poz, this.ugao + Math.PI / 16)
  }

  /** OSTALO ***/

  ispraviAvion() {
    if (keyboard.up || keyboard.down || this.ugao === 0) return
    this.ugao += this.ugao < Math.PI ? -OKRET : OKRET
  }

  proveriTlo() {
    if (!this.jePrizemljen) return
    if (this.ugao > MOGUCNOST_OKRETA / 2) this.umri()
  }

  dodajGravitaciju() {
    if (this.jePrizemljen) return

    const teza = this.mrtav ? gravitacija * 100 : gravitacija
    this.dodajSilu(teza, Math.PI * .5)
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
    this.dodajGravitaciju()
    this.ispraviAvion()
  }
}
