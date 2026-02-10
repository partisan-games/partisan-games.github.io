import platno, { crtaNeboZemlju } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import { progresBar } from '/ui/components.js'
import Zbun from '/core/objects/Zbun.js'
import Shuma from '/core/objects/Shuma.js'
import Planina from '/core/objects/Planina.js'
import Oblak from '/core/objects/Oblak.js'
import TenkLevo from '../tenkici/TenkLevo.js'
import Vracanje from '/core/objects/Vracanje.js'
import { tankLeftControls } from '/ui/Controls.js'

const BROJ_OBLAKA = 3
const BROJ_ZBUNOVA = 10
const PARALAX_1 = -160
const nivoTla = platno.height * .75

export default class extends Scena2D {
  constructor() {
    super({ controlKeys: tankLeftControls, intro: 'Uništi ustaške bunkere, pazi civilne zgrade.' })
  }

  init() {
    this.score = 0
    this.tenk = new TenkLevo({ y: nivoTla, skalar: .4, xLimit: platno.width * .9 })

    const planina = new Planina({ nivoTla, dx: PARALAX_1 })
    const shumarak = new Shuma(nivoTla, PARALAX_1)
    const zbunovi = Array.from({ length: BROJ_ZBUNOVA }, () => new Zbun(nivoTla, PARALAX_1))
    const oblaci = Array.from({ length: BROJ_OBLAKA }, () => new Oblak(nivoTla - 100, PARALAX_1))

    const bunkerCallback = () => this.score++
    const zgradaCallback = () => {
      this.ui.showMessage('No! Destruction of civilian buildings is a war crime.')
      this.score--
    }

    this.bunkeri = [
      new Vracanje({ src: 'buildings/kuca-bunker.png', tlo: nivoTla + 15, skalar: .33, zapaljiv: true, brzina: PARALAX_1, callback: bunkerCallback }),
      new Vracanje({ src: 'buildings/bunker-02.png', tlo: nivoTla + 5, skalar: .5, zapaljiv: true, brzina: PARALAX_1, callback: bunkerCallback }),
    ]
    this.zgrade = [
      new Vracanje({ src: 'buildings/crkva-01.png', tlo: nivoTla + 5, skalar: .5, zapaljiv: true, brzina: PARALAX_1, callback: zgradaCallback }),
      new Vracanje({ src: 'buildings/kuca-07.png', tlo: nivoTla + 5, skalar: .75, zapaljiv: true, brzina: PARALAX_1, callback: zgradaCallback }),
    ]
    this.add(planina, shumarak, ...this.bunkeri, ...this.zgrade, ...zbunovi, this.tenk, ...oblaci)
    this.tenk.ciljevi.push(...this.bunkeri, ...this.zgrade)
  }

  clear() {
    crtaNeboZemlju(nivoTla)
  }

  sceneUI() {
    return /* html */`
      <main class="top-left">
        Score: ${this.score}
        ${progresBar(this.tenk.energija)}
      </main>
    `
  }
}
