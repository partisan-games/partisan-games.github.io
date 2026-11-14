import platno, { crtaNeboZemlju } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import { progresBar } from '/ui/components.js'
import Zbun from '/core/objects/Zbun.js'
import Shuma from '/core/objects/Shuma.js'
import Planina from '/core/objects/Planina.js'
import Oblak from '/core/objects/Oblak.js'
import Vracanje from '/core/objects/Vracanje.js'
import TenkLevo from '../tenkici/TenkLevo.js'
import Bunker from './Bunker.js'
import createGroundEnemies from './GroundEnemies.js'
import prepareCombatAssets from './prepareCombatAssets.js'
import CombatLayers from './CombatLayers.js'
import { tankLeftControls } from '/ui/Controls.js'

const BROJ_OBLAKA = 3
const BROJ_ZBUNOVA = 10
const PARALAX_1 = -160
const LEVEL_LENGTH = null // Scroll pixels; choose the length when the level content is ready.

export default class extends Scena2D {
  constructor() {
    super({ controlKeys: tankLeftControls, intro: 'Uništi osovinska uporišta i vozila.' })
  }

  async init() {
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
    this.zgrade = [
      new Vracanje({ src: 'buildings/crkva-01.png', tlo: nivoTla + 5, skalar: .5, brzina: PARALAX_1 }),
      new Vracanje({ src: 'buildings/kuca-07.png', tlo: nivoTla + 5, skalar: .75, brzina: PARALAX_1 }),
    ]
    const bunkerOptions = { clock: this.session.clock, target: this.tenk, groundY: nivoTla, callback: bunkerCallback, zapaljiv: true, brzina: PARALAX_1 }
    this.bunkeri = [
      new Bunker({ ...bunkerOptions, src: 'buildings/kuca-bunker.png', tlo: nivoTla + 15, skalar: .33 }),
      new Bunker({ ...bunkerOptions, src: 'buildings/bunker-02.png', tlo: nivoTla + 5, skalar: .5 }),
    ]
    this.enemies = createGroundEnemies({ clock: this.session.clock, target: this.tenk, groundY: nivoTla, scrollSpeed: PARALAX_1, callback: bunkerCallback })
    this.add(planina, shumarak, ...this.bunkeri, ...this.zgrade, ...this.enemies, ...zbunovi, this.tenk, ...oblaci)
    this.tenk.ciljevi.push(...this.bunkeri, ...this.enemies)
    const pools = [this.tenk.granate, ...[...this.bunkeri, ...this.enemies]
      .filter(shooter => shooter.fire).map(shooter => shooter.fire.projectiles)]
    const combatReady = prepareCombatAssets(pools)
    await Promise.all([combatReady, this.slikeUcitane()])
    if (!this.session.active) return
    this.combatLayers = new CombatLayers([this.tenk, ...this.bunkeri, ...this.enemies])
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.distance += Math.abs(PARALAX_1) * dt
    super.update(dt, t)
    this.bunkeri.forEach(bunker => bunker.checkHits())
    this.enemies.forEach(enemy => enemy.checkHits())
    this.combatLayers.update()
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
