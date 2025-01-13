import Predmet from '/game-engine/core/Predmet.js'
import { izasaoIgde } from '/game-engine/utils/granice.js'

export default class Metak extends Predmet {

  constructor({ src = 'granata.gif', skalar = .5, potisak = 1000, ...rest } = {}) {
    super(src, { skalar, ...rest })
    this.potisak = potisak
    this.reset()
  }

  reset() {
    this.nestani()
    this.ispaljeno = false
  }

  postavi(polozaj, ugao) {
    this.polozaj = polozaj
    this.ugao = ugao
  }

  pali(polozaj, ugao, potisak = this.potisak) {
    this.postavi(polozaj, ugao)
    this.pokazi()
    this.dodajSilu(potisak)
    this.ispaljeno = true
  }

  proveriGranice() {
    if (izasaoIgde(this)) this.reset()
  }
}
