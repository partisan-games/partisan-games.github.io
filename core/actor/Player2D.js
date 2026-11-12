import { KRUZNICA, frames } from '/core/konstante.js'
import Predmet from './Predmet.js'
import Input from '/core/io/Input.js'

export default class Player2D extends Predmet {
  constructor(src, { buttonDict, attackKey, ...rest } = {}) {
    super(src, rest)
    this.oznake.add('igrac')
    this.potisak = 31
    this.komandeNapredne = false // ne okreće se oko svoje ose
    this.cvrstaTela = []
    this.okret = 0.047
    this.faktorTrenja = .1
    this.input = new Input({ buttonDict, attackKey })
  }

  handleInput(dt) {
    if (this.input.left) this.nalevo(dt)
    if (this.input.right) this.nadesno(dt)
    if (this.input.up) this.nagore(dt)
    if (this.input.down) this.nadole(dt)
    if (this.input.attack) this.puca()
  }

  nalevo(dt) {
    if (this.komandeNapredne)
      this.ugao -= this.okret * frames(dt, this.tunedFps)
    else
      this.dodajSilu(this.potisak * frames(dt, this.tunedFps), KRUZNICA / 2)
  }

  nadesno(dt) {
    if (this.komandeNapredne)
      this.ugao += this.okret * frames(dt, this.tunedFps)
    else
      this.dodajSilu(this.potisak * frames(dt, this.tunedFps), 0)
  }

  nagore(dt) {
    const ugao = this.komandeNapredne ? this.ugao : -KRUZNICA / 4
    this.dodajSilu(this.potisak * frames(dt, this.tunedFps), ugao)
  }

  nadole(dt) {
    const ugao = this.komandeNapredne ? this.ugao : KRUZNICA / 4
    const potisak = this.komandeNapredne ? (-this.potisak / 2) : this.potisak
    this.dodajSilu(potisak * frames(dt, this.tunedFps), ugao)
  }

  puca() {
    console.log('puca')
  }

  update(dt) {
    super.update(dt)
    this.trenje(this.faktorTrenja, dt)
  }

  end() {
    this.input.end()
  }
}
