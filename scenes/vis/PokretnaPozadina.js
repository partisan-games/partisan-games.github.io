import Predmet from '/core/actor/Predmet.js'

export default class PokretnaPozadina extends Predmet {

  constructor(brzina = 10, sirina = window.innerWidth) {
    super('textures/okean.gif', { sirina, z: 2 })
    this.dx = 0
    this.dy = brzina
  }

  onload() {
    this.postavi(this.sirina / 2, 0)
  }

  proveriGranice() {
    if (this.y > this.visina / 2)
      this.y -= this.visina / 2
  }
}
