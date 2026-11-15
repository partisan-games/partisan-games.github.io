import CamacIgracOdozgo from '/core/actor/CamacIgracOdozgo.js'
import platno from '/core/io/platno.js'

/** This boat lives in river coordinates; only its vertical movement has screen bounds. */
export default class Boat extends CamacIgracOdozgo {
  constructor(viewLeft) {
    super()
    this.viewLeft = viewLeft
  }

  get prikazan() {
    const x = this.x - this.viewLeft()
    return this.vidljiv && x + this.sirina / 2 >= 0 && x - this.sirina / 2 <= platno.width &&
      this.y + this.visina / 2 >= 0 && this.y - this.visina / 2 <= platno.height
  }

  proveriGranice() {
    const margin = 75
    if (this.y < margin || this.y > platno.height - margin) {
      this.skreni(2 * Math.PI - this.ugao)
      this.dodajSilu(5)
    }
  }

  dodajStruju() {
    // World coordinates have no shore at x = 0; the current also acts upstream of it.
    this.dodajSilu(6, Math.PI)
  }
}
