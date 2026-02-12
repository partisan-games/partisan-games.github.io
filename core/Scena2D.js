import Scena from './Scena.js'
import Renderer2D from './Renderer2D.js'
import { platno } from '/core/io/platno.js'

export default class Scena2D extends Scena {
  constructor({ canvas = platno, ...params }) {
    super({ canvas, ...params })
    this.bojaPozadine = null
    this.renderer = new Renderer2D()
  }

  clear() {
    this.renderer.clear({ pozadina: this.pozadina, bojaPozadine: this.bojaPozadine })
  }

  render() {
    this.renderer.crtaPredmete(this.predmeti)
  }
}
