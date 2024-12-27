import tipke from '/game-engine/io/tipke.js'
import mish from '/game-engine/io/mish.js'
import Igrac from '/game-engine/core/Igrac.js'

export default class Bombas extends Igrac {

  constructor(slika, sirina, visina) {
    super(slika, sirina, visina)
    this.tipke = tipke
    this.mish = mish
    this.potisak = 2.4
    this.prohodnost = 0.7
    this.polozaj(100, 100)
  }

  puca() {
    console.log('bacaBombu')
  }

  reset() {
    this.polozaj(Math.random() * 800, Math.random() * 600)
    this.brzina = 0
  }
}
