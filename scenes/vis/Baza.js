import Predmet from '/core/actor/Predmet.js'
import { platno, ctx } from '/core/io/platno.js'

export default class Baza extends Predmet {
  constructor({ brzina, ...rest }) {
    super('vis.png', { x: 0, y: -platno.height, z: 1, sirina: platno.width, ishodiste: 'GORE_LEVO', senka: false, ...rest })
    this.korak = brzina
  }

  update(dt) {
    if (this.y + this.korak < 0)
      this.y += this.korak * dt
  }

  render() {
    ctx.drawImage(this.slika, 0, this.y, this.sirina, this.visina)
  }
}
