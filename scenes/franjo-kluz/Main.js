import platno, { crtaNebo } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import AvionIgrac from '/core/actor/derived/AvionIgrac.js'
import VoziloBocno from '/core/actor/VoziloBocno.js'
import Oblak from '/core/objects/Oblak.js'
import Zbun from '/core/objects/Zbun.js'
import Shuma from '/core/objects/Shuma.js'
import Vracanje from '/core/objects/Vracanje.js'
import { baseControls } from '/ui/Controls.js'
import { frames } from '/core/konstante.js'

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
      controlKeys: { ...baseControls, Enter: 'Shoot', V: 'Homing missile' },
    })
  }

  init() {
    this.brzinaScene = 0
    this.dignutostScene = 0

    this.aerodrom = new Vracanje({ src: 'buildings/aerodrom.png', tlo: nivoTla, procenat: .25 })
    this.ruina = new Vracanje({ src: 'buildings/ruina.png', tlo: nivoTla, x: -400 })
    this.player = new AvionIgrac(nivoTla, undefined, { session: this.session })
    this.vozilo = new VoziloBocno('armies/hummel.png', { x: 150, y: nivoTla, skalar: .75, session: this.session })

    this.player.cvrstaTela.push(this.vozilo, this.ruina)
    this.player.ciljevi.push(this.vozilo)
    this.vozilo.ciljevi.push(this.player)

    this.oblaci = Array.from({ length: BROJ_OBLAKA }, () => new Oblak())
    this.zbunovi = Array.from({ length: BROJ_ZBUNOVA }, () => new Zbun())
    this.shume = Array.from({ length: BROJ_SHUME }, () => new Shuma())

    this.add(this.aerodrom, this.player, this.ruina, this.vozilo, ...this.oblaci, ...this.zbunovi, ...this.shume)
    this.pocniParalax()
    this.ui.intro = 'Destroy the German tank and land safely!'
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

  zaustaviParalax(dt) {
    const kocenje = 0.9 ** frames(dt)
    this.ostaliPredmeti
      .filter(predmet => !predmet.oznake.has('neprijatelj'))
      .forEach(predmet => {
        predmet.dx *= kocenje
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

  proveriSmrt(dt) {
    if (this.vozilo.dead) this.vozilo.dx = PARALAX_1 - this.brzinaScene
    if (!this.player.dead) return

    if (this.dignutostScene > 0)
      this.dizePredmete(-DIZAJ * .5 * frames(dt))

    this.zaustaviParalax(dt)
    this.defeat('You fell gloriously.')
  }

  proveriTlo(dt) {
    if (this.player.jePrizemljen && this.dignutostScene <= 0) {
      this.zaustaviParalax(dt)
      if (this.player.alive && this.vozilo.dead) this.victory('Mission successfully completed!')
    }
  }

  clear() {
    crtaNebo(nivoTla + this.dignutostScene, 'blue', 'lightblue', this.dignutostScene)
  }

  handleInput(dt) {
    super.handleInput(dt)
    if (this.ui.outro || !this.player.alive) return

    const potisak = POTISAK * frames(dt)
    const dizanje = DIZAJ * frames(dt)

    if (this.player.input.right && this.brzinaScene < MAX_BRZINA)
      this.ubrzavaOstale(Math.PI, potisak)

    if (this.player.input.left && this.brzinaScene >= MIN_BRZINA)
      this.ubrzavaOstale(Math.PI, -potisak)

    if (this.player.input.up && this.dignutostScene - dizanje < MAX_DIGNUTOST) {
      if (this.player.y < this.visina * 0.5)
        this.dizePredmete(dizanje)
      if (this.brzinaScene === 0) this.pocniParalax() // kada avion ponovo uzlece
    }

    if (this.player.input.down && this.dignutostScene - dizanje >= 0)
      this.dizePredmete(-dizanje * 2)
  }

  update(dt, t) {
    super.update(dt, t)
    this.vozilo.patroliraj()
    this.proveriTlo(dt)
    this.proveriSmrt(dt)
  }
}
