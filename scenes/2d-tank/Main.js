import platno, { crtaNeboZemlju } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import { progresBar } from '/ui/components.js'
import Zbun from '/core/objects/Zbun.js'
import Shuma from '/core/objects/Shuma.js'
import Planina from '/core/objects/Planina.js'
import Oblak from '/core/objects/Oblak.js'
import TenkLevo from '../tenkici/TenkLevo.js'
import CombatTarget from './CombatTarget.js'
import Bunker from './Bunker.js'
import { createCannon } from './BunkerWeapons.js'
import { tankLeftControls } from '/ui/Controls.js'

const BROJ_OBLAKA = 3
const BROJ_ZBUNOVA = 10
const PARALAX_1 = -160
const LEVEL_LENGTH = null // Scroll pixels; choose the length when the level content is ready.

export default class extends Scena2D {
  constructor() {
    super({ controlKeys: tankLeftControls, intro: 'Uništi ustaške bunkere, pazi civilne zgrade.' })
  }

  init() {
    this.groundY = platno.height * .75
    const nivoTla = this.groundY
    this.score = 0
    this.distance = 0
    this.levelLength = LEVEL_LENGTH
    this.tenk = new TenkLevo({ y: nivoTla, groundY: nivoTla, skalar: .4, xLimit: platno.width * .9, clock: this.session.clock })

    const planina = new Planina({ nivoTla, dx: PARALAX_1 })
    const shumarak = new Shuma(nivoTla, PARALAX_1)
    const zbunovi = Array.from({ length: BROJ_ZBUNOVA }, () => new Zbun(nivoTla, PARALAX_1))
    const oblaci = Array.from({ length: BROJ_OBLAKA }, () => new Oblak(nivoTla - 100, PARALAX_1))

    const bunkerCallback = () => this.score++
    const zgradaCallback = source => {
      if (source === 'enemy') return
      this.ui.showMessage('No! Destruction of civilian buildings is a war crime.')
      this.score--
    }

    this.zgrade = [
      new CombatTarget({ src: 'buildings/crkva-01.png', tlo: nivoTla + 5, skalar: .5, zapaljiv: true, brzina: PARALAX_1, callback: zgradaCallback }),
      new CombatTarget({ src: 'buildings/kuca-07.png', tlo: nivoTla + 5, skalar: .75, zapaljiv: true, brzina: PARALAX_1, callback: zgradaCallback }),
    ]
    const bunkerOptions = { clock: this.session.clock, target: this.tenk, groundY: nivoTla, obstacles: this.zgrade, callback: bunkerCallback, zapaljiv: true, brzina: PARALAX_1 }
    this.bunkeri = [
      new Bunker({ ...bunkerOptions, src: 'buildings/kuca-bunker.png', tlo: nivoTla + 15, skalar: .33 }),
      new Bunker({ ...bunkerOptions, src: 'buildings/bunker-02.png', tlo: nivoTla + 5, skalar: .5, createWeapon: createCannon }),
    ]
    this.add(planina, shumarak, ...this.bunkeri, ...this.zgrade, ...zbunovi, this.tenk, ...oblaci)
    this.tenk.ciljevi.push(...this.bunkeri, ...this.zgrade)
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.distance += Math.abs(PARALAX_1) * dt
    super.update(dt, t)
    this.bunkeri.forEach(bunker => bunker.checkHits())
    if (this.tenk.dead) this.defeat('Tvoj tenk je uništen.')
  }

  clear() {
    crtaNeboZemlju(this.groundY)
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
