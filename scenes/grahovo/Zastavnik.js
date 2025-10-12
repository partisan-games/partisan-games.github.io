import Predmet from '/core/actor/Predmet.js'
import Zastava from './Zastava.js'

export default class Zastavnik extends Predmet {
  constructor(x, y) {
    super('armies/partizani/vojnici/savo.png', { x, y })
    const zastava = new Zastava({ x: x + 28, y: y - 76 })
    this.predmeti.push(zastava)
  }

  update(dt, t) {
    this.y += Math.cos(t * 4) * dt
  }
}