import Player2D from '/core/actor/Player2D.js'

export default class VoziloIgracOdozgo extends Player2D {

  constructor(src, param = {}) {
    super(src, param)
    this.potisak = 125
    this.faktorTrenja = 0.3
    this.komandeNapredne = true
  }

  proveriGranice() {
    this.odbija()
  }
}
