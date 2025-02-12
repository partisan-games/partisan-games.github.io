import Scena2D from '/core/actor/Scena2D.js'
import Predmet from '/core/actor/Predmet.js'
import Pozadina from '/core/actor/Pozadina.js'
import TenkOdozgo from './TenkOdozgo.js'
import Ranjenik from '../ranjenik/Ranjenik.js'

export default class JasenovacScena extends Scena2D {
  init() {
    this.pozadina = new Pozadina('teksture/beton.gif')
    this.tenk = new TenkOdozgo(100, 200)
    this.ranjenik = new Ranjenik(this.sirina / 4, this.visina / 2)

    const zica = new Predmet('stvari/bodljikava-zica.gif', { x: 400, y: 100 })
    this.dodaj(zica, this.ranjenik, this.tenk)
  }

  update(dt) {
    super.update(dt)
    this.tenk.patroliraj()
  }

  sablon() {
    return /* html */`
      <h1 class="absolute full centar">Bekstvo iz Jasenovca</h1>
      <div class='komande bg-poluprovidno komande1'>
        A - levo<br>
        D - desno<br>
        W - napred<br>
        S - nazad<br>
      </div>
    `
  }
}
