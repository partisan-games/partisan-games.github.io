import { KRUZNICA } from '/game-engine/konstante.js'
import Predmet from '/game-engine/core/Predmet.js'

export default class VoziloBocno extends Predmet {

  constructor(nivoTla, src, sirina, visina) {
    super(src, sirina, visina)
    this.dodajSilu(3)
    this.x = 100
    this.y = nivoTla - this.visina / 2
    this.zapaljiv = true
  }

  patroliraj() {
    if (this.mrtav) return
    if (this.x <= 150) {
      this.ugao = 0
      this.skalarY = 1
      this.brzina = 3
    }
    if (this.x >= 600) {
      this.ugao = KRUZNICA / 2
      this.skalarY = -1
      this.brzina = 3
    }
  }

}
