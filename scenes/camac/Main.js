import Scena2D from '/core/Scena2D.js'
import CamacIgracOdozgo from '/core/actor/CamacIgracOdozgo.js'
import Obala from './Obala.js'

export default class extends Scena2D {
  init() {
    this.player = new CamacIgracOdozgo()
    this.obala = new Obala()
    this.add(this.obala, this.player)
    this.poslednjiX = this.player.x
    this.bojaPozadine = '#000066'
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.player.x > this.poslednjiX + 25) {
      this.obala.napred()
      this.poslednjiX = this.player.x
    }
    if (this.player.x + 25 < this.poslednjiX) {
      this.obala.nazad()
      this.poslednjiX = this.player.x
    }
  }
}
