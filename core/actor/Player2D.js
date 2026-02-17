import { KRUZNICA } from '/core/konstante.js'
import Predmet from './Predmet.js'
import Input from '/core/io/Input.js'

export default class Player2D extends Predmet {
  constructor(src, params = {}) {
    super(src, params)
    this.oznake.add('igrac')
    this.potisak = 31
    this.komandeNapredne = false // ne okreće se oko svoje ose
    this.cvrstaTela = []
    this.okret = 0.047
    this.faktorTrenja = .1
    this.input = new Input({ animDict: { attack: '' } })
  }

  handleInput() {
    if (this.input.left) this.nalevo()
    if (this.input.right) this.nadesno()
    if (this.input.up) this.nagore()
    if (this.input.down) this.nadole()
    if (this.input.keyboard.space || this.input.attack) this.puca()
  }

  nalevo() {
    if (this.komandeNapredne)
      this.ugao -= this.okret
    else
      this.dodajSilu(this.potisak, KRUZNICA / 2)
  }

  nadesno() {
    if (this.komandeNapredne)
      this.ugao += this.okret
    else
      this.dodajSilu(this.potisak, 0)
  }

  nagore() {
    const ugao = this.komandeNapredne ? this.ugao : -KRUZNICA / 4
    this.dodajSilu(this.potisak, ugao)
  }

  nadole() {
    const ugao = this.komandeNapredne ? this.ugao : KRUZNICA / 4
    const potisak = this.komandeNapredne ? (-this.potisak / 2) : this.potisak
    this.dodajSilu(potisak, ugao)
  }

  puca() {
    console.log('puca')
  }

  update(dt) {
    super.update(dt)
    this.trenje(this.faktorTrenja)
  }

  end() {
    this.input.end()
  }
}
