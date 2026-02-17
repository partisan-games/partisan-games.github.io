import platno, { crtaNebo } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import AvionIgrac from './AvionIgrac.js'
import VoziloBocno from '/core/actor/VoziloBocno.js'
import Oblak from '/core/objects/Oblak.js'
import Zbun from '/core/objects/Zbun.js'
import Shuma from '/core/objects/Shuma.js'
import Vracanje from '/core/objects/Vracanje.js'
import { baseControls } from '/ui/Controls.js'

const nivoTla = platno.height

const BROJ_OBLAKA = 3
const BROJ_ZBUNOVA = 10
const BROJ_SHUME = 10

const PARALAX_1 = -312
const PARALAX_2 = -187
const PARALAX_3 = -62
const PARALAX_4 = -32

const POTISAK = 5
const MIN_BRZINA = 200
const MAX_BRZINA = 600

const DIZAJ = 10
const MAX_DIGNUTOST = 5555

export default class extends Scena2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Enter: 'Pucanje', V: 'Prateća' },
    })
  }

  init() {
    this.brzinaScene = 0
    this.dignutostScene = 0

    this.aerodrom = new Vracanje({ src: 'buildings/aerodrom.png', tlo: nivoTla, procenat: .25 })
    this.ruina = new Vracanje({ src: 'buildings/ruina.png', tlo: nivoTla, x: -400 })
    this.player = new AvionIgrac(nivoTla)
    this.vozilo = new VoziloBocno('armies/hummel.png', { x: 150, y: nivoTla, skalar: .75, ciljevi: [this.player] })

    this.player.cvrstaTela.push(this.vozilo, this.ruina)
    this.player.ciljevi.push(this.vozilo)
    this.vozilo.ciljevi.push(this.player)

    this.oblaci = Array.from({ length: BROJ_OBLAKA }, () => new Oblak())
    this.zbunovi = Array.from({ length: BROJ_ZBUNOVA }, () => new Zbun())
    this.shume = Array.from({ length: BROJ_SHUME }, () => new Shuma())

    this.add(this.aerodrom, this.player, this.ruina, this.vozilo, ...this.oblaci, ...this.zbunovi, ...this.shume)
    this.pocniParalax()
    this.ui.intro = 'Uništi nemački tenk i bezbedno sleti!'
  }

  get ostaliPredmeti() {
    return this.predmeti.filter(predmet => !predmet.oznake.has('igrac') && !predmet.oznake.has('raketa'))
  }

  pocniParalax() {
    this.zbunovi.forEach(zbun => {
      zbun.dx = PARALAX_1
    })
    this.ruina.dx = PARALAX_2
    this.aerodrom.dx = PARALAX_3
    this.shume.forEach(shuma => {
      shuma.dx = PARALAX_3
    })
    this.oblaci.forEach(oblak => {
      oblak.dx = PARALAX_4
    })
  }

  zaustaviParalax() {
    this.ostaliPredmeti
      .filter(predmet => !predmet.oznake.has('neprijatelj'))
      .forEach(predmet => {
        predmet.dx *= 0.9
      })
    this.brzinaScene = 0
  }

  ubrzavaOstale(ugao, pomak) {
    this.ostaliPredmeti.forEach(predmet => predmet.dodajSilu(pomak, ugao))
    this.brzinaScene += pomak
  }

  dizePredmete(pomak) {
    this.ostaliPredmeti.forEach(predmet => {
      predmet.y += pomak
    })
    this.dignutostScene += pomak
  }

  proveriSmrt() {
    if (this.vozilo.mrtav) this.vozilo.dx = PARALAX_1 - this.brzinaScene
    if (!this.player.mrtav) return

    if (this.dignutostScene > 0)
      this.dizePredmete(-DIZAJ * .5)

    this.zaustaviParalax()
    this.defeat('Slavno si pao.')
  }

  proveriTlo() {
    if (this.player.jePrizemljen && this.dignutostScene <= 0) {
      this.zaustaviParalax()
      if (this.player.ziv && this.vozilo.mrtav) this.victory('Misija je uspešno završena!')
    }
  }

  clear() {
    crtaNebo(nivoTla + this.dignutostScene, 'blue', 'lightblue', this.dignutostScene)
  }

  handleInput() {
    super.handleInput()
    if (!this.player.ziv) return

    if (this.player.input.right && this.brzinaScene < MAX_BRZINA)
      this.ubrzavaOstale(Math.PI, POTISAK)

    if (this.player.input.left && this.brzinaScene >= MIN_BRZINA)
      this.ubrzavaOstale(Math.PI, -POTISAK)

    if (this.player.input.up && this.dignutostScene - DIZAJ < MAX_DIGNUTOST) {
      if (this.player.y < this.visina * 0.5)
        this.dizePredmete(DIZAJ)
      if (this.brzinaScene === 0) this.pocniParalax() // kada avion ponovo uzlece
    }

    if (this.player.input.down && this.dignutostScene - DIZAJ >= 0)
      this.dizePredmete(-DIZAJ * 2)
  }

  update(dt, t) {
    super.update(dt, t)
    this.vozilo.patroliraj()
    this.proveriTlo()
    this.proveriSmrt()
  }
}
