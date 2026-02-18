import Scena2D from '/core/Scena2D.js'
import { Avionce } from '/core/actor/derived/Avionce.js'
import PokretnaPozadina from './PokretnaPozadina.js'
import Pokretno from './Pokretno.js'
import Oblak from './Oblak.js'
import Neprijatelj from './Neprijatelj.js'
import Baza from './Baza.js'
import { baseControls } from '/ui/Controls.js'

const brojOblaka = 3
const brzina = 150
const LANDING_TIME = 3000

export default class extends Scena2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Enter: 'pucanje' },
      intro: 'Reach the island of Vis.'
    })
  }

  init() {
    this.bojaPozadine = '#165a8d'
    this.preostaloVreme = 60
    this.oblaci = Array.from({ length: brojOblaka }, () => new Oblak(brzina))
    this.ostrvo = new Pokretno('nature/ostrvo.gif', { potisak: brzina, skalar: 2 })
    this.zdravlje = new Pokretno('items/zdravlje.png', { potisak: brzina, skalar: .66, faktorY: 10, senka: true })
    this.player = new Avionce()
    this.neprijatelji = [
      new Neprijatelj('armies/nemci/avioni/avion-odozgo-01.png', { potisak: brzina }),
      new Neprijatelj('armies/nemci/avioni/avion-odozgo-03.png', { potisak: brzina }),
      new Neprijatelj('armies/nemci/avioni/avion-odozgo-05.png', { potisak: brzina }),
      new Neprijatelj('armies/nemci/avioni/Reggiane-Re-2005.png', { potisak: brzina }),
    ]
    this.player.ciljevi = this.neprijatelji
    this.neprijatelji.forEach(neprijatelj => neprijatelj.ciljevi.push(this.player))
    const okean = new PokretnaPozadina(brzina, this.sirina)
    this.add(okean, this.zdravlje, this.ostrvo, ...this.neprijatelji, this.player, ...this.oblaci)
  }

  proveriSudare() {
    if (!this.player.ziv) return

    if (this.player.sudara(this.zdravlje)) {
      this.zdravlje.reset()
      this.player.zivoti++
    }
    this.neprijatelji.forEach(neprijatelj => {
      if (neprijatelj.ziv && this.player.sudara(neprijatelj)) {
        neprijatelj.umri()
        this.player.umri()
      }
    })
  }

  landToBase() {
    this.baza = new Baza({ brzina })
    this.add(this.baza)
    this.neprijatelji.forEach(neprijatelj => {
      neprijatelj.umri()
      setTimeout(() => this.remove(neprijatelj), LANDING_TIME * .5)
    })
    setTimeout(() => this.victory('You have successfully reached the island of Vis.'), LANDING_TIME)
  }

  update(dt, t) {
    super.update(dt, t)
    this.proveriSudare()

    if (this.player.zivoti <= 0) this.defeat()

    if (this.preostaloVreme < 5)
      [this.ostrvo, this.zdravlje].forEach(predmet => this.remove(predmet))

    if (this.preostaloVreme < 1 && !this.baza)
      this.landToBase()

    this.preostaloVreme -= dt
  }

  sceneUI() {
    const hearts = '❤️'.repeat(Math.max(0, this.player.zivoti))
    return /* html */`
      <div class="top-left">
        <div>
          Score: ${this.player.poeni}
          <br>${hearts}
        </div>
      </div>
      `
  }
}
