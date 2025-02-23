import Predmet from '/core/actor/Predmet.js'

export default class Strelac extends Predmet {
  constructor(x, y) {
    super('armies/partizani/vojnici/partizan-30.png', { x, y })
    this.pocetniX = x
    this.ucestalost = 3
    this.poslednje = 0
  }

  update(dt, t) {
    this.y += Math.sin(t) * dt

    if (this.x < this.pocetniX) this.x += 20 * dt

    if (t >= this.ucestalost + this.poslednje) {
      this.x -= 5
      this.poslednje = t
    }
  }
}