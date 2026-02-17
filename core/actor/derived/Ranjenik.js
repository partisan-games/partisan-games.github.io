import Player2D from '/core/actor/Player2D.js'

export default class Ranjenik extends Player2D {
  constructor(x, y) {
    super('armies/ranjeni-partizan.png', { x, y })
    this.komandeNapredne = true
    this.potisak = 3
    this.okret = 0.01
  }

  proveriGranice() {
    this.ograniciUspravno()
  }
}
